import { db } from '../database.js';
import { Transaction } from '../../types/index.js';

export class TransactionRepository {
  public async findAll(merchantId?: string): Promise<Transaction[]> {
    const txns = db.getState().transactions;
    if (merchantId) {
      return txns.filter((t) => t.merchantId === merchantId);
    }
    return txns;
  }

  public async findById(id: string): Promise<Transaction | null> {
    const txn = db.getState().transactions.find((t) => t.id === id);
    return txn || null;
  }

  public async findRecent(limit: number = 20, merchantId?: string): Promise<Transaction[]> {
    let txns = db.getState().transactions;
    if (merchantId) {
      txns = txns.filter((t) => t.merchantId === merchantId);
    }
    return [...txns].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  }

  public async create(transaction: Transaction): Promise<Transaction> {
    db.getState().transactions.push(transaction);
    await db.save();
    return transaction;
  }

  public async update(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    const txns = db.getState().transactions;
    const idx = txns.findIndex((t) => t.id === id);
    if (idx < 0) return null;

    txns[idx] = { ...txns[idx], ...updates };
    await db.save();
    return txns[idx];
  }

  public async insertMany(transactions: Transaction[]): Promise<void> {
    db.getState().transactions.push(...transactions);
    await db.save();
  }
}

export const transactionRepo = new TransactionRepository();
