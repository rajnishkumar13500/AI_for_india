import { v4 as uuidv4 } from 'uuid';
import { PaymentEvent } from '../types/index.js';
import { db } from '../db/database.js';

export interface SimulatePaymentParams {
  amount: number;
  merchantId?: string;
  sessionId?: string;
  customerUpi?: string;
  method?: 'UPI' | 'QR' | 'CARD' | 'CASH' | 'UDHAR';
}

export class PaymentSimulator {
  public async simulate(params: SimulatePaymentParams): Promise<PaymentEvent> {
    const method = params.method || 'QR';
    const prefix = method === 'CASH' ? 'CASH' : method === 'UDHAR' ? 'KHATA' : 'UPI';
    const payment: PaymentEvent = {
      id: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      merchantId: params.merchantId || 'M001',
      sessionId: params.sessionId,
      amount: params.amount,
      currency: 'INR',
      method: method as any,
      status: 'SUCCESS',
      customerUpi:
        params.customerUpi ||
        (method === 'CASH' ? 'Cash Counter' : method === 'UDHAR' ? 'Customer Khata' : 'customer@paytm'),
      timestamp: new Date().toISOString(),
      referenceId: `${prefix}-${uuidv4().substring(0, 8).toUpperCase()}`,
    };

    db.getState().payments.push(payment);
    await db.save();

    return payment;
  }
}

export const paymentSimulator = new PaymentSimulator();
