// Mock data fallback — mirrors the backend seed structure
// Used when USE_REAL_API = false in config.js

export const MOCK_OVERVIEW = {
  stats: {
    todayRevenue: 18420,
    transactionCount: 137,
    avgTransactionValue: 134,
    returningCustomers: 23,
  },
  revenueChart: Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i))
    return {
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      revenue: 10000 + Math.floor(Math.random() * 10000),
    }
  }),
  insights: [
    { type: 'OPPORTUNITY', title: 'Coke demand surging', description: 'Coke sales increased 31% this week. Consider keeping extra stock.', actionLabel: 'See Products', whatHappened: 'Coke sold 43 units this week vs 33 last week', why: 'Weekend demand and summer heat driving beverage sales', recommendation: 'Increase Coke stock by 20 units before weekend' },
    { type: 'RISK',        title: 'Maggi may run out', description: 'At current rate, Maggi stock will last only 1.9 more days.', actionLabel: 'View Inventory', whatHappened: 'Maggi stock is at 32 units, daily demand is 17', why: 'Maggi is trending +27% as a fast-selling staple', recommendation: 'Order 50+ units of Maggi today' },
    { type: 'CONCERN',     title: 'Bread sales declining', description: 'Bread revenue dropped 18% vs last week. May indicate supplier or preference shift.', actionLabel: 'Ask AI', whatHappened: 'Bread units sold: 14 this week vs 17 last week', why: 'Returning customers -26% may explain lower staple purchases', recommendation: 'Bundle bread with milk for a morning combo deal' },
  ],
  recentTransactions: Array.from({ length: 8 }, (_, i) => ({
    id: `TXN-${1001 + i}`,
    items: [
      { name: ['Maggi', 'Coke', 'Pepsi', 'Bread'][i % 4], quantity: (i % 2) + 1 },
    ],
    amount: [80, 120, 95, 50, 240, 80, 120, 95][i],
    confidence: 0.97 - i * 0.01,
    status: i === 2 ? 'CONFIRMATION_REQUIRED' : 'MATCHED',
    createdAt: new Date(Date.now() - i * 600000).toISOString(),
  })),
  offers: [
    {
      title: 'Weekend Reactivation Offer',
      description: 'Target inactive customers who haven\'t visited in 14+ days. Incentivize with a discount on weekends.',
      targetSegment: '23 Inactive Customers',
      discount: '₹20 off above ₹200',
      estimatedImpact: '+₹4,600 revenue',
      reason: 'These customers previously spent ₹200+ per visit and responded well to offers historically.',
      status: 'PENDING',
    },
    {
      title: 'Maggi + Coke Combo Deal',
      description: 'Bundle Maggi and Coke which are frequently bought together — increase basket size.',
      targetSegment: 'All Customers',
      discount: '₹60 for both (save ₹5)',
      estimatedImpact: '+15% basket size',
      reason: 'Maggi + Coke were purchased together 23 times this week — a natural bundle opportunity.',
      status: 'PENDING',
    },
  ],
}

export const MOCK_PRODUCTS_ANALYTICS = {
  topProducts: [
    { id: 'p1', name: 'Coca-Cola 500ml',       category: 'Beverages',   totalQuantity: 43, totalRevenue: 2150, growthPercent: 31 },
    { id: 'p2', name: 'Maggi 2-Min Noodles',   category: 'Snacks',      totalQuantity: 38, totalRevenue:  570, growthPercent: 27 },
    { id: 'p3', name: 'Pepsi 500ml',           category: 'Beverages',   totalQuantity: 27, totalRevenue: 1080, growthPercent:  8 },
    { id: 'p4', name: 'Lay\'s Classic Salted', category: 'Snacks',      totalQuantity: 22, totalRevenue:  440, growthPercent:  5 },
    { id: 'p5', name: 'Amul Taaza Milk 500ml', category: 'Dairy',       totalQuantity: 19, totalRevenue:  950, growthPercent:  2 },
    { id: 'p6', name: 'Harvest Gold Bread',    category: 'Bakery',      totalQuantity: 14, totalRevenue:  630, growthPercent: -18 },
    { id: 'p7', name: 'Parle-G Biscuits',      category: 'Biscuits',    totalQuantity: 31, totalRevenue:  310, growthPercent: 12 },
    { id: 'p8', name: 'Cadbury Dairy Milk',    category: 'Confectionery',totalQuantity: 17, totalRevenue:  680, growthPercent: -3 },
  ],
  combos: [
    { products: ['Maggi', 'Coke'],  count: 23 },
    { products: ['Pepsi', 'Chips'], count: 18 },
    { products: ['Bread', 'Milk'],  count: 14 },
  ],
}

