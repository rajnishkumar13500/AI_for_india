import { v4 as uuidv4 } from 'uuid';
import { PaymentEvent } from '../types/index.js';
import { db } from '../db/database.js';

export interface SimulatePaymentParams {
  amount: number;
  merchantId?: string;
  sessionId?: string;
  customerUpi?: string;
  method?: 'UPI' | 'QR' | 'CARD' | 'CASH';
}

export class PaymentSimulator {
  public async simulate(params: SimulatePaymentParams): Promise<PaymentEvent> {
    const payment: PaymentEvent = {
      id: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      merchantId: params.merchantId || 'M001',
      sessionId: params.sessionId,
      amount: params.amount,
      currency: 'INR',
      method: params.method || 'QR',
      status: 'SUCCESS',
      customerUpi: params.customerUpi || 'customer@paytm',
      timestamp: new Date().toISOString(),
      referenceId: `UPI-${uuidv4().substring(0, 8).toUpperCase()}`,
    };

    db.getState().payments.push(payment);
    await db.save();

    return payment;
  }
}

export const paymentSimulator = new PaymentSimulator();
