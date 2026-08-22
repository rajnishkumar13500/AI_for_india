import { Request, Response, NextFunction } from 'express';
import { DEMO_SCENARIOS } from '../simulator/scenarios.js';
import { SessionController } from './session.controller.js';
import { paymentSimulator } from '../simulator/paymentSimulator.js';
import { transactionExtractor } from '../ai/extractor.js';
import { reconciler } from '../context-engine/reconciler.js';
import { sessionRepo } from '../db/repositories/session.repo.js';
import { socketManager } from '../sockets/socketManager.js';
import { seedDatabase } from '../scripts/seed.js';

export class DemoController {
  public async getScenarios(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ success: true, data: DEMO_SCENARIOS });
    } catch (err) {
      next(err);
    }
  }

  public async runScenario(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = (req.params.id || req.body?.scenarioId || req.body?.id) as string;
      const scenario = DEMO_SCENARIOS.find((s) => s.id === id);

      if (!scenario) {
        res.status(404).json({ success: false, error: 'Scenario not found' });
        return;
      }

      // 1. Start Session
      const session = await sessionRepo.create({
        id: `SESSION-${Date.now()}-${scenario.id}`,
        merchantId: 'M001',
        status: 'PROCESSING',
        transcript: scenario.transcript,
        startedAt: new Date().toISOString(),
      });

      socketManager.emitEvent('session:started', session, 'M001');

      // 2. Extract
      const extraction = await transactionExtractor.extract(scenario.transcript, scenario.language);
      const updatedSession = await sessionRepo.update(session.id, {
        status: 'ANALYZING',
        extraction,
      });

      socketManager.emitEvent('session:extracted', updatedSession, 'M001');

      // 3. Simulate Payment (if amount > 0)
      let payment = null;
      if (scenario.paymentAmount > 0) {
        payment = await paymentSimulator.simulate({
          amount: scenario.paymentAmount,
          merchantId: 'M001',
          sessionId: session.id,
        });
        socketManager.emitEvent('payment:received', payment, 'M001');
      }

      // 4. Reconcile
      let finalized = updatedSession;
      if (payment && updatedSession) {
        const reconciliation = await reconciler.reconcile(updatedSession, payment, 'M001');
        const finalStatus = reconciliation.isMatched ? 'MATCHED' : 'CONFIRMATION_REQUIRED';

        finalized = await sessionRepo.update(session.id, {
          payment,
          status: finalStatus,
          reconciliation,
          completedAt: new Date().toISOString(),
        });

        if (reconciliation.isMatched && finalized) {
          await SessionController.saveFinalTransaction(finalized);
        }

        socketManager.emitEvent('session:reconciled', finalized, 'M001');
      }

      res.json({
        success: true,
        data: {
          scenario,
          session: finalized,
          payment,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async resetDemo(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await seedDatabase();
      socketManager.emitEvent('demo:reset', { timestamp: new Date().toISOString() });
      res.json({ success: true, message: 'Database reset to initial demo state successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const demoController = new DemoController();
