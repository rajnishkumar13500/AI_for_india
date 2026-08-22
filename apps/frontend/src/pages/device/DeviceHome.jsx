import { useState, useEffect, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Mic, MicOff, Play, StopCircle, RefreshCw, CheckCircle, AlertTriangle, Upload, Zap, BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAudioRecorder } from '../../hooks/useAudioRecorder.js'
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis.js'
import { startSession, uploadAudio, getDemoScenarios, runDemoScenario, resetDemo } from '../../api/sessions.js'
import { simulatePayment } from '../../api/payments.js'
import { MERCHANT_ID } from '../../api/config.js'

// Device state machine
const STATE = {
  IDLE: 'IDLE',
  RECORDING: 'RECORDING',
  PROCESSING: 'PROCESSING',
  EXTRACTED: 'EXTRACTED',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  RECONCILING: 'RECONCILING',
  MATCHED: 'MATCHED',
  CONFIRM_REQUIRED: 'CONFIRM_REQUIRED',
  DEMO_MODE: 'DEMO_MODE',
  DEMO_RUNNING: 'DEMO_RUNNING',
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
  const { speak } = useSpeechSynthesis()

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

  // When audio is ready after stop, upload it
  useEffect(() => {
    if (audioBlob && deviceState === STATE.RECORDING) return // still recording check
    if (audioBlob && session && deviceState !== STATE.PROCESSING) {
      handleAudioUpload()
    }
  }, [audioBlob]) // eslint-disable-line

  const handleStartTransaction = async () => {
    setError(null)
    resetAudio()
    try {
      const sess = await startSession()
      setSession(sess)
      setDeviceState(STATE.RECORDING)
      startRecording()
    } catch {
      setError('Could not start session. Is the backend running?')
    }
  }

  const handleStopRecording = () => {
    stopRecording()
    setDeviceState(STATE.PROCESSING)
  }

  const handleAudioUpload = async () => {
    if (!audioBlob || !session) return
    setDeviceState(STATE.PROCESSING)
    try {
      const result = await uploadAudio(session.id, audioBlob)
      setExtracted(result)
      setDeviceState(STATE.EXTRACTED)
    } catch {
      setError('Audio processing failed. Using demo fallback.')
      setExtracted({
        transcript: 'Bhaiya 2 Maggi aur ek Coke dena.',
        extractedProducts: [
          { name: 'Maggi 2-Min Noodles', quantity: 2, unitPrice: 15 },
          { name: 'Coca-Cola 500ml', quantity: 1, unitPrice: 50 },
        ],
        confidence: 0.97,
      })
      setDeviceState(STATE.EXTRACTED)
    }
  }

  const handleSimulatePayment = async () => {
    if (!session && !extracted) return
    const amount = extracted?.extractedProducts?.reduce((s, p) => s + p.unitPrice * p.quantity, 0) || 80
    setDeviceState(STATE.PAYMENT_SUCCESS)
    try {
      const payment = await simulatePayment(session?.id, amount)
      setPaymentResult(payment)
      speak(`Payment of ${amount} rupees received. Thank you.`)
      setTimeout(() => setDeviceState(STATE.RECONCILING), 1500)
      setTimeout(() => {
        const matched = true // simplified for demo
        setReconciliation({
          expectedAmount: amount,
          receivedAmount: amount,
          confidence: extracted?.confidence || 0.97,
          status: matched ? 'MATCHED' : 'CONFIRMATION_REQUIRED',
          products: extracted?.extractedProducts || [],
        })
        setDeviceState(matched ? STATE.MATCHED : STATE.CONFIRM_REQUIRED)
      }, 3000)
    } catch {
      setError('Payment simulation failed.')
    }
  }

  const handleReset = () => {
    resetAudio()
    setSession(null)
    setExtracted(null)
    setPaymentResult(null)
    setReconciliation(null)
    setError(null)
    setDemoStep(-1)
    setSelectedScenario(null)
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
      <div className="device-brand">
        <div className="device-brand-name">Paytm Vyapar AI</div>
        <div className="device-brand-sub">Commerce Intelligence</div>
      </div>

      <div>
        <div className="device-qr-box">
          <QRCodeSVG
            value={`paytm://merchant/${MERCHANT_ID}/pay`}
            size={180}
            bgColor="#ffffff"
            fgColor="#002970"
            level="M"
          />
        </div>
        <div className="device-qr-label">SCAN TO PAY • M001</div>
      </div>

      <div className="device-status-strip">
        <span className="device-status-dot" />
        <span>READY FOR PAYMENT</span>
      </div>

      {error && <div style={{ color: 'var(--danger)', fontSize: '.78rem', textAlign: 'center', padding: '8px', background: 'rgba(239,68,68,.1)', borderRadius: 'var(--r-md)', width: '100%' }}>{error}</div>}

      <div className="device-actions">
        <button className="device-btn-txn" onClick={handleStartTransaction} id="btn-start-transaction">
          <Mic size={20} />
          Start Transaction
        </button>
        <button className="device-btn-demo" onClick={() => setDeviceState(STATE.DEMO_MODE)} id="btn-demo-mode">
          🎬 Demo Mode
        </button>
        <button className="device-btn-demo" onClick={() => nav('/dashboard')} id="btn-open-dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <BarChart3 size={15} /> Open Dashboard
        </button>
      </div>
    </div>
  )

  if (deviceState === STATE.RECORDING) return (
    <div className="device-recording">
      <div className="device-mic-ring">
        <Mic size={48} className="device-mic-icon" />
      </div>
      <div className="device-recording-label">🎤 Listening...</div>
      <div className="device-transcript-preview">Speak now — customer order or payment conversation</div>
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

  if (deviceState === STATE.EXTRACTED) return (
    <div className="device-extracted">
      <div className="device-section-label">Transcript</div>
      <div className="device-transcript-box">"{extracted?.transcript}"</div>

      <div className="device-section-label">Extracted Items</div>
      <div className="device-product-list">
        {extracted?.extractedProducts?.map((p, i) => (
          <div key={i} className="device-product-item">
            <div>
              <div className="device-product-name">{p.name}</div>
              <div className="device-product-price">₹{p.unitPrice} each</div>
            </div>
            <div className="device-product-qty">×{p.quantity}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
        <span style={{ fontSize: '.78rem', color: 'var(--device-text-2)' }}>Confidence</span>
        <span style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--success)' }}>{Math.round((extracted?.confidence || 0.97) * 100)}%</span>
      </div>
      <div className="device-confidence-bar">
        <div className="device-confidence-fill" style={{ width: `${Math.round((extracted?.confidence || 0.97) * 100)}%` }} />
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button className="device-btn-txn" onClick={() => setDeviceState(STATE.PAYMENT_PENDING)} id="btn-go-to-payment">
          💳 Simulate Payment
        </button>
        <button className="device-btn-demo" onClick={handleReset}>↩ Cancel</button>
      </div>
    </div>
  )

  if (deviceState === STATE.PAYMENT_PENDING) {
    const total = extracted?.extractedProducts?.reduce((s, p) => s + p.unitPrice * p.quantity, 0) || 80
    return (
      <div className="device-payment">
        <div className="device-brand"><div className="device-brand-name">Payment Simulator</div></div>
        <div className="device-amount-display">
          <div className="device-amount-label">Amount Due</div>
          <div className="device-amount-value">₹{total}</div>
          <div className="device-amount-note">Demo Payment Event</div>
        </div>
        <div className="device-product-list" style={{ width: '100%' }}>
          {extracted?.extractedProducts?.map((p, i) => (
            <div key={i} className="device-product-item">
              <span className="device-product-name">{p.name} ×{p.quantity}</span>
              <span className="device-product-qty">₹{p.unitPrice * p.quantity}</span>
            </div>
          ))}
        </div>
        <button className="device-btn-txn" style={{ width: '100%', marginTop: 'auto' }} onClick={handleSimulatePayment} id="btn-simulate-payment">
          ✓ Simulate ₹{total} Payment
        </button>
        <button className="device-btn-demo" onClick={handleReset}>↩ Cancel</button>
      </div>
    )
  }

  if (deviceState === STATE.PAYMENT_SUCCESS) return (
    <div className="device-payment-success">
      <div className="device-success-ring">
        <CheckCircle size={48} color="var(--success)" />
      </div>
      <div className="device-success-amount">₹{paymentResult?.amount || extracted?.extractedProducts?.reduce((s, p) => s + p.unitPrice * p.quantity, 0) || 80}</div>
      <div className="device-success-label">✓ PAYMENT RECEIVED</div>
      <div style={{ color: 'var(--device-text-2)', fontSize: '.82rem' }}>Reconciling transaction...</div>
    </div>
  )

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
          <button className="device-btn-txn" onClick={handleReset} id="btn-new-transaction">
            + New Transaction
          </button>
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
