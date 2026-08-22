// ─── Payments API ─────────────────────────────────────────────
import { API_BASE, MERCHANT_ID, USE_REAL_API } from './config.js'

export async function simulatePayment(sessionId, amount, method = 'QR') {
  if (!USE_REAL_API) {
    await new Promise(r => setTimeout(r, 800))
    return {
      transactionId: `TXN-${Date.now()}`,
      sessionId,
      merchantId: MERCHANT_ID,
      amount,
      method,
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
    }
  }
  const res = await fetch(`${API_BASE}/payments/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, merchantId: MERCHANT_ID, amount, method }),
  })
  const json = await res.json()
  return json.data ?? json
}
