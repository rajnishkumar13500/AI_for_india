import { db } from '../database.js';
import { Merchant } from '../../types/index.js';

export class MerchantRepository {
  public async findById(id: string): Promise<Merchant | null> {
    const merchant = db.getState().merchants.find((m) => m.id === id);
    return merchant || null;
  }

  public async getFirst(): Promise<Merchant | null> {
    return db.getState().merchants[0] || null;
  }

  public async upsert(merchant: Merchant): Promise<Merchant> {
    const merchants = db.getState().merchants;
    const index = merchants.findIndex((m) => m.id === merchant.id);
    if (index >= 0) {
      merchants[index] = merchant;
    } else {
      merchants.push(merchant);
    }
    await db.save();
    return merchant;
  }
}

export const merchantRepo = new MerchantRepository();
