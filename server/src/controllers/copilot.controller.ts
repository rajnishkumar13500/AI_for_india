import { Request, Response, NextFunction } from 'express';
import { copilotEngine } from '../ai/copilot.js';

export class CopilotController {
  public async ask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { question, merchantId = 'M001', context } = req.body;

      if (!question || typeof question !== 'string') {
        res.status(400).json({ success: false, error: 'Question is required' });
        return;
      }

      const response = await copilotEngine.ask({
        question,
        merchantId,
        context,
      });

      res.json({ success: true, data: response });
    } catch (err) {
      next(err);
    }
  }
}

export const copilotController = new CopilotController();
