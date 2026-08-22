import { useState, useEffect, useCallback, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Mic, MicOff, Play, StopCircle, RefreshCw, CheckCircle, AlertTriangle, Upload, Zap, BarChart3, MessageCircle, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAudioRecorder } from '../../hooks/useAudioRecorder.js'
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis.js'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition.js'
import { startSession, uploadAudio, getDemoScenarios, runDemoScenario, resetDemo, confirmTransaction } from '../../api/sessions.js'
import { simulatePayment } from '../../api/payments.js'
import { askCopilotStream } from '../../api/ai.js'
import { MERCHANT_ID } from '../../api/config.js'

// Device state machine
const STATE = {
  IDLE:                 'IDLE',
  RECORDING:            'RECORDING',
  PROCESSING:           'PROCESSING',
  EXTRACTED:            'EXTRACTED',
  NO_ITEMS_DETECTED:    'NO_ITEMS_DETECTED',
  LOST_SALE:            'LOST_SALE',
  PAYMENT_PENDING:      'PAYMENT_PENDING',
  PAYMENT_SUCCESS:      'PAYMENT_SUCCESS',
  RECONCILING:          'RECONCILING',
  MATCHED:              'MATCHED',
  CONFIRM_REQUIRED:     'CONFIRM_REQUIRED',
  DEMO_MODE:            'DEMO_MODE',
  DEMO_RUNNING:         'DEMO_RUNNING',
  // ── Voice Copilot states ──────────────────────────
  COPILOT_LISTENING:    'COPILOT_LISTENING',
  COPILOT_THINKING:     'COPILOT_THINKING',
  COPILOT_SPEAKING:     'COPILOT_SPEAKING',
}

const DEMO_STEPS = [
  'Start Transaction',
  'Capture Audio',
  'Speech-to-Text',
  'AI Extraction',
  'Simulate Payment',
  'Reconciliation',
  'Update Analytics',
]

