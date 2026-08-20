import { Request, Response, NextFunction } from 'express';
import { paymentSimulator } from '../simulator/paymentSimulator.js';
import { sessionRepo } from '../db/repositories/session.repo.js';
import { reconciler } from '../context-engine/reconciler.js';
import { socketManager } from '../sockets/socketManager.js';
import { SessionController } from './session.controller.js';
import { db } from '../db/database.js';

export class PaymentController {
  public async simulatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, merchantId = 'M001', sessionId, method = 'QR' } = req.body;

      if (!amount || Number(amount) <= 0) {
        res.status(400).json({ success: false, error: 'Valid amount is required' });
        return;
      }

      // Find target session
      const targetSession = sessionId
        ? await sessionRepo.findById(sessionId)
        : await sessionRepo.findActive(merchantId);

      const payment = await paymentSimulator.simulate({
        amount: Number(amount),
        merchantId,
        sessionId: targetSession?.id,
        method,
      });

      socketManager.emitEvent('payment:received', payment, merchantId);

      if (targetSession) {
        // Update session with payment
        const updatedSession = await sessionRepo.update(targetSession.id, {
          payment,
          status: 'PAYMENT_RECEIVED',
        });

        // If extraction is already present, perform reconciliation
        if (updatedSession?.extraction) {
          const reconciliation = await reconciler.reconcile(
            updatedSession,
            payment,
            updatedSession.merchantId
          );

          const finalStatus = reconciliation.isMatched ? 'MATCHED' : 'CONFIRMATION_REQUIRED';
          const finalized = await sessionRepo.update(updatedSession.id, {
            status: finalStatus,
            reconciliation,
            completedAt: new Date().toISOString(),
          });

          if (reconciliation.isMatched && finalized) {
            await SessionController.saveFinalTransaction(finalized);
          }

          socketManager.emitEvent('session:reconciled', finalized, merchantId);

          res.json({
            success: true,
            data: {
              payment,
              session: finalized,
            },
          });
          return;
        }

        res.json({
          success: true,
          data: {
            payment,
            session: updatedSession,
          },
        });
        return;
      }

      res.json({ success: true, data: { payment } });
    } catch (err) {
      next(err);
    }
  }

  public async listPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payments = db.getState().payments;
      res.json({ success: true, data: payments.slice(-20).reverse() });
    } catch (err) {
      next(err);
    }
  }
}

export const paymentController = new PaymentController();
