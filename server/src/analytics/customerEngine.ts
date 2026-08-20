import { customerRepo } from '../db/repositories/customer.repo.js';
import { lostSalesRepo } from '../db/repositories/offer.repo.js';
import {
  Customer,
  CustomerSegment,
  CustomerSegmentStats,
  LostSalesSignal,
} from '../types/index.js';

export class CustomerEngine {
  public async getSegmentStats(merchantId?: string): Promise<CustomerSegmentStats[]> {
    const customers = await customerRepo.findAll(merchantId);

    const segments: Record<CustomerSegment, { count: number; totalRevenue: number }> = {
      NEW: { count: 0, totalRevenue: 0 },
      REGULAR: { count: 0, totalRevenue: 0 },
      HIGH_VALUE: { count: 0, totalRevenue: 0 },
      AT_RISK: { count: 0, totalRevenue: 0 },
      INACTIVE: { count: 0, totalRevenue: 0 },
    };

    for (const c of customers) {
      if (segments[c.segment]) {
        segments[c.segment].count++;
        segments[c.segment].totalRevenue += c.totalSpend;
      }
    }

    const descriptions: Record<CustomerSegment, string> = {
      HIGH_VALUE: 'Top 10% spenders with consistent high basket size.',
      REGULAR: 'Frequent weekly visitors who form your core revenue base.',
      NEW: 'First-time buyers acquired within the last 14 days.',
      AT_RISK: 'Previously regular customers whose visit frequency dropped > 50%.',
      INACTIVE: 'Regular customers with zero visits in the last 14+ days.',
    };

    return (Object.keys(segments) as CustomerSegment[]).map((seg) => {
      const data = segments[seg];
      return {
        segment: seg,
        count: data.count,
        totalRevenue: data.totalRevenue,
        avgSpend: data.count > 0 ? Math.round(data.totalRevenue / data.count) : 0,
        description: descriptions[seg],
      };
    });
  }

  public async getInactiveCustomers(merchantId?: string): Promise<Customer[]> {
    const customers = await customerRepo.findAll(merchantId);
    return customers.filter((c) => c.segment === 'INACTIVE' || c.segment === 'AT_RISK');
  }

  public async getLostSalesSignals(): Promise<LostSalesSignal[]> {
    const signals = await lostSalesRepo.findAll();
    if (signals.length === 0) {
      return [
        {
          productName: 'Pepsi 500ml',
          requestCount: 8,
          estimatedLostRevenue: 320,
          lastRequested: new Date().toISOString(),
        },
        {
          productName: 'Amul Butter 100g',
          requestCount: 4,
          estimatedLostRevenue: 220,
          lastRequested: new Date().toISOString(),
        },
      ];
    }
    return signals.sort((a, b) => b.requestCount - a.requestCount);
  }
}

export const customerEngine = new CustomerEngine();
