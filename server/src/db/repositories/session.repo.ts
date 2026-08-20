import { db } from '../database.js';
import { TransactionSession } from '../../types/index.js';

export class SessionRepository {
  public async findAll(merchantId?: string): Promise<TransactionSession[]> {
    const sessions = db.getState().sessions;
    if (merchantId) {
      return sessions.filter((s) => s.merchantId === merchantId);
    }
    return sessions;
  }

  public async findById(id: string): Promise<TransactionSession | null> {
    const session = db.getState().sessions.find((s) => s.id === id);
    return session || null;
  }

  public async findActive(merchantId?: string): Promise<TransactionSession | null> {
    const sessions = db.getState().sessions;
    const active = sessions
      .filter((s) => (!merchantId || s.merchantId === merchantId) && !['COMPLETED', 'CANCELLED'].includes(s.status))
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    return active[0] || null;
  }

  public async create(session: TransactionSession): Promise<TransactionSession> {
    db.getState().sessions.push(session);
    await db.save();
    return session;
  }

  public async update(id: string, updates: Partial<TransactionSession>): Promise<TransactionSession | null> {
    const sessions = db.getState().sessions;
    const idx = sessions.findIndex((s) => s.id === id);
    if (idx < 0) return null;

    sessions[idx] = { ...sessions[idx], ...updates };
    await db.save();
    return sessions[idx];
  }
}

export const sessionRepo = new SessionRepository();
