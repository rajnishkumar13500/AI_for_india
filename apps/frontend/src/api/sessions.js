import { API_BASE, MERCHANT_ID, USE_REAL_API } from './config.js'

export async function startSession() {
  if (!USE_REAL_API) {
    return { id: `SESSION-${Date.now()}`, merchantId: MERCHANT_ID, status: 'LISTENING', createdAt: new Date().toISOString() }
  }
  try {
    const res = await fetch(`${API_BASE}/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId: MERCHANT_ID }),
    })
    const json = await res.json()
    return json.data ?? json
  } catch {
    // Backend not available — return local session
    return { id: `SESSION-${Date.now()}`, merchantId: MERCHANT_ID, status: 'LISTENING', createdAt: new Date().toISOString() }
  }
}

export async function uploadAudio(sessionId, audioBlob) {
  if (!USE_REAL_API) {
    await new Promise(r => setTimeout(r, 1500))
    return {
      sessionId,
      transcript: 'Bhaiya 2 Maggi aur ek Coke dena.',
      language: 'hi',
      extractedProducts: [
        { name: 'Maggi 2-Min Noodles', quantity: 2, unitPrice: 15 },
        { name: 'Coca-Cola 500ml', quantity: 1, unitPrice: 50 },
      ],
      confidence: 0.97,
      status: 'ANALYZING',
    }
  }
  try {
    const form = new FormData()
    form.append('audio', audioBlob, 'recording.webm')
    form.append('merchantId', MERCHANT_ID)
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/audio`, { method: 'POST', body: form })
    const json = await res.json()
    return json.data ?? json
  } catch {
    // Fallback to demo extraction
    return {
      sessionId,
      transcript: 'Bhaiya 2 Maggi aur ek Coke dena.',
      extractedProducts: [
        { name: 'Maggi 2-Min Noodles', quantity: 2, unitPrice: 15 },
        { name: 'Coca-Cola 500ml', quantity: 1, unitPrice: 50 },
      ],
      confidence: 0.97,
    }
  }
}

export async function runDemoScenario(scenarioId) {
  try {
    const res = await fetch(`${API_BASE}/demo/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId, merchantId: MERCHANT_ID }),
    })
    const json = await res.json()
    return json.data ?? json
  } catch {
    return { success: true, scenarioId }
  }
}

export async function getDemoScenarios() {
  try {
    const res = await fetch(`${API_BASE}/demo/scenarios`)
    const json = await res.json()
    return json.data ?? json
  } catch {
    // Return built-in scenarios if backend not running
    return [
      { id: 'scenario_1', title: 'High Confidence Match (Maggi + Coke)', description: 'Customer orders 2 Maggi and 1 Coke, pays ₹80. Perfect match.', transcript: 'Bhaiya 2 Maggi aur ek Coke dena. Kitna hua? Assi rupaye.', expectedProducts: [{ name: 'Maggi 2-Min Noodles', quantity: 2, unitPrice: 15 }, { name: 'Coca-Cola 500ml', quantity: 1, unitPrice: 50 }], paymentAmount: 80, expectedOutcome: 'MATCHED', confidence: 97 },
      { id: 'scenario_2', title: 'Multi-Item Basket (Pepsi + Chips + Chocolate)', description: 'Customer purchases 1 Pepsi, 2 Chips, 1 Chocolate for ₹120.', transcript: 'Ek Pepsi, do chips aur ek chocolate dena. Ek sau bees rupaye.', expectedProducts: [{ name: 'Pepsi 500ml', quantity: 1, unitPrice: 40 }, { name: "Lay's Classic Salted", quantity: 2, unitPrice: 20 }, { name: 'Cadbury Dairy Milk', quantity: 1, unitPrice: 40 }], paymentAmount: 120, expectedOutcome: 'MATCHED', confidence: 95 },
      { id: 'scenario_3', title: 'Discrepancy — Confirmation Required', description: 'Amount mismatch triggers merchant confirmation.', transcript: 'Do Pepsi aur ek Coke dena.', expectedProducts: [{ name: 'Pepsi 500ml', quantity: 2, unitPrice: 40 }, { name: 'Coca-Cola 500ml', quantity: 1, unitPrice: 50 }], paymentAmount: 180, expectedOutcome: 'CONFIRMATION_REQUIRED', confidence: 65 },
      { id: 'scenario_4', title: 'Lost Sales Signal (Pepsi Out of Stock)', description: 'Customer requests Pepsi, merchant says out of stock.', transcript: 'Bhaiya Pepsi hai kya? Nahi, Pepsi khatam ho gayi.', expectedProducts: [], paymentAmount: 0, expectedOutcome: 'LOST_SALE', confidence: 92 },
      { id: 'scenario_5', title: 'Essential Grocery (Bread + Milk)', description: 'Morning essentials: 1 Bread + 1 Amul Milk for ₹95.', transcript: 'Ek packet bread aur ek packet Amul Taaza doodh dena.', expectedProducts: [{ name: 'Harvest Gold White Bread', quantity: 1, unitPrice: 45 }, { name: 'Amul Taaza Milk 500ml', quantity: 1, unitPrice: 50 }], paymentAmount: 95, expectedOutcome: 'MATCHED', confidence: 96 },
    ]
  }
}

export async function resetDemo() {
  try {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' })
    return await res.json()
  } catch {
    return { success: true }
  }
}

export async function getSession(sessionId) {
  try {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`)
    const json = await res.json()
    return json.data ?? json
  } catch {
    return null
  }
}

export async function confirmTransaction(sessionId) {
  try {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId: MERCHANT_ID }),
    })
    const json = await res.json()
    return json.data ?? json
  } catch {
    return { success: true }
  }
}
