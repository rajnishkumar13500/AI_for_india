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

export async function uploadAudio(sessionId, audioBlob, liveText) {
  if (!USE_REAL_API) {
    await new Promise(r => setTimeout(r, 1500))
    return {
      sessionId,
      transcript: liveText || 'Bhaiya 2 Maggi aur ek Coke dena.',
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
    let data = null
    // 1. If audio blob is provided, send audio file
    if (audioBlob && audioBlob.size > 0) {
      const form = new FormData()
      form.append('audio', audioBlob, 'recording.webm')
      form.append('merchantId', MERCHANT_ID)
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/audio`, { method: 'POST', body: form })
      const json = await res.json()
      data = json.data ?? json
    }

    // 2. If no audio or audio STT gave empty transcript, use liveText if available
    const transcript = data?.transcript || data?.extraction?.transcript
    if ((!transcript || transcript.trim().length === 0) && liveText && liveText.trim().length > 0) {
      const voiceRes = await fetch(`${API_BASE}/sessions/${sessionId}/voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: liveText, lang: 'hi-IN', merchantId: MERCHANT_ID }),
      })
      const voiceJson = await voiceRes.json()
      data = voiceJson.data ?? voiceJson
    }

    if (!data) throw new Error('No extraction data returned')

    const extraction = data.extraction || data
    const products = (extraction.products || extraction.extractedProducts || []).map((p) => ({
      name: p.matchedProductName || p.name || 'Item',
      quantity: Number(p.quantity) || 1,
      unitPrice: Number(p.unitPrice) || 40,
    }))

    return {
      sessionId: data.id || sessionId,
      transcript: data.transcript || extraction.transcript || liveText || '',
      extractedProducts: products,
      isLostSale: Boolean(extraction.isLostSale),
      lostSaleProduct: extraction.lostSaleProduct || null,
      isUdhar: Boolean(extraction.isUdhar),
      multiCustomer: Boolean(extraction.multiCustomer),
      orderAmended: Boolean(extraction.orderAmended),
      mentionedAmount: extraction.mentionedAmount || null,
      confidence: extraction.confidence || data.confidence || (products.length > 0 ? 0.9 : 0.4),
      status: data.status || 'ANALYZING',
      raw: data,
    }
  } catch (err) {
    console.warn('uploadAudio error:', err)
    return {
      sessionId,
      transcript: liveText || '',
      extractedProducts: [],
      confidence: 0,
      error: err.message,
    }
  }
}


export async function runDemoScenario(scenarioId) {
  try {
    const res = await fetch(`${API_BASE}/demo/run-scenario/${scenarioId}`, {
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
