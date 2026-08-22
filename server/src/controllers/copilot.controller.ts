import { Request, Response, NextFunction } from 'express';
import { copilotEngine } from '../ai/copilot.js';
import { llmClient } from '../ai/llm.js';
import { analyticsEngine } from '../analytics/engine.js';
import { forecastingEngine } from '../analytics/forecasting.js';
import { customerEngine } from '../analytics/customerEngine.js';

export class CopilotController {
  /** Non-streaming — existing endpoint, unchanged behaviour */
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

  /**
   * Streaming SSE endpoint — streams LLM tokens as they arrive.
   * source='soundbox' → shorter 2-3 sentence answers (TTS-friendly)
   * source='dashboard' → full answers (default)
   */
  public async askStream(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { question, merchantId = 'M001', source = 'dashboard' } = req.body;

      if (!question || typeof question !== 'string') {
        res.status(400).json({ success: false, error: 'Question is required' });
        return;
      }

      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.flushHeaders();

      // Gather real analytics facts (same as non-streaming copilot)
      const [overview, products, inventoryRisks, segments, inactiveCustomers, lostSales, combinations] =
        await Promise.all([
          analyticsEngine.getDailyOverview(merchantId),
          analyticsEngine.getProductPerformance(merchantId),
          forecastingEngine.getInventoryRisks(merchantId),
          customerEngine.getSegmentStats(merchantId),
          customerEngine.getInactiveCustomers(merchantId),
          customerEngine.getLostSalesSignals(),
          analyticsEngine.getProductCombinations(merchantId),
        ]);

      const facts = {
        overview,
        topProducts: products.slice(0, 5),
        slowProducts: products.filter((p) => p.growthPercent < 0 || p.unitsSold < 10),
        highRisks: inventoryRisks.filter((i) => i.riskLevel === 'HIGH'),
        inactiveCustomersCount: inactiveCustomers.length,
        lostSales,
        combinations: combinations.slice(0, 3),
        segments,
      };

      // Length instruction for soundbox (TTS-speakable in ~10 seconds)
      const lengthGuide =
        source === 'soundbox'
          ? 'Keep your answer to 2-3 sentences maximum — it will be spoken aloud on a device speaker.'
          : 'You may provide a complete, detailed answer.';

      const systemPrompt = `You are "Paytm Vyapar AI", an intelligent business copilot for Indian kirana store owners.
Answer the merchant's question clearly and naturally in Hinglish (Hindi written in Roman script, like "Bhaiya aaj aapki sales ₹18,420 rahi...").
Use ONLY the provided structured business facts. Do NOT add markdown formatting, bullet points, or headers — plain conversational text only.
${lengthGuide}`;

      const prompt = `Merchant Question: "${question}"
Business Facts:
${JSON.stringify(facts, null, 2)}

Respond in Hinglish:`;

      // Stream tokens from LLM
      for await (const chunk of llmClient.generateTextStream(prompt, {
        systemPrompt,
        temperature: 0.3,
      })) {
        if (res.destroyed) break;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      // If headers already sent, can't call next(err) — write an error event and close
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        next(err);
      }
    }
  }
}

export const copilotController = new CopilotController();
