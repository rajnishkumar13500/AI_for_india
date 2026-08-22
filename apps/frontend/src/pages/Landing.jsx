import { useNavigate } from 'react-router-dom'
import { Smartphone, BarChart3, Zap, ArrowRight } from 'lucide-react'
import './Landing.css'

export default function Landing() {
  const nav = useNavigate()
  return (
    <div className="landing-root">
      {/* Background */}
      <div className="landing-bg">
        <div className="landing-blob landing-blob-1" />
        <div className="landing-blob landing-blob-2" />
        <div className="landing-grid" />
      </div>

      <div className="landing-content page-enter">
        {/* Header */}
        <div className="landing-header">
          <div className="landing-logo">
            <div className="landing-logo-icon"><Zap size={28} /></div>
            <div>
              <div className="landing-logo-name">Paytm Vyapar AI</div>
              <div className="landing-logo-tag">Commerce Intelligence Platform</div>
            </div>
          </div>
          <div className="badge badge-blue">HACKATHON DEMO</div>
        </div>

        {/* Hero */}
        <div className="landing-hero">
          <h1 className="landing-title">
            Every payment tells you<br />
            <span className="landing-title-accent">how much.</span><br />
            Every conversation tells you<br />
            <span className="landing-title-accent">what.</span>
          </h1>
          <p className="landing-subtitle">
            A transaction-aware AI platform that connects merchant-counter conversations
            with payment events to build real commerce intelligence.
          </p>
        </div>

        {/* Interface Cards */}
        <div className="landing-cards">
          {/* Device Card */}
          <div className="landing-card landing-card-device" onClick={() => nav('/device')} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && nav('/device')}>
            <div className="landing-card-icon device-icon">
              <Smartphone size={36} />
            </div>
            <div className="landing-card-body">
              <h2 className="landing-card-title">Merchant Device</h2>
              <p className="landing-card-desc">
                Simulated Paytm payment device. QR code, voice recording, transaction extraction & payment simulation.
              </p>
              <ul className="landing-card-features">
                <li>📷 QR Code Scanner</li>
                <li>🎤 Voice Transaction Capture</li>
                <li>💳 Payment Simulator</li>
                <li>🔊 Voice Announcements</li>
                <li>🎬 Demo Mode (5 Scenarios)</li>
              </ul>
            </div>
            <div className="landing-card-action">
              Open Device <ArrowRight size={18} />
            </div>
          </div>

          {/* Analytics Card */}
          <div className="landing-card landing-card-dash" onClick={() => nav('/dashboard')} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && nav('/dashboard')}>
            <div className="landing-card-icon dash-icon">
              <BarChart3 size={36} />
            </div>
            <div className="landing-card-body">
              <h2 className="landing-card-title">Merchant Analytics</h2>
              <p className="landing-card-desc">
                Full business intelligence dashboard. AI insights, product intelligence, inventory risk & ask-AI copilot.
              </p>
              <ul className="landing-card-features">
                <li>📊 Revenue & Trend Analysis</li>
                <li>🧠 AI-Generated Insights</li>
                <li>📦 Inventory Risk Alerts</li>
                <li>👥 Customer Segmentation</li>
                <li>🤖 Ask AI Copilot</li>
              </ul>
            </div>
            <div className="landing-card-action">
              Open Dashboard <ArrowRight size={18} />
            </div>
          </div>
        </div>

        {/* Flow */}
        <div className="landing-flow">
          {['Conversation', 'STT', 'AI Extract', 'Payment', 'Reconcile', 'Intelligence'].map((step, i, arr) => (
            <div key={step} className="landing-flow-row">
              <div className="landing-flow-step">{step}</div>
              {i < arr.length - 1 && <div className="landing-flow-arrow">↓</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