export const MOCK_CUSTOMERS = [
  { id: 'c1', name: 'Amit Sharma',  phone: '98100XXXXX', segment: 'HIGH_VALUE', totalSpend: 4200, visitCount: 28, lastVisit: new Date(Date.now() - 86400000).toISOString(), favoriteProducts: ['Coke', 'Maggi'] },
  { id: 'c2', name: 'Priya Singh',  phone: '97XXXXXXXX', segment: 'REGULAR',    totalSpend: 1800, visitCount: 15, lastVisit: new Date(Date.now() - 172800000).toISOString(), favoriteProducts: ['Milk', 'Bread'] },
  { id: 'c3', name: 'Rahul Kumar',  phone: '91XXXXXXXX', segment: 'AT_RISK',    totalSpend:  900, visitCount:  8, lastVisit: new Date(Date.now() - 864000000).toISOString(), favoriteProducts: ['Pepsi'] },
  { id: 'c4', name: 'Sunita Devi',  phone: '93XXXXXXXX', segment: 'INACTIVE',   totalSpend: 2100, visitCount: 20, lastVisit: new Date(Date.now() - 1728000000).toISOString(), favoriteProducts: ['Maggi', 'Parle-G'] },
  { id: 'c5', name: 'Vikram Patel', phone: '99XXXXXXXX', segment: 'NEW',        totalSpend:  350, visitCount:  3, lastVisit: new Date(Date.now() - 259200000).toISOString(), favoriteProducts: ['Coke'] },
  { id: 'c6', name: 'Meena Joshi',  phone: '88XXXXXXXX', segment: 'INACTIVE',   totalSpend: 1600, visitCount: 12, lastVisit: new Date(Date.now() - 2592000000).toISOString(), favoriteProducts: ['Bread', 'Milk'] },
  { id: 'c7', name: 'Deepak Verma', phone: '95XXXXXXXX', segment: 'REGULAR',    totalSpend: 2800, visitCount: 22, lastVisit: new Date(Date.now() - 432000000).toISOString(), favoriteProducts: ['Maggi', 'Coke'] },
]

export const MOCK_INVENTORY = [
  { productId: 'p1', productName: 'Maggi 2-Min Noodles',   category: 'Snacks',    estimatedStock: 32, dailyDemand: 17, daysRemaining: 1.9, riskLevel: 'HIGH',   recommendation: 'Order 50 units before weekend — stock will run out in < 2 days' },
  { productId: 'p2', productName: 'Pepsi 500ml',           category: 'Beverages', estimatedStock: 48, dailyDemand: 22, daysRemaining: 2.1, riskLevel: 'HIGH',   recommendation: 'Pepsi stock critically low — order 60 units' },
  { productId: 'p3', productName: 'Amul Taaza Milk 500ml', category: 'Dairy',     estimatedStock: 25, dailyDemand:  8, daysRemaining: 3.1, riskLevel: 'MEDIUM', recommendation: 'Order 20 units by tomorrow' },
  { productId: 'p4', productName: 'Harvest Gold Bread',    category: 'Bakery',    estimatedStock: 18, dailyDemand:  5, daysRemaining: 3.6, riskLevel: 'MEDIUM', recommendation: 'Reorder soon — sales declining but stock finite' },
  { productId: 'p5', productName: 'Coca-Cola 500ml',       category: 'Beverages', estimatedStock: 75, dailyDemand: 15, daysRemaining: 5.0, riskLevel: 'LOW',    recommendation: 'Healthy stock level — maintain' },
  { productId: 'p6', productName: 'Parle-G Biscuits',      category: 'Biscuits',  estimatedStock: 90, dailyDemand: 12, daysRemaining: 7.5, riskLevel: 'LOW',    recommendation: 'No action needed this week' },
]
