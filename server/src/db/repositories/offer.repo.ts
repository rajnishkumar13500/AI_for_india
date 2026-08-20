import { db } from '../database.js';
import { Offer, LostSalesSignal } from '../../types/index.js';

export class OfferRepository {
  public async findAll(merchantId?: string): Promise<Offer[]> {
    const offers = db.getState().offers;
    if (merchantId) {
      return offers.filter((o) => o.merchantId === merchantId);
    }
    return offers;
  }

  public async findById(id: string): Promise<Offer | null> {
    const offer = db.getState().offers.find((o) => o.id === id);
    return offer || null;
  }

  public async create(offer: Offer): Promise<Offer> {
    db.getState().offers.unshift(offer);
    await db.save();
    return offer;
  }

  public async update(id: string, updates: Partial<Offer>): Promise<Offer | null> {
    const offers = db.getState().offers;
    const idx = offers.findIndex((o) => o.id === id);
    if (idx < 0) return null;
    offers[idx] = { ...offers[idx], ...updates };
    await db.save();
    return offers[idx];
  }

  public async upsertMany(offers: Offer[]): Promise<void> {
    const stateOffers = db.getState().offers;
    for (const item of offers) {
      const idx = stateOffers.findIndex((o) => o.id === item.id);
      if (idx >= 0) {
        stateOffers[idx] = item;
      } else {
        stateOffers.push(item);
      }
    }
    await db.save();
  }
}

export class LostSalesRepository {
  public async findAll(): Promise<LostSalesSignal[]> {
    return db.getState().lostSales;
  }

  public async recordRequest(productName: string, estimatedPrice: number = 40): Promise<LostSalesSignal> {
    const signals = db.getState().lostSales;
    const existing = signals.find((s) => s.productName.toLowerCase() === productName.toLowerCase());
    if (existing) {
      existing.requestCount += 1;
      existing.estimatedLostRevenue += estimatedPrice;
      existing.lastRequested = new Date().toISOString();
      await db.save();
      return existing;
    } else {
      const newSignal: LostSalesSignal = {
        productName,
        requestCount: 1,
        estimatedLostRevenue: estimatedPrice,
        lastRequested: new Date().toISOString(),
      };
      signals.push(newSignal);
      await db.save();
      return newSignal;
    }
  }

  public async upsertMany(signals: LostSalesSignal[]): Promise<void> {
    const stateSignals = db.getState().lostSales;
    for (const item of signals) {
      const idx = stateSignals.findIndex((s) => s.productName.toLowerCase() === item.productName.toLowerCase());
      if (idx >= 0) {
        stateSignals[idx] = item;
      } else {
        stateSignals.push(item);
      }
    }
    await db.save();
  }
}

export const offerRepo = new OfferRepository();
export const lostSalesRepo = new LostSalesRepository();
