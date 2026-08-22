import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { transactionRepo } from '../db/repositories/transaction.repo.js';
import { sessionRepo } from '../db/repositories/session.repo.js';
import { productRepo } from '../db/repositories/product.repo.js';
import { socketManager } from '../sockets/socketManager.js';
import { Transaction, TransactionItem } from '../types/index.js';

/** Normalize a transaction so both `name` and `productName` are always present on items,
 * confidence is integer 0-100, and a formatted timestamp is included. */
function normalizeTransaction(t: Transaction) {
  const items = (t.items || []).map((item) => ({
    ...item,
    // ensure both aliases exist regardless of which one the frontend reads
    name: item.productName || (item as any).name || 'Unknown',
    productName: item.productName || (item as any).name || 'Unknown',
  }));

  // confidence stored as 0-100 integer in seed; guard against 0-1 float from old records
  const confidenceRaw = t.confidence ?? 100;
  const confidence = confidenceRaw <= 1 ? Math.round(confidenceRaw * 100) : Math.round(confidenceRaw);

  const ts = t.timestamp ? new Date(t.timestamp) : null;
  const formattedTime = ts
    ? ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : null;
  const formattedDate = ts
    ? ts.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    : null;

  return { ...t, items, confidence, formattedTime, formattedDate };
}

export class TransactionController {
  public async listTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.query.merchantId ? String(req.query.merchantId) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const transactions = await transactionRepo.findRecent(limit, merchantId);
      res.json({ success: true, data: transactions.map(normalizeTransaction) });
    } catch (err) {
      next(err);
    }
  }

  public async getTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const transaction = await transactionRepo.findById(id);
      if (!transaction) {
        res.status(404).json({ success: false, error: 'Transaction not found' });
        return;
      }
      res.json({ success: true, data: normalizeTransaction(transaction) });
    } catch (err) {
      next(err);
    }
  }

  public async confirmTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { items, totalAmount, sessionId } = req.body;

      let transaction = await transactionRepo.findById(id);

      if (!transaction && sessionId) {
        // Create confirmed transaction from session
        const session = await sessionRepo.findById(sessionId);
        if (!session) {
          res.status(404).json({ success: false, error: 'Session not found' });
          return;
        }

        const formattedItems: TransactionItem[] = [];
        let totalCost = 0;

        for (const item of items || []) {
          const product = await productRepo.findById(item.productId);
          const costPrice = product ? product.costPrice : Math.round(item.unitPrice * 0.75);
          const itemTotalCost = costPrice * item.quantity;
          const totalPrice = item.unitPrice * item.quantity;

          formattedItems.push({
            productId: item.productId,
            productName: item.productName || product?.name || 'Item',
            category: product ? product.category : 'General',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            costPrice,
            totalPrice,
            profit: totalPrice - itemTotalCost,
          });
          totalCost += itemTotalCost;
        }

        const amount = totalAmount || session.payment?.amount || 0;

        transaction = {
          id: `TXN-${Date.now()}-${uuidv4().substring(0, 4).toUpperCase()}`,
          merchantId: session.merchantId,
          sessionId: session.id,
          items: formattedItems,
          totalAmount: amount,
          totalCost,
          totalProfit: amount - totalCost,
          paymentMethod: session.payment?.method || 'QR',
          paymentReference: session.payment?.referenceId || 'SIMULATED-UPI',
          confidence: 100,
          isConfirmed: true,
          timestamp: new Date().toISOString(),
        };

        await transactionRepo.create(transaction);
        await sessionRepo.update(sessionId, { status: 'COMPLETED' });
      } else if (transaction) {
        transaction = await transactionRepo.update(id, { isConfirmed: true, items, totalAmount });
      }

      socketManager.emitEvent('transaction:confirmed', transaction, transaction?.merchantId);
      res.json({ success: true, data: transaction });
    } catch (err) {
      next(err);
    }
  }
}

export const transactionController = new TransactionController();
