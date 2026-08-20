import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sessionRepo } from '../db/repositories/session.repo.js';
import { transactionRepo } from '../db/repositories/transaction.repo.js';
import { productRepo } from '../db/repositories/product.repo.js';
import { sarvamSTT } from '../ai/sarvam.js';
import { transactionExtractor } from '../ai/extractor.js';
import { reconciler } from '../context-engine/reconciler.js';
import { socketManager } from '../sockets/socketManager.js';
import { TransactionSession, Transaction, TransactionItem } from '../types/index.js';
import { lostSalesRepo } from '../db/repositories/offer.repo.js';

export class SessionController {
  public async startSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = (req.body.merchantId as string) || 'M001';
      const session: TransactionSession = {
        id: `SESSION-${Date.now()}-${uuidv4().substring(0, 4).toUpperCase()}`,
        merchantId,
        status: 'LISTENING',
        startedAt: new Date().toISOString(),
      };

      await sessionRepo.create(session);
      socketManager.emitEvent('session:started', session, merchantId);

      res.status(201).json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }

  public async getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const session = await sessionRepo.findById(id);
      if (!session) {
        res.status(404).json({ success: false, error: 'Session not found' });
        return;
      }
      res.json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }

  public async listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.query.merchantId ? String(req.query.merchantId) : undefined;
      const sessions = await sessionRepo.findAll(merchantId);
      res.json({ success: true, data: sessions });
    } catch (err) {
      next(err);
    }
  }

  public async uploadAudio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const file = req.file;

      if (!file) {
        res.status(400).json({ success: false, error: 'No audio file uploaded' });
        return;
      }

      let session = await sessionRepo.findById(id);
      if (!session) {
        session = {
          id,
          merchantId: 'M001',
          status: 'PROCESSING',
          startedAt: new Date().toISOString(),
        };
        await sessionRepo.create(session);
      }

      await sessionRepo.update(id, { status: 'PROCESSING', audioPath: file.path });
      socketManager.emitEvent('session:processing', { sessionId: id, status: 'PROCESSING' });

      // 1. Speech to text
      const sttResult = await sarvamSTT.transcribeAudio(file.path);

      // 2. Transaction extraction
      const extraction = await transactionExtractor.extract(sttResult.transcript, sttResult.language);

      // Record lost sales if detected
      if (extraction.isLostSale && extraction.lostSaleProduct) {
        await lostSalesRepo.recordRequest(extraction.lostSaleProduct);
      }

      // 3. Update session
      const updated = await sessionRepo.update(id, {
        status: 'ANALYZING',
        transcript: sttResult.transcript,
        extraction,
      });

      socketManager.emitEvent('session:extracted', updated, session?.merchantId || 'M001');

      // 4. Auto-reconcile if payment is already present
      if (updated?.payment) {
        const reconciliation = await reconciler.reconcile(updated, updated.payment, updated.merchantId);
        const finalStatus = reconciliation.isMatched ? 'MATCHED' : 'CONFIRMATION_REQUIRED';
        const finalized = await sessionRepo.update(id, {
          status: finalStatus,
          reconciliation,
          completedAt: new Date().toISOString(),
        });

        if (reconciliation.isMatched && finalized) {
          await SessionController.saveFinalTransaction(finalized);
        }

        socketManager.emitEvent('session:reconciled', finalized, session?.merchantId || 'M001');
        res.json({ success: true, data: finalized });
        return;
      }

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  public async submitTranscript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { transcript, language } = req.body;

      if (!transcript) {
        res.status(400).json({ success: false, error: 'Transcript is required' });
        return;
      }

      let session = await sessionRepo.findById(id);
      if (!session) {
        session = {
          id,
          merchantId: 'M001',
          status: 'PROCESSING',
          startedAt: new Date().toISOString(),
        };
        await sessionRepo.create(session);
      }

      const extraction = await transactionExtractor.extract(transcript, language || 'hi');

      if (extraction.isLostSale && extraction.lostSaleProduct) {
        await lostSalesRepo.recordRequest(extraction.lostSaleProduct);
      }

      const updated = await sessionRepo.update(id, {
        status: 'ANALYZING',
        transcript,
        extraction,
      });

      socketManager.emitEvent('session:extracted', updated, session?.merchantId || 'M001');

      if (updated?.payment) {
        const reconciliation = await reconciler.reconcile(updated, updated.payment, updated.merchantId);
        const finalStatus = reconciliation.isMatched ? 'MATCHED' : 'CONFIRMATION_REQUIRED';
        const finalized = await sessionRepo.update(id, {
          status: finalStatus,
          reconciliation,
          completedAt: new Date().toISOString(),
        });

        if (reconciliation.isMatched && finalized) {
          await SessionController.saveFinalTransaction(finalized);
        }

        socketManager.emitEvent('session:reconciled', finalized, session?.merchantId || 'M001');
        res.json({ success: true, data: finalized });
        return;
      }

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  public static async saveFinalTransaction(session: TransactionSession): Promise<Transaction | null> {
    if (!session.reconciliation) return null;

    const items: TransactionItem[] = [];
    let totalCost = 0;

    for (const item of session.reconciliation.matchedItems) {
      const product = await productRepo.findById(item.productId);
      const costPrice = product ? product.costPrice : Math.round(item.unitPrice * 0.75);
      const itemTotalCost = costPrice * item.quantity;
      const profit = item.totalPrice - itemTotalCost;

      items.push({
        productId: item.productId,
        productName: item.productName,
        category: product ? product.category : 'General',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice,
        totalPrice: item.totalPrice,
        profit,
      });

      totalCost += itemTotalCost;

      if (product) {
        await productRepo.updateStock(product.id, item.quantity);
      }
    }

    const totalAmount = session.payment?.amount || session.reconciliation.receivedAmount;
    const totalProfit = totalAmount - totalCost;

    const txn: Transaction = {
      id: `TXN-${Date.now()}-${uuidv4().substring(0, 4).toUpperCase()}`,
      merchantId: session.merchantId,
      sessionId: session.id,
      items,
      totalAmount,
      totalCost,
      totalProfit,
      paymentMethod: session.payment?.method || 'QR',
      paymentReference: session.payment?.referenceId || 'SIMULATED-UPI',
      confidence: session.reconciliation.confidence,
      isConfirmed: true,
      timestamp: new Date().toISOString(),
    };

    await transactionRepo.create(txn);
    socketManager.emitEvent('transaction:created', txn, session.merchantId);
    return txn;
  }
}

export const sessionController = new SessionController();
