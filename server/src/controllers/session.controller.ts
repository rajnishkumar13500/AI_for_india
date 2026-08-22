import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { sessionRepo } from '../db/repositories/session.repo.js';
import { transactionRepo } from '../db/repositories/transaction.repo.js';
import { productRepo } from '../db/repositories/product.repo.js';
import { sarvamSTT } from '../ai/sarvam.js';
import { transactionExtractor } from '../ai/extractor.js';
import { productResolver } from '../context-engine/resolver.js';
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

  /** Returns the most recent active (non-completed/cancelled) session.
   *  Used by the device UI to restore state on page refresh or reconnect. */
  public async getActiveSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.query.merchantId ? String(req.query.merchantId) : 'M001';
      const session = await sessionRepo.findActive(merchantId);
      res.json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }

  public async uploadAudio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const file = req.file;

      console.log(`\n=======================================================`);
      console.log(`[Session DEBUG] Audio upload request received for session: ${id}`);
      console.log(`[Session DEBUG] File details:`, file ? { filename: file.filename, originalname: file.originalname, size: file.size, mimetype: file.mimetype } : 'NO FILE');

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

      // 1. Speech to text via Sarvam AI
      console.log(`[Session DEBUG] Calling Sarvam STT transcribeAudio...`);
      const sttResult = await sarvamSTT.transcribeAudio(file.path);
      console.log(`[Session DEBUG] STT Result: "${sttResult.transcript}" (language: ${sttResult.language})`);

      // 2. Transaction extraction via Sarvam LLM
      console.log(`[Session DEBUG] Calling TransactionExtractor on transcript...`);
      const extraction = await transactionExtractor.extract(sttResult.transcript, sttResult.language);
      console.log(`[Session DEBUG] Extraction Result:`, JSON.stringify(extraction, null, 2));

      // Resolve each product against product catalog to get actual sellingPrice and canonical name
      for (const p of extraction.products) {
        const resolved = await productResolver.resolve(p.name, session?.merchantId || 'M001');
        if (resolved.matched && resolved.product) {
          p.name = resolved.product.name;
          p.unitPrice = resolved.product.sellingPrice;
          (p as any).productId = resolved.product.id;
          (p as any).category = resolved.product.category;
        }
      }

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

      console.log(`[Session DEBUG] Session ${id} successfully updated with extracted products.\n=======================================================\n`);
      res.json({ success: true, data: updated });
    } catch (err) {
      console.error('[Session DEBUG] Error in uploadAudio:', err);
      next(err);
    }
  }

  public async submitTranscript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { transcript, language = 'hi' } = req.body;

      console.log(`\n=======================================================`);
      console.log(`[Session DEBUG] submitTranscript received for session: ${id}`);
      console.log(`[Session DEBUG] Transcript: "${transcript}" (language: ${language})`);

      if (!transcript || typeof transcript !== 'string') {
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

      const extraction = await transactionExtractor.extract(transcript, language);
      console.log(`[Session DEBUG] submitTranscript Extraction:`, JSON.stringify(extraction, null, 2));

      // Resolve each product against product catalog to get actual sellingPrice and canonical name
      for (const p of extraction.products) {
        const resolved = await productResolver.resolve(p.name, session?.merchantId || 'M001');
        if (resolved.matched && resolved.product) {
          p.name = resolved.product.name;
          p.unitPrice = resolved.product.sellingPrice;
          (p as any).productId = resolved.product.id;
          (p as any).category = resolved.product.category;
        }
      }

      if (extraction.isLostSale && extraction.lostSaleProduct) {
        await lostSalesRepo.recordRequest(extraction.lostSaleProduct);
      }

      const updated = await sessionRepo.update(id, {
        status: 'ANALYZING',
        transcript,
        extraction,
      });

      socketManager.emitEvent('session:extracted', updated, session?.merchantId || 'M001');
      res.json({ success: true, data: updated });
    } catch (err) {
      console.error('[Session DEBUG] Error in submitTranscript:', err);
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
