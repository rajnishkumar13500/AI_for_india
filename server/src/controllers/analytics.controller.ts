import { Request, Response, NextFunction } from 'express';
import { analyticsEngine } from '../analytics/engine.js';
import { forecastingEngine } from '../analytics/forecasting.js';
import { customerEngine } from '../analytics/customerEngine.js';

export class AnalyticsController {
  public async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.query.merchantId as string;
      const data = await analyticsEngine.getDailyOverview(merchantId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.query.merchantId as string;
      const data = await analyticsEngine.getProductPerformance(merchantId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async getCombinations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.query.merchantId as string;
      const data = await analyticsEngine.getProductCombinations(merchantId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async getPeakHours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.query.merchantId as string;
      const data = await analyticsEngine.getPeakHours(merchantId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async getInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.query.merchantId as string;
      const data = await forecastingEngine.getInventoryRisks(merchantId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  public async getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.query.merchantId as string;
      const segments = await customerEngine.getSegmentStats(merchantId);
      const inactive = await customerEngine.getInactiveCustomers(merchantId);
      res.json({ success: true, data: { segments, inactive } });
    } catch (err) {
      next(err);
    }
  }

  public async getLostSales(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await customerEngine.getLostSalesSignals();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