export default function DeviceHome() {
  const nav = useNavigate()
  const [deviceState, setDeviceState] = useState(STATE.IDLE)
  const [session, setSession] = useState(null)
  const [extracted, setExtracted] = useState(null)
  const [paymentResult, setPaymentResult] = useState(null)
  const [reconciliation, setReconciliation] = useState(null)
  const [scenarios, setScenarios] = useState([])
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [demoStep, setDemoStep] = useState(-1)
  const [error, setError] = useState(null)
  const [timeStr, setTimeStr] = useState('')

  const { isRecording, audioBlob, error: recError, startRecording, stopRecording, reset: resetAudio } = useAudioRecorder()
  const { speak, stop: stopSpeak } = useSpeechSynthesis()

  // ── Copilot state ─────────────────────────────────
  const [copilotQuestion, setCopilotQuestion] = useState('')
  const [copilotAnswer, setCopilotAnswer]     = useState('')
  const [copilotStreaming, setCopilotStreaming] = useState(false)
  const [liveSpeechText, setLiveSpeechText]   = useState('')
  const [liveTxnText, setLiveTxnText]         = useState('')
  const [copilotCustomText, setCopilotCustomText] = useState('')
  const copilotAnswerRef = useRef('')  // ref so TTS onDone gets the full text

  const speechRec = useSpeechRecognition({
    lang: 'hi-IN',
    onInterim: (interim) => setLiveSpeechText(interim),
    onResult: (transcript) => {
      setLiveSpeechText(transcript)
      handleCopilotQuery(transcript)
    },
    onError: (err) => {
      console.warn('Speech recognition warning:', err)
    },
    onEnd: () => {
      // Keep in COPILOT_LISTENING so user can use chips or retry
    },
  })

  // Real-time speech recognition during transaction recording
  const txnSpeechRec = useSpeechRecognition({
    lang: 'hi-IN',
    onInterim: (interim) => setLiveTxnText(interim),
    onResult: (transcript) => setLiveTxnText(transcript),
  })

  // Live clock
  useEffect(() => {
    const update = () => setTimeStr(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [])

  // Load demo scenarios
  useEffect(() => {
    getDemoScenarios().then(setScenarios).catch(() => {})
  }, [])

  // When audio is ready after stop, upload it immediately
  useEffect(() => {
    if (audioBlob && session && (deviceState === STATE.PROCESSING || deviceState === STATE.RECORDING)) {
      handleAudioUpload(audioBlob)
    }
  }, [audioBlob, session, deviceState]) // eslint-disable-line

  const handleStartTransaction = async () => {
    setError(null)
    setLiveTxnText('')
    resetAudio()
    try {
      const sess = await startSession()
      setSession(sess)
      setDeviceState(STATE.RECORDING)
      startRecording()
      txnSpeechRec.start()
    } catch {
      setError('Could not start session. Is the backend running?')
    }
  }

  const handleStopRecording = () => {
    txnSpeechRec.stop()
    stopRecording()
    setDeviceState(STATE.PROCESSING)
  }

  const handleAudioUpload = async (blobToUpload) => {
    const blob = blobToUpload || audioBlob
    if (!blob || !session) return
    setDeviceState(STATE.PROCESSING)
    try {
      const result = await uploadAudio(session.id, blob, liveTxnText)
      setExtracted(result)

      if (result.isLostSale) {
        setDeviceState(STATE.LOST_SALE)
        speak(`Lost sale noted for ${result.lostSaleProduct || 'requested product'}. Out of stock.`)
      } else if (!result.extractedProducts || result.extractedProducts.length === 0) {
        setDeviceState(STATE.NO_ITEMS_DETECTED)
      } else {
        setDeviceState(STATE.EXTRACTED)
      }
    } catch (e) {
      console.warn('Audio upload warning:', e)
      setExtracted({
        transcript: liveTxnText || '',
        extractedProducts: [],
        confidence: 0,
      })
      setDeviceState(STATE.NO_ITEMS_DETECTED)
    }
  }



  const handleUpdateQty = (index, delta) => {
    if (!extracted || !extracted.extractedProducts) return
    const updated = [...extracted.extractedProducts]
    const newQty = (updated[index].quantity || 1) + delta
    if (newQty <= 0) {
      updated.splice(index, 1)
    } else {
      updated[index] = { ...updated[index], quantity: newQty }
    }
    setExtracted({
      ...extracted,
      extractedProducts: updated,
    })
  }

  const handleSimulatePayment = async (method = 'QR') => {
    if (!session && !extracted) return
    const amount = extracted?.extractedProducts?.reduce((s, p) => s + p.unitPrice * p.quantity, 0) || 30
    setDeviceState(STATE.PAYMENT_SUCCESS)
    try {
      const res = await simulatePayment(session?.id, amount, method)
      const payment = res?.payment || res
      const updatedSession = res?.session || null
      setPaymentResult(payment)

      const itemNames = (extracted?.extractedProducts || []).map(p => `${p.quantity} ${p.name}`).join(' and ') || 'items'
      if (method === 'CASH') {
        speak(`Payment of ${amount} rupees cash received for ${itemNames}. Transaction recorded.`)
      } else if (method === 'UDHAR') {
        speak(`Order of ${amount} rupees recorded to customer Khata credit.`)
      } else {
        speak(`Payment of ${amount} rupees received on Paytm. Thank you.`)
      }

      setTimeout(() => setDeviceState(STATE.RECONCILING), 1000)
      setTimeout(() => {
        const rec = updatedSession?.reconciliation || {
          expectedAmount: amount,
          receivedAmount: amount,
          confidence: extracted?.confidence || 0.97,
          status: 'MATCHED',
          isMatched: true,
          products: extracted?.extractedProducts || [],
        }
        setReconciliation({
          ...rec,
          paymentMethod: method,
          products: rec.matchedItems || rec.products || extracted?.extractedProducts || [],
        })
        const isMatched = rec.status === 'MATCHED' || rec.isMatched === true
        setDeviceState(isMatched ? STATE.MATCHED : STATE.CONFIRM_REQUIRED)
      }, 2200)
    } catch (e) {
      console.error('Payment simulation failed:', e)
      setError('Payment simulation failed.')
    }
  }

  const handleConfirmTransaction = async () => {
    if (!session) return
    try {
      await confirmTransaction(session.id)
      setReconciliation(prev => prev ? { ...prev, status: 'MATCHED', isMatched: true } : prev)
      setDeviceState(STATE.MATCHED)
      speak('Transaction confirmed and saved to dashboard.')
    } catch (e) {
      console.error('Confirm transaction error:', e)
    }
  }

  const handleReset = () => {
    resetAudio()
    stopSpeak()
    setSession(null)
    setExtracted(null)
    setPaymentResult(null)
    setReconciliation(null)
    setError(null)
    setDemoStep(-1)
    setSelectedScenario(null)
    setCopilotQuestion('')
    setCopilotAnswer('')
    setCopilotStreaming(false)
    copilotAnswerRef.current = ''
    setDeviceState(STATE.IDLE)
  }

  // ── Voice Copilot handlers ───────────────────────
  const handleCopilotStart = () => {
    setDeviceState(STATE.COPILOT_LISTENING)
    setCopilotQuestion('')
    setCopilotAnswer('')
    copilotAnswerRef.current = ''
    setCopilotStreaming(false)
    speechRec.start()
  }

  const handleCopilotQuery = async (transcript) => {
    setCopilotQuestion(transcript)
    setDeviceState(STATE.COPILOT_THINKING)
    setCopilotAnswer('')
    copilotAnswerRef.current = ''
    setCopilotStreaming(true)

    await askCopilotStream(
      transcript,
      (chunk) => {
        copilotAnswerRef.current += chunk
        setCopilotAnswer(prev => prev + chunk)
        setDeviceState(STATE.COPILOT_SPEAKING)
      },
      () => {
        setCopilotStreaming(false)
        // Speak the full answer once streaming is complete
        speak(copilotAnswerRef.current, 'hi-IN')
      },
      'soundbox'
    )
  }

  const handleCopilotStop = () => {
    stopSpeak()
    speechRec.stop()
    setDeviceState(STATE.IDLE)
  }

  const handleRunDemoScenario = async (scenario) => {
    setSelectedScenario(scenario)
    setDeviceState(STATE.DEMO_RUNNING)
    setDemoStep(0)
    try {
      const steps = DEMO_STEPS.length
      for (let i = 0; i < steps; i++) {
        setDemoStep(i)
        await new Promise(r => setTimeout(r, 900))
      }
      const result = await runDemoScenario(scenario.id)
      setExtracted({
        transcript: scenario.transcript,
        extractedProducts: scenario.expectedProducts,
        confidence: scenario.confidence / 100,
      })
      setPaymentResult({ amount: scenario.paymentAmount, status: 'SUCCESS' })
      setReconciliation({
        expectedAmount: scenario.expectedProducts.reduce((s, p) => s + p.unitPrice * p.quantity, 0),
        receivedAmount: scenario.paymentAmount,
        confidence: scenario.confidence / 100,
        status: scenario.expectedOutcome,
        products: scenario.expectedProducts,
      })
      if (scenario.paymentAmount > 0) {
        speak(`Payment of ${scenario.paymentAmount} rupees received. Transaction complete.`)
      }
      setDeviceState(scenario.expectedOutcome === 'MATCHED' ? STATE.MATCHED : STATE.CONFIRM_REQUIRED)
    } catch (e) {
      // Fallback - use local scenario data
      setExtracted({
        transcript: scenario.transcript,
        extractedProducts: scenario.expectedProducts,
        confidence: scenario.confidence / 100,
      })
      setPaymentResult({ amount: scenario.paymentAmount, status: 'SUCCESS' })
      setReconciliation({
        expectedAmount: scenario.expectedProducts.reduce((s, p) => s + p.unitPrice * p.quantity, 0),
        receivedAmount: scenario.paymentAmount,
        confidence: scenario.confidence / 100,
        status: scenario.expectedOutcome,
        products: scenario.expectedProducts,
      })
      if (scenario.paymentAmount > 0) speak(`Payment of ${scenario.paymentAmount} rupees received.`)
      setDeviceState(scenario.expectedOutcome === 'MATCHED' ? STATE.MATCHED : STATE.CONFIRM_REQUIRED)
    }
  }

  const handleRunFullDemo = async () => {
    if (!scenarios.length) return
    handleRunDemoScenario(scenarios[0])
  }

  // ── Renders ────────────────────────────────────────────────

  if (deviceState === STATE.IDLE) return (
    <div className="device-home">
      {/* Paytm Brand */}
      <div className="device-brand">
        <div className="device-brand-logo">
          <img
            src="/nav_icon.png"
            alt="Paytm"
            style={{ height: 30, width: 'auto', objectFit: 'contain' }}
          />
        </div>
        <div className="device-brand-sub">Soundbox · Vyapar AI</div>
      </div>

      {/* QR Code */}
      <div>
        <div className="device-qr-box">
          <QRCodeSVG
            value={`paytm://merchant/${MERCHANT_ID}/pay`}
            size={175}
            bgColor="#ffffff"
            fgColor="#002970"
            level="M"
          />
        </div>
        <div className="device-qr-label">SCAN &amp; PAY · MERCHANT ID: M001</div>
      </div>

      <div className="device-status-strip">
        <span className="device-status-dot" />
        <span>READY FOR PAYMENT</span>
      </div>

      {error && (
        <div style={{ color: 'var(--paytm-cyan)', fontSize: '.78rem', textAlign: 'center', padding: '10px 14px', background: 'rgba(0,186,242,.08)', borderRadius: 'var(--r-md)', width: '100%', border: '1px solid rgba(0,186,242,.2)' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="device-actions">
        <button className="device-btn-txn" onClick={handleStartTransaction} id="btn-start-transaction">
          <Mic size={20} />
          Start Transaction
        </button>
        <button className="device-btn-copilot" onClick={handleCopilotStart} id="btn-soundbox-ask-ai">
          <MessageCircle size={18} />
          Ask AI (Awaaz Se Poocho)
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
          <button className="device-btn-demo" onClick={() => setDeviceState(STATE.DEMO_MODE)} id="btn-demo-mode">
            🎬 Demo Mode
          </button>
          <button className="device-btn-demo" onClick={() => nav('/dashboard')} id="btn-open-dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <BarChart3 size={15} /> Dashboard
          </button>
        </div>
      </div>
    </div>
  )

  // ── Voice Copilot Renders ──────────────────────────────
  if (deviceState === STATE.COPILOT_LISTENING) {
    return (
      <div className="device-copilot-listening">
        <div className="device-copilot-top">
          <span className="badge badge-cyan" style={{ fontSize: '.75rem', padding: '4px 12px' }}>
            <MessageCircle size={13} style={{ marginRight: 4 }} /> SOUNDBOX AI COPILOT
          </span>
          <button className="device-icon-btn" onClick={handleCopilotStop} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="device-mic-ring-copilot" onClick={() => speechRec.start()} style={{ cursor: 'pointer' }} title="Click to speak">
          <Mic size={48} className="device-mic-icon" />
          <div className="device-pulse-ring" />
        </div>

        <div className="device-copilot-title">
          {speechRec.isListening ? '🎤 Sun Rahe Hain...' : '🎙️ Mic Active (Boliye)'}
        </div>
        
        {liveSpeechText ? (
          <div className="device-transcript-preview" style={{ width: '100%', color: '#fff', background: 'rgba(0,186,242,0.18)', borderColor: 'var(--paytm-cyan)' }}>
            "{liveSpeechText}"
          </div>
        ) : (
          <div className="device-copilot-subtitle">
            Boliye: <em>"Aaj ka sales kaisa raha?"</em> ya <em>"Maggi ka stock kab order karein?"</em>
          </div>
        )}

        {/* Text fallback input in case browser microphone is blocked */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (copilotCustomText.trim()) {
              handleCopilotQuery(copilotCustomText.trim())
              setCopilotCustomText('')
            }
          }}
          style={{ width: '100%', display: 'flex', gap: '6px' }}
        >
          <input
            className="input"
            style={{ flex: 1, padding: '8px 12px', fontSize: '.85rem', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(0,186,242,0.3)', borderRadius: '8px' }}
            placeholder="Ya yahan sawaal type karein..."
            value={copilotCustomText}
            onChange={(e) => setCopilotCustomText(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={!copilotCustomText.trim()} style={{ borderRadius: '8px' }}>
            Poocho
          </button>
        </form>

        <div className="device-quick-chips">
          <div className="device-quick-chips-label">Quick Suggestions:</div>
          {[
            'Aaj ka business kaisa raha?',
            'Maggi ka stock kab order karna hai?',
            'Sabse zyada kya bik raha hai?',
            'Purane customers ke liye kya offer du?'
          ].map((q, idx) => (
            <button
              key={idx}
              className="device-copilot-chip"
              onClick={() => handleCopilotQuery(q)}
            >
              {q}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: 'auto' }}>
          <button className="btn btn-danger btn-lg" style={{ flex: 1 }} onClick={handleCopilotStop}>
            <StopCircle size={18} /> Cancel
          </button>
        </div>
      </div>
    )
  }


  if (deviceState === STATE.COPILOT_THINKING) {
    return (
      <div className="device-processing">
        <div className="device-spinner" />
        <div className="device-recording-label">AI Soch Raha Hai...</div>
        {copilotQuestion && (
          <div className="device-transcript-box" style={{ maxWidth: '90%', textAlign: 'center' }}>
            "{copilotQuestion}"
          </div>
        )}
        <div className="device-steps" style={{ width: '100%', marginTop: '10px' }}>
          <div className="device-step-item done">
            <div className="device-step-dot" /> Voice Recognised
          </div>
          <div className="device-step-item active">
            <div className="device-step-dot" /> Analysing Store Financials &amp; Stock
          </div>
          <div className="device-step-item pending">
            <div className="device-step-dot" /> Synthesising Voice Response
          </div>
        </div>
      </div>
    )
  }

  if (deviceState === STATE.COPILOT_SPEAKING) {
    return (
      <div className="device-copilot-speaking">
        <div className="device-copilot-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="device-status-dot" style={{ background: 'var(--paytm-cyan)', boxShadow: '0 0 8px var(--paytm-cyan)' }} />
            <span style={{ fontSize: '.78rem', fontWeight: 800, color: 'var(--paytm-cyan)', letterSpacing: '.06em' }}>
              {copilotStreaming ? 'AI STREAMING...' : 'SPEAKER ACTIVE 🔊'}
            </span>
          </div>
          <button className="device-icon-btn" onClick={handleCopilotStop} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Audio Wave Visualizer */}
        <div className="device-audio-wave">
          <span className="wave-bar" style={{ animationDelay: '0.1s' }} />
          <span className="wave-bar" style={{ animationDelay: '0.3s' }} />
          <span className="wave-bar" style={{ animationDelay: '0.2s' }} />
          <span className="wave-bar" style={{ animationDelay: '0.5s' }} />
          <span className="wave-bar" style={{ animationDelay: '0.4s' }} />
          <span className="wave-bar" style={{ animationDelay: '0.2s' }} />
          <span className="wave-bar" style={{ animationDelay: '0.6s' }} />
        </div>

        {copilotQuestion && (
          <div className="device-question-pill">
            <span className="device-question-prefix">Q:</span> {copilotQuestion}
          </div>
        )}

        <div className="device-answer-card">
          <div className="device-answer-text">
            {copilotAnswer || 'Jawab taiyar ho raha hai...'}
            {copilotStreaming && (
              <span className="device-cursor-blink">▌</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: 'auto' }}>
          {!copilotStreaming && (
            <button
              className="device-btn-demo"
              style={{ background: 'rgba(0,186,242,0.15)', borderColor: 'var(--paytm-cyan)', color: 'var(--paytm-cyan)' }}
              onClick={() => speak(copilotAnswerRef.current, 'hi-IN')}
            >
              🔊 Dobara Suniye (Replay Audio)
            </button>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="device-btn-txn" style={{ flex: 1, padding: '12px' }} onClick={handleCopilotStart}>
              🎙️ Naya Sawal
            </button>
            <button className="btn btn-ghost" style={{ padding: '12px 18px', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }} onClick={handleCopilotStop}>
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }


  if (deviceState === STATE.RECORDING) return (
    <div className="device-recording">
      <div className="device-mic-ring">
        <Mic size={48} className="device-mic-icon" />
      </div>
      <div className="device-recording-label">🎤 Listening... (Dukaan ki baatchit sun rahe hain)</div>
      <div className="device-transcript-preview" style={liveTxnText ? { color: '#fff', background: 'rgba(0,186,242,0.18)', borderColor: 'var(--paytm-cyan)', fontStyle: 'normal' } : {}}>
        {liveTxnText ? `"${liveTxnText}"` : 'Speak now — customer order or payment conversation (e.g. "Bhaiya 2 Maggi aur ek Coke dena")'}
      </div>
      <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
        <button className="btn btn-danger btn-lg" style={{ flex: 1 }} onClick={handleStopRecording} id="btn-stop-recording">
          <StopCircle size={18} /> Stop
        </button>

        <button className="btn btn-ghost btn-lg" onClick={handleReset}>
          <RefreshCw size={18} />
        </button>
      </div>
    </div>
  )

  if (deviceState === STATE.PROCESSING) return (
    <div className="device-processing">
      <div className="device-spinner" />
      <div className="device-recording-label">Processing Audio...</div>
      <div className="device-steps" style={{ width: '100%' }}>
        {['Uploading audio', 'Speech-to-Text (Sarvam)', 'AI extraction', 'Entity resolution'].map((s, i) => (
          <div key={s} className={`device-step-item ${i === 1 ? 'active' : i === 0 ? 'done' : 'pending'}`}>
            <div className="device-step-dot" />
            {s}
          </div>
        ))}
      </div>
    </div>
  )

  if (deviceState === STATE.NO_ITEMS_DETECTED) {
    const transcriptText = extracted?.transcript || liveTxnText || '(No speech detected)'
    return (
      <div className="device-extracted">
        <div className="device-brand">
          <div className="device-brand-logo">
            <img src="/nav_icon.png" alt="Paytm" style={{ height: 26, width: 'auto', objectFit: 'contain' }} />
          </div>
          <div className="device-brand-sub">Conversation Analysis</div>
        </div>

        <div style={{ textAlign: 'center', padding: '12px 8px 4px' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '6px' }}>💬</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            Normal Conversation Detected
          </div>
          <div style={{ fontSize: '.78rem', color: 'var(--device-text-2)', lineHeight: 1.4 }}>
            No purchase items or payment amount were detected in this audio.
          </div>
        </div>

        <div className="device-section-label" style={{ marginTop: '6px' }}>Recognised Speech</div>
        <div className="device-transcript-box" style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>
          "{transcriptText}"
        </div>

        <div style={{ background: 'rgba(0,186,242,0.08)', border: '1px solid rgba(0,186,242,0.2)', borderRadius: '12px', padding: '12px', fontSize: '.78rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
          ℹ️ <strong>Soundbox is active:</strong> Casual chit-chat, greetings ("हेलो जी"), and background talk are automatically ignored and not billed.
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <button className="device-btn-txn" onClick={handleStartTransaction} id="btn-retry-order">
            <Mic size={18} /> Record New Order
          </button>
          <button className="device-btn-copilot" onClick={handleCopilotStart} id="btn-ask-ai-from-no-items">
            <MessageCircle size={16} /> Ask Soundbox AI
          </button>
          <button className="btn btn-ghost" style={{ color: 'rgba(255,255,255,0.6)' }} onClick={handleReset}>
            ↩ Return to QR Screen
          </button>
        </div>
      </div>
    )
  }

  if (deviceState === STATE.LOST_SALE) {
    const item = extracted?.lostSaleProduct || 'Requested Item'
    return (
      <div className="device-extracted">
        <div className="device-brand">
          <div className="device-brand-logo">
            <img src="/nav_icon.png" alt="Paytm" style={{ height: 26, width: 'auto', objectFit: 'contain' }} />
          </div>
          <div className="device-brand-sub">Commerce Intelligence</div>
        </div>

        <div style={{ textAlign: 'center', padding: '12px 8px 4px' }}>
          <div style={{ fontSize: '2.2rem', marginBottom: '6px' }}>📉</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fbbf24', marginBottom: '4px' }}>
            Lost Sale Signal Logged
          </div>
          <div style={{ fontSize: '.78rem', color: 'var(--device-text-2)', lineHeight: 1.4 }}>
            Customer asked for an out-of-stock item.
          </div>
        </div>

        <div className="device-section-label">Out of Stock Item</div>
        <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: '.95rem' }}>{item}</span>
          <span className="badge badge-warning" style={{ background: 'rgba(245,158,11,0.25)', color: '#fbbf24', fontSize: '.7rem' }}>OUT OF STOCK</span>
        </div>

        <div className="device-section-label" style={{ marginTop: '10px' }}>Conversation</div>
        <div className="device-transcript-box">
          "{extracted?.transcript}"
        </div>

        <div style={{ background: 'rgba(0,186,242,0.08)', border: '1px solid rgba(0,186,242,0.2)', borderRadius: '12px', padding: '10px 14px', fontSize: '.75rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
          💡 Logged into Merchant Inventory Signals so you can restock before the weekend!
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <button className="device-btn-txn" onClick={handleStartTransaction}>
            <Mic size={18} /> Next Transaction
          </button>
          <button className="btn btn-ghost" style={{ color: 'rgba(255,255,255,0.6)' }} onClick={handleReset}>
            ↩ Done
          </button>
        </div>
      </div>
    )
  }

  if (deviceState === STATE.EXTRACTED) {
    const total = extracted?.extractedProducts?.reduce((s, p) => s + p.unitPrice * p.quantity, 0) || 0
    return (
      <div className="device-extracted">
        <div className="device-section-label">Transcript</div>
        <div className="device-transcript-box">"{extracted?.transcript}"</div>

        <div className="device-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Extracted Items</span>
          <span style={{ fontSize: '.75rem', color: '#fff', fontWeight: 800 }}>Total: ₹{total}</span>
        </div>

        <div className="device-product-list">
          {extracted?.extractedProducts?.map((p, i) => (
            <div key={i} className="device-product-item">
              <div>
                <div className="device-product-name">{p.name}</div>
                <div className="device-product-price">₹{p.unitPrice} each</div>
              </div>
              <div className="device-qty-ctrl">
                <button className="device-qty-btn" onClick={() => handleUpdateQty(i, -1)}>−</button>
                <span className="device-qty-val">{p.quantity}</span>
                <button className="device-qty-btn" onClick={() => handleUpdateQty(i, 1)}>+</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
          <span style={{ fontSize: '.78rem', color: 'var(--device-text-2)' }}>Confidence</span>
          <span style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--success)' }}>
            {Math.round((extracted?.confidence || 0.97) * 100)}%
          </span>
        </div>
        <div className="device-confidence-bar">
          <div className="device-confidence-fill" style={{ width: `${Math.round((extracted?.confidence || 0.97) * 100)}%` }} />
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <button className="device-btn-txn" onClick={() => setDeviceState(STATE.PAYMENT_PENDING)} id="btn-go-to-payment">
            📱 Paytm QR / Online (₹{total})
          </button>
          <button className="device-btn-cash" onClick={() => handleSimulatePayment('CASH')} id="btn-cash-payment">
            💵 Cash Received (₹{total})
          </button>
          <button className="device-btn-udhar" onClick={() => handleSimulatePayment('UDHAR')} id="btn-udhar-payment">
            📒 Record to Khata / Udhar
          </button>
          <button className="btn btn-ghost" style={{ color: 'rgba(255,255,255,0.6)' }} onClick={handleReset}>
            ↩ Cancel
          </button>
        </div>
      </div>
    )
  }

  if (deviceState === STATE.PAYMENT_PENDING) {
    const total = extracted?.extractedProducts?.reduce((s, p) => s + p.unitPrice * p.quantity, 0) || 0
    return (
      <div className="device-payment">
        <div className="device-brand"><div className="device-brand-name">Payment Options</div></div>
        <div className="device-amount-display">
          <div className="device-amount-label">Amount Due</div>
          <div className="device-amount-value">₹{total}</div>
          <div className="device-amount-note">Select Customer Payment Mode</div>
        </div>

        <div className="device-product-list" style={{ width: '100%' }}>
          {extracted?.extractedProducts?.map((p, i) => (
            <div key={i} className="device-product-item">
              <span className="device-product-name">{p.name} ×{p.quantity}</span>
              <span className="device-product-qty">₹{p.unitPrice * p.quantity}</span>
            </div>
          ))}
        </div>

        <div className="device-payment-options" style={{ marginTop: 'auto' }}>
          <button className="device-btn-txn" onClick={() => handleSimulatePayment('QR')} id="btn-simulate-qr">
            📱 Simulate Paytm UPI (₹{total})
          </button>
          <button className="device-btn-cash" onClick={() => handleSimulatePayment('CASH')} id="btn-simulate-cash">
            💵 Cash Received (₹{total})
          </button>
          <button className="device-btn-udhar" onClick={() => handleSimulatePayment('UDHAR')} id="btn-simulate-udhar">
            📒 Put on Customer Khata
          </button>
          <button className="device-btn-demo" onClick={handleReset}>↩ Cancel</button>
        </div>
      </div>
    )
  }

  if (deviceState === STATE.PAYMENT_SUCCESS) {
    const method = (paymentResult?.method || 'QR').toUpperCase()
    const methodLabel = method === 'CASH' ? '💵 CASH RECEIVED' : method === 'UDHAR' ? '📒 KHATA LOGGED' : '✓ PAYMENT RECEIVED'
    return (
      <div className="device-payment-success">
        <div className="device-success-ring">
          <CheckCircle size={48} color={method === 'UDHAR' ? '#a78bfa' : 'var(--success)'} />
        </div>
        <div className="device-success-amount">
          ₹{paymentResult?.amount || extracted?.extractedProducts?.reduce((s, p) => s + p.unitPrice * p.quantity, 0) || 0}
        </div>
        <div className="device-success-label" style={{ color: method === 'UDHAR' ? '#a78bfa' : undefined }}>
          {methodLabel}
        </div>
        <div style={{ color: 'var(--device-text-2)', fontSize: '.82rem' }}>Reconciling &amp; saving to dashboard...</div>
      </div>
    )
  }

  if (deviceState === STATE.RECONCILING) return (
    <div className="device-processing">
      <div className="device-spinner" />
      <div className="device-recording-label">Reconciling...</div>
      <div className="device-step-label">Matching payment with extracted products</div>
    </div>
  )

  if (deviceState === STATE.MATCHED || deviceState === STATE.CONFIRM_REQUIRED) {
    const isMatched = deviceState === STATE.MATCHED || reconciliation?.status === 'MATCHED'
    const confidence = reconciliation?.confidence || 0.97
    return (
      <div className="device-result">
        <div className="device-section-label">Transaction Result</div>
        <div className={`device-match-badge ${isMatched ? 'matched' : 'confirm'}`}>
          {isMatched ? <><CheckCircle size={20} /> MATCHED</> : <><AlertTriangle size={20} /> CONFIRMATION REQUIRED</>}
        </div>

        <div style={{ textAlign: 'center', fontSize: '.8rem', color: 'var(--device-text-2)', padding: '2px 0' }}>
          Payment Mode:{' '}
          <span style={{ color: '#fff', fontWeight: 800 }}>
            {(reconciliation?.paymentMethod || paymentResult?.method) === 'CASH'
              ? '💵 Cash'
              : (reconciliation?.paymentMethod || paymentResult?.method) === 'UDHAR'
              ? '📒 Customer Khata'
              : '📱 Paytm UPI'}
          </span>
        </div>

        <div className="device-product-list">
          {reconciliation?.products?.map((p, i) => (
            <div key={i} className="device-product-item">
              <span className="device-product-name">{p.name} ×{p.quantity}</span>
              <span className="device-product-qty">₹{(p.unitPrice || 0) * (p.quantity || 1)}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '.82rem' }}>
          <span style={{ color: 'var(--device-text-2)' }}>Expected</span>
          <span style={{ color: '#fff', fontWeight: 700 }}>₹{reconciliation?.expectedAmount}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '.82rem' }}>
          <span style={{ color: 'var(--device-text-2)' }}>Received</span>
          <span style={{ color: 'var(--success)', fontWeight: 700 }}>₹{reconciliation?.receivedAmount}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '.82rem' }}>
          <span style={{ color: 'var(--device-text-2)' }}>Confidence</span>
          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{Math.round(confidence * 100)}%</span>
        </div>
        <div className="device-confidence-bar">
          <div className="device-confidence-fill" style={{ width: `${Math.round(confidence * 100)}%` }} />
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!isMatched ? (
            <>
              <button
                className="device-btn-txn"
                onClick={handleConfirmTransaction}
                id="btn-confirm-transaction"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                ✓ Confirm &amp; Save Transaction
              </button>
              <button className="device-btn-demo" onClick={handleReset}>
                + New Transaction
              </button>
            </>
          ) : (
            <button className="device-btn-txn" onClick={handleReset} id="btn-new-transaction">
              + New Transaction
            </button>
          )}
          <button className="device-btn-demo" onClick={() => nav('/dashboard')}>
            📊 View Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (deviceState === STATE.DEMO_MODE) return (
    <div className="device-demo">
      <div className="device-demo-header">
        <div className="device-demo-title">🎬 Demo Mode</div>
        <button style={{ background: 'none', border: 'none', color: 'var(--device-text-2)', cursor: 'pointer' }} onClick={handleReset}>✕</button>
      </div>

      <button className="device-run-full" onClick={handleRunFullDemo} id="btn-run-full-demo">
        <Zap size={18} style={{ display: 'inline', marginRight: '6px' }} />
        RUN FULL DEMO
      </button>

      <div className="device-section-label" style={{ marginTop: '4px' }}>— OR SELECT A SCENARIO —</div>

      {scenarios.length === 0 && (
        <div style={{ color: 'var(--device-text-2)', fontSize: '.82rem', textAlign: 'center', padding: '16px' }}>
          Loading scenarios from backend...
        </div>
      )}

      {scenarios.map((sc, i) => (
        <div key={sc.id} className={`device-scenario-card ${selectedScenario?.id === sc.id ? 'selected' : ''}`}
          onClick={() => handleRunDemoScenario(sc)} id={`btn-scenario-${i + 1}`}>
          <div className="device-scenario-num">SCENARIO {String(i + 1).padStart(2, '0')}</div>
          <div className="device-scenario-title">{sc.title.replace(/^Scenario \d+: /, '')}</div>
          <div className="device-scenario-desc">{sc.description}</div>
          <div className="device-scenario-meta">
            {sc.paymentAmount > 0 && <span className="device-scenario-tag">₹{sc.paymentAmount}</span>}
            <span className="device-scenario-tag">{sc.expectedOutcome}</span>
            <span className="device-scenario-tag">{sc.confidence}% confidence</span>
          </div>
        </div>
      ))}
    </div>
  )

  if (deviceState === STATE.DEMO_RUNNING) return (
    <div className="device-processing">
      <div className="device-spinner" />
      <div className="device-recording-label">
        {selectedScenario?.title?.replace(/^Scenario \d+: /, '') || 'Running Demo...'}
      </div>
      <div className="device-steps" style={{ width: '100%' }}>
        {DEMO_STEPS.map((s, i) => (
          <div key={s} className={`device-step-item ${i < demoStep ? 'done' : i === demoStep ? 'active' : 'pending'}`}>
            <div className="device-step-dot" />
            {s}
          </div>
        ))}
      </div>
    </div>
  )

  return null
}
