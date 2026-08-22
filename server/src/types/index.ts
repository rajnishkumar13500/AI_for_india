export type CustomerSegment = 'NEW' | 'REGULAR' | 'HIGH_VALUE' | 'AT_RISK' | 'INACTIVE';

export interface Merchant {
  id: string;
  name: string;
  storeName: string;
  phone: string;
  upiId: string;
  category: string;
  city: string;
  currency: string;
  createdAt: string;
}

export interface Product {
  id: string;
  merchantId: string;
  sku: string;
  name: string;
  aliases: string[];
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  reorderLevel: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  merchantId: string;
  name: string;
  phone: string;
  segment: CustomerSegment;
  totalSpend: number;
  visitCount: number;
  lastVisit: string;
  favoriteProducts: string[];
  createdAt: string;
}

export type SessionStatus =
  | 'IDLE'
  | 'LISTENING'
  | 'PROCESSING'
  | 'PAYMENT_RECEIVED'
  | 'ANALYZING'
  | 'MATCHED'
  | 'CONFIRMATION_REQUIRED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ExtractedProduct {
  name: string;
  matchedProductId?: string;
  matchedProductName?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  confidence: number;
}

export interface ExtractionResult {
  transcript: string;
  language: string;
  products: ExtractedProduct[];
  mentionedAmount: number | null;
  customerRequest: string | null;
  isLostSale: boolean;
  lostSaleProduct?: string;
  /** True when 2+ customers were talking in the same audio capture */
  multiCustomer?: boolean;
  /** True when customer changed their mind and quantities were adjusted */
  orderAmended?: boolean;
  /** True when customer asked for credit (udhar) instead of paying now */
  isUdhar?: boolean;
  confidence: number;
  rawResponse?: any;
}

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface PaymentEvent {
  id: string;
  merchantId: string;
  sessionId?: string;
  amount: number;
  currency: string;
  method: 'UPI' | 'QR' | 'CARD' | 'CASH';
  status: PaymentStatus;
  customerUpi?: string;
  timestamp: string;
  referenceId: string;
}

export interface ReconciliationBreakdown {
  amountMatchScore: number;       // max 40
  sessionMatchScore: number;      // max 25
  catalogMatchScore: number;      // max 20
  extractionScore: number;        // max 15
  totalScore: number;             // 0 - 100
}

export interface ReconciliationResult {
  isMatched: boolean;
  confidence: number; // 0 - 100
  expectedAmount: number;
  receivedAmount: number;
  discrepancy: number;
  breakdown: ReconciliationBreakdown;
  matchedItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  status: 'MATCHED' | 'CONFIRMATION_REQUIRED' | 'UNMATCHED';
  notes?: string;
}

export interface TransactionSession {
  id: string;
  merchantId: string;
  status: SessionStatus;
  audioPath?: string;
  transcript?: string;
  extraction?: ExtractionResult;
  payment?: PaymentEvent;
  reconciliation?: ReconciliationResult;
  startedAt: string;
  completedAt?: string;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  totalPrice: number;
  profit: number;
}

export interface Transaction {
  id: string;
  merchantId: string;
  sessionId?: string;
  customerId?: string;
  customerName?: string;
  items: TransactionItem[];
  totalAmount: number;
  totalCost: number;
  totalProfit: number;
  paymentMethod: string;
  paymentReference: string;
  confidence: number;
  isConfirmed: boolean;
  notes?: string;
  timestamp: string;
}

export type InsightType = 'OPPORTUNITY' | 'RISK' | 'CONCERN' | 'GENERAL';
export type InsightCategory = 'SALES' | 'INVENTORY' | 'CUSTOMER' | 'PRODUCT';

export interface Insight {
  id: string;
  merchantId: string;
  type: InsightType;
  category: InsightCategory;
  title: string;
  whatHappened: string;
  why: string;
  impact: string;
  recommendation: string;
  actionType?: 'PREPARE_OFFER' | 'REORDER_STOCK' | 'ADJUST_PRICE' | 'VIEW_REPORT';
  actionPayload?: any;
  isDismissed: boolean;
  createdAt: string;
}

export type OfferStatus = 'DRAFT' | 'READY' | 'ACTIVE' | 'EXPIRED';

export interface Offer {
  id: string;
  merchantId: string;
  title: string;
  description: string;
  targetSegment: CustomerSegment;
  targetCount: number;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  minOrderValue: number;
  validDays: number;
  status: OfferStatus;
  suggestedReason: string;
  createdAt: string;
}

export type CopilotIntent =
  | 'SALES_SUMMARY'
  | 'SALES_ROOT_CAUSE'
  | 'STOCK_RECOMMENDATION'
  | 'SLOW_PRODUCTS'
  | 'OFFER_RECOMMENDATION'
  | 'CUSTOMER_CHURN'
  | 'LOST_SALES'
  | 'PRODUCT_COMBINATIONS'
  | 'GENERAL_QUERY';

export interface CopilotQuery {
  merchantId: string;
  question: string;
  context?: any;
}

export interface CopilotResponse {
  question: string;
  intent: CopilotIntent;
  answerHinglish: string;
  answerEnglish: string;
  structuredFacts: Record<string, any>;
  recommendedActions: Array<{
    label: string;
    action: string;
    payload?: any;
  }>;
  audioTtsText?: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  audioFileName?: string;
  transcript: string;
  language: string;
  expectedProducts: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  paymentAmount: number;
  expectedOutcome: 'MATCHED' | 'CONFIRMATION_REQUIRED' | 'LOST_SALE';
  confidence: number;
  notes: string;
}

export interface DailyOverview {
  todayRevenue: number;
  yesterdayRevenue: number;
  revenueGrowthPercent: number;
  todayTransactions: number;
  yesterdayTransactions: number;
  avgTransactionValue: number;
  activeCustomersToday: number;
  returningCustomersToday: number;
  grossMarginPercent: number;
  totalProfitToday: number;
}

export interface ProductPerformance {
  productId: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  profit: number;
  growthPercent: number;
  currentStock: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface ProductCombination {
  products: string[];
  frequency: number;
  avgBundleValue: number;
}

export interface InventoryRiskItem {
  productId: string;
  name: string;
  currentStock: number;
  dailyDemand: number;
  runwayDays: number;
  reorderLevel: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedReorderUnits: number;
}

export interface CustomerSegmentStats {
  segment: CustomerSegment;
  count: number;
  totalRevenue: number;
  avgSpend: number;
  description: string;
}

export interface LostSalesSignal {
  productName: string;
  requestCount: number;
  estimatedLostRevenue: number;
  lastRequested: string;
}
