import {
  Merchant,
  Product,
  Customer,
  TransactionSession,
  Transaction,
  Insight,
  Offer,
  PaymentEvent,
  LostSalesSignal,
} from '../types/index.js';

export interface DatabaseSchema {
  merchants: Merchant[];
  products: Product[];
  customers: Customer[];
  sessions: TransactionSession[];
  transactions: Transaction[];
  payments: PaymentEvent[];
  insights: Insight[];
  offers: Offer[];
  lostSales: LostSalesSignal[];
}

export const initialDatabaseState: DatabaseSchema = {
  merchants: [],
  products: [],
  customers: [],
  sessions: [],
  transactions: [],
  payments: [],
  insights: [],
  offers: [],
  lostSales: [],
};
