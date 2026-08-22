// ─── AI / Copilot API ─────────────────────────────────────────
import { API_BASE, MERCHANT_ID, USE_REAL_API } from './config.js'

const MOCK_RESPONSES = {
  default: 'Aaj aapka business accha raha! Revenue ₹18,420 tha jo kal se 12% zyada hai. Coke aur Maggi sabse zyada bika. Maggi ka stock kam ho sakta hai, kal order karna sahi rahega.',
  sales: 'Aaj revenue ₹18,420 raha — kal se 12% zyada. Coke (43 units, +31%) aur Maggi (38 units, +27%) ne achha perform kiya. Bread ki sales thodi kam rahi (-18%).',
  stock: 'Maggi ka stock sirf 1.9 din ke liye bacha hai. Kal subah order karo. Pepsi bhi low hai — 2.1 din. Baaki products theek hain.',
  opportunity: 'Coke aur Maggi saath mein 23 baar bika is hafte. Agar combo offer banao — ₹60 mein dono — toh customers zyada aayenge aur revenue badhega.',
  customers: '23 regular customers kaafi din se nahi aaye. Weekend par ₹20 off wala offer bhejo. Ye log usually ₹200+ spend karte hain.',
}

export async function askCopilot(question) {
  if (!USE_REAL_API) {
    await new Promise(r => setTimeout(r, 1200))
    const lower = question.toLowerCase()
    if (lower.includes('sales') || lower.includes('revenue') || lower.includes('business')) return MOCK_RESPONSES.sales
    if (lower.includes('stock') || lower.includes('inventory') || lower.includes('order')) return MOCK_RESPONSES.stock
    if (lower.includes('offer') || lower.includes('opportunity') || lower.includes('combo')) return MOCK_RESPONSES.opportunity
    if (lower.includes('customer') || lower.includes('inactive')) return MOCK_RESPONSES.customers
    return MOCK_RESPONSES.default
  }
  const res = await fetch(`${API_BASE}/copilot/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchantId: MERCHANT_ID, question }),
  })
  const json = await res.json()
  return (
    json.data?.answerHinglish ||
    json.data?.answerEnglish ||
    json.data?.answer ||
    json.answer ||
    'Sorry, kuch gadbad ho gayi. Dobara try karo.'
  )
}

/**
 * Streaming copilot — calls onChunk(text) for each arriving token,
 * then onDone() when the stream is complete.
 * source: 'dashboard' (full answer) | 'soundbox' (2-3 sentences, TTS-friendly)
 */
export async function askCopilotStream(question, onChunk, onDone, source = 'dashboard') {
  if (!USE_REAL_API) {
    // Simulate streaming from mock data
    const lower = question.toLowerCase()
    let full = MOCK_RESPONSES.default
    if (lower.includes('sales') || lower.includes('revenue') || lower.includes('business')) full = MOCK_RESPONSES.sales
    else if (lower.includes('stock') || lower.includes('inventory') || lower.includes('order')) full = MOCK_RESPONSES.stock
    else if (lower.includes('offer') || lower.includes('opportunity') || lower.includes('combo')) full = MOCK_RESPONSES.opportunity
    else if (lower.includes('customer') || lower.includes('inactive')) full = MOCK_RESPONSES.customers
    // Emit word groups with delay to simulate streaming
    const words = full.split(' ')
    for (let i = 0; i < words.length; i += 3) {
      await new Promise(r => setTimeout(r, 60))
      onChunk((i === 0 ? '' : ' ') + words.slice(i, i + 3).join(' '))
    }
    onDone?.()
    return
  }

  try {
    const res = await fetch(`${API_BASE}/copilot/ask/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId: MERCHANT_ID, question, source }),
    })
    if (!res.ok || !res.body) throw new Error(`Stream error: ${res.status}`)

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') { onDone?.(); return }
        try {
          const parsed = JSON.parse(data)
          if (parsed.chunk) onChunk(parsed.chunk)
        } catch { /* malformed chunk — skip */ }
      }
    }
    onDone?.()
  } catch (err) {
    console.error('askCopilotStream failed:', err)
    // Fallback to full non-streaming request
    const full = await askCopilot(question).catch(() => 'Kuch gadbad ho gayi.')
    onChunk(full)
    onDone?.()
  }
}
