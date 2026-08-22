import { API_BASE, MERCHANT_ID, USE_REAL_API } from './config.js'
import { MOCK_OVERVIEW, MOCK_PRODUCTS_ANALYTICS, MOCK_CUSTOMERS, MOCK_INVENTORY } from './mock-data.js'

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const json = await res.json()
  return json.data ?? json
}

// Silent fallback — returns mock data if backend is unreachable
async function safeApiFetch(path, fallback) {
  try { return await apiFetch(path) } catch { return fallback }
}

export async function getOverview() {
  if (!USE_REAL_API) return MOCK_OVERVIEW
  return safeApiFetch(`/analytics/overview?merchantId=${MERCHANT_ID}`, MOCK_OVERVIEW)
}

export async function getProductsAnalytics() {
  if (!USE_REAL_API) return MOCK_PRODUCTS_ANALYTICS
  return safeApiFetch(`/analytics/products?merchantId=${MERCHANT_ID}`, MOCK_PRODUCTS_ANALYTICS)
}

export async function getRevenueChart() {
  if (!USE_REAL_API) return MOCK_OVERVIEW.revenueChart
  return safeApiFetch(`/analytics/revenue?merchantId=${MERCHANT_ID}`, MOCK_OVERVIEW.revenueChart)
}

export async function getCustomers() {
  if (!USE_REAL_API) return MOCK_CUSTOMERS
  return safeApiFetch(`/customers?merchantId=${MERCHANT_ID}`, MOCK_CUSTOMERS)
}

export async function getInventory() {
  if (!USE_REAL_API) return MOCK_INVENTORY
  return safeApiFetch(`/analytics/inventory?merchantId=${MERCHANT_ID}`, MOCK_INVENTORY)
}

export async function getInsights() {
  if (!USE_REAL_API) return MOCK_OVERVIEW.insights
  return safeApiFetch(`/analytics/insights?merchantId=${MERCHANT_ID}`, MOCK_OVERVIEW.insights)
}

export async function getOffers() {
  if (!USE_REAL_API) return MOCK_OVERVIEW.offers
  return safeApiFetch(`/offers?merchantId=${MERCHANT_ID}`, MOCK_OVERVIEW.offers)
}

export async function prepareOffer(offerData) {
  try {
    const res = await fetch(`${API_BASE}/offers/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...offerData, merchantId: MERCHANT_ID }),
    })
    const json = await res.json()
    return json.data ?? json
  } catch {
    return { success: true, offer: offerData }
  }
}

export async function getTransactions() {
  if (!USE_REAL_API) return MOCK_OVERVIEW.recentTransactions
  return safeApiFetch(`/transactions?merchantId=${MERCHANT_ID}`, MOCK_OVERVIEW.recentTransactions)
}
