import { useNavigate } from 'react-router-dom'
import {
  Smartphone, BarChart3, Brain, Package,
  Users, Tag, MessageSquare, Zap, Shield, TrendingUp
} from 'lucide-react'
import './Landing.css'

const SERVICES = [
  { icon: Smartphone,    label: 'Soundbox\nDevice' },
  { icon: BarChart3,     label: 'Revenue\nAnalytics' },
  { icon: Brain,         label: 'AI Insights' },
  { icon: Package,       label: 'Product\nIntelligence' },
  { icon: Users,         label: 'Customer\nSegments' },
  { icon: Tag,           label: 'Smart\nOffers' },
  { icon: MessageSquare, label: 'Ask AI\nCopilot' },
  { icon: TrendingUp,    label: 'Inventory\nAlerts' },
  { icon: Shield,        label: 'Payment\nSecurity' },
  { icon: Zap,           label: 'Real-Time\nUpdates' },
]

export default function Landing() {
  const nav = useNavigate()
  return (
    <div className="landing-root">
      {/* ── TOP NAV — White, exactly like Paytm.com ── */}
      <header className="landing-topnav">
        <div className="landing-topnav-inner">
          <div className="landing-logo">
            {/* Paytm wordmark — lowercase, rounded */}
            <span className="logo-pay">pay</span><span className="logo-tm">tm</span>
            <span className="logo-divider">|</span>
            <span className="logo-sub">Vyapar AI</span>
          </div>
          <nav className="landing-nav-links">
            <a href="#device"    onClick={e => { e.preventDefault(); nav('/device')    }}>Soundbox Device</a>
            <a href="#dashboard" onClick={e => { e.preventDefault(); nav('/dashboard') }}>Analytics Dashboard</a>
            <a href="#features"  className="nav-link-muted">Features</a>
            <a href="#about"     className="nav-link-muted">About</a>
          </nav>
          <div className="landing-nav-actions">
            <button className="btn btn-outline btn-sm" onClick={() => nav('/device')} id="btn-nav-soundbox">
              Open Soundbox
            </button>
            <button className="btn btn-paytm btn-sm" onClick={() => nav('/dashboard')} id="btn-nav-dashboard">
              Paytm for Business
            </button>
          </div>
        </div>
      </header>

      {/* ── NAVY SERVICE STRIP — Exactly like paytm.com/recharge icon grid ── */}
      <section className="landing-service-strip">
        <div className="landing-service-inner">
          <div className="landing-service-title">Paytm Commerce Intelligence Suite</div>
          <div className="landing-service-grid">
            {SERVICES.map(({ icon: Icon, label }) => (
              <div className="landing-service-item" key={label}>
                <div className="landing-service-icon">
                  <Icon size={28} strokeWidth={1.5} />
                </div>
                <span className="landing-service-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BODY — Light grey bg with white cards (like paytm.com/recharge form) ── */}
      <main className="landing-body">
        <div className="landing-body-inner">

          {/* Headline */}
          <div className="landing-headline">
            <div className="landing-tagline-badge">🧠 AI-Native · Built for India's Kirana Stores</div>
            <h1 className="landing-h1">
              Every payment tells you <span className="landing-h1-accent">how much.</span><br />
              Every conversation tells you <span className="landing-h1-accent">what.</span>
            </h1>
            <p className="landing-p">
              Paytm's transaction-aware AI connects merchant counter conversations
              with payment events — turning every sale into actionable business intelligence.
            </p>
          </div>

          {/* Two cards side by side — like Paytm promo cards */}
          <div className="landing-card-row">

            {/* Device Card */}
            <div
              className="landing-card landing-card-device"
              onClick={() => nav('/device')}
              role="button" tabIndex={0}
              id="card-soundbox"
              onKeyDown={e => e.key === 'Enter' && nav('/device')}
            >
              <div className="landing-card-label">PAYTM SOUNDBOX</div>
              <h2 className="landing-card-title">Merchant Device Simulator</h2>
              <p className="landing-card-desc">
                Simulate a Paytm Soundbox — scan QR codes, capture voice transactions
                in Hindi/English, AI-extract products, simulate payment, and get instant
                voice confirmations.
              </p>
              <ul className="landing-card-features">
                <li>📷 Dynamic QR Code (UPI Pay)</li>
                <li>🎤 Hindi + English Voice Capture</li>
                <li>🤖 AI Transaction Extraction</li>
                <li>🔊 "Payment Received" Voice Alert</li>
                <li>🎬 5 Pre-loaded Demo Scenarios</li>
              </ul>
              <button className="btn btn-primary-full landing-card-btn" id="btn-open-soundbox">
                Open Soundbox →
              </button>
            </div>

            {/* Dashboard Card */}
            <div
              className="landing-card landing-card-dash"
              onClick={() => nav('/dashboard')}
              role="button" tabIndex={0}
              id="card-dashboard"
              onKeyDown={e => e.key === 'Enter' && nav('/dashboard')}
            >
              <div className="landing-card-label landing-card-label-navy">PAYTM FOR BUSINESS</div>
              <h2 className="landing-card-title">Merchant Analytics Dashboard</h2>
              <p className="landing-card-desc">
                Full business intelligence dashboard — today's revenue, AI insights,
                product trends, inventory risk alerts, customer segmentation and
                an AI copilot that understands Hindi.
              </p>
              <ul className="landing-card-features">
                <li>📊 Live Revenue & 14-Day Trends</li>
                <li>🧠 AI-Generated Business Insights</li>
                <li>📦 Inventory Risk Alerts</li>
                <li>👥 Customer Segmentation</li>
                <li>💬 Ask AI Copilot (Hindi/English)</li>
              </ul>
              <button className="btn btn-paytm landing-card-btn w-full" id="btn-open-dashboard">
                Open Dashboard →
              </button>
            </div>
          </div>

          {/* Pipeline strip — like Paytm feature highlights */}
          <div className="landing-pipeline">
            <div className="landing-pipeline-title">How it works</div>
            <div className="landing-pipeline-steps">
              {['Merchant Counter Conversation', 'Paytm Speech-to-Text', 'AI Product Extraction', 'UPI Payment Event', 'AI Reconciliation', 'Business Intelligence'].map((step, i, arr) => (
                <div key={step} className="landing-pipeline-row">
                  <div className="landing-pipeline-step">
                    <span className="landing-pipeline-num">{i + 1}</span>
                    {step}
                  </div>
                  {i < arr.length - 1 && <div className="landing-pipeline-arrow">→</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Hackathon badge */}
          <div className="landing-footer-note">
            🏆 Hackathon Demo · Paytm Commerce Intelligence Platform · Built for India
          </div>
        </div>
      </main>
    </div>
  )
}
