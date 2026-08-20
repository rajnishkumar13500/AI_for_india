import { db } from '../database.js';
import { Insight } from '../../types/index.js';

export class InsightRepository {
  public async findAll(merchantId?: string): Promise<Insight[]> {
    const insights = db.getState().insights;
    if (merchantId) {
      return insights.filter((i) => i.merchantId === merchantId && !i.isDismissed);
    }
    return insights.filter((i) => !i.isDismissed);
  }

  public async findById(id: string): Promise<Insight | null> {
    const insight = db.getState().insights.find((i) => i.id === id);
    return insight || null;
  }

  public async create(insight: Insight): Promise<Insight> {
    db.getState().insights.unshift(insight);
    await db.save();
    return insight;
  }

  public async dismiss(id: string): Promise<boolean> {
    const insight = db.getState().insights.find((i) => i.id === id);
    if (!insight) return false;
    insight.isDismissed = true;
    await db.save();
    return true;
  }

  public async upsertMany(insights: Insight[]): Promise<void> {
    const stateInsights = db.getState().insights;
    for (const item of insights) {
      const idx = stateInsights.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        stateInsights[idx] = item;
      } else {
        stateInsights.push(item);
      }
    }
    await db.save();
  }
}

export const insightRepo = new InsightRepository();
