import { productRepo } from '../db/repositories/product.repo.js';
import { transactionRepo } from '../db/repositories/transaction.repo.js';
import { InventoryRiskItem } from '../types/index.js';

export class ForecastingEngine {
  public async getInventoryRisks(merchantId?: string): Promise<InventoryRiskItem[]> {
    const products = await productRepo.findAll(merchantId);
    const txns = await transactionRepo.findAll(merchantId);

    // Calculate daily average sales over the last 14 days
    const productDailyDemandMap: Record<string, number> = {};

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    for (const t of txns) {
      if (new Date(t.timestamp) >= fourteenDaysAgo) {
        for (const item of t.items) {
          productDailyDemandMap[item.productId] =
            (productDailyDemandMap[item.productId] || 0) + item.quantity;
        }
      }
    }

    const risks: InventoryRiskItem[] = products.map((p) => {
      const total14DaySales = productDailyDemandMap[p.id] || 0;
      const dailyDemand = Math.max(1, Math.round((total14DaySales / 14) * 10) / 10);
      const runwayDays = Math.round((p.stock / dailyDemand) * 10) / 10;

      let riskLevel: InventoryRiskItem['riskLevel'] = 'LOW';
      if (runwayDays <= 2.5 || p.stock <= p.reorderLevel) {
        riskLevel = 'HIGH';
      } else if (runwayDays <= 5) {
        riskLevel = 'MEDIUM';
      }

      // Recommended reorder for 7-10 days buffer
      const targetDays = 10;
      const recommendedReorderUnits =
        riskLevel !== 'LOW'
          ? Math.max(10, Math.ceil(dailyDemand * targetDays - p.stock))
          : 0;

      return {
        productId: p.id,
        name: p.name,
        currentStock: p.stock,
        dailyDemand,
        runwayDays,
        reorderLevel: p.reorderLevel,
        riskLevel,
        recommendedReorderUnits,
      };
    });

    return risks.sort((a, b) => a.runwayDays - b.runwayDays);
  }
}

export const forecastingEngine = new ForecastingEngine();
