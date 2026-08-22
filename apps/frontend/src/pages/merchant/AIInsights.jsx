import { useEffect, useState } from 'react'
import { getInsights } from '../../api/analytics.js'
import { RefreshCw } from 'lucide-react'

export default function AIInsights() {
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getInsights().then(data => { setInsights(Array.isArray(data) ? data : []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const typeConfig = {
    OPPORTUNITY: { color: 'var(--success)', bg: 'var(--success-bg)', emoji: '🔥', label: 'Opportunity' },
    RISK:        { color: 'var(--danger)',  bg: 'var(--danger-bg)',  emoji: '⚠️', label: 'Risk' },
    CONCERN:     { color: 'var(--warning)', bg: 'var(--warning-bg)', emoji: '📉', label: 'Concern' },
    INFO:        { color: 'var(--info)',    bg: 'var(--info-bg)',    emoji: '💡', label: 'Info' },
  }

  return (
    <div className="page-enter">
      <div className="page-header flex items-center justify-between">
        <div><h1>🧠 AI Insights</h1><p>What your business data is telling you — explained in plain language.</p></div>
        <button className="btn btn-ghost btn-sm" onClick={() => { setLoading(true); getInsights().then(d => { setInsights(Array.isArray(d) ? d : []); setLoading(false) }) }} id="btn-refresh-insights"><RefreshCw size={15} /> Refresh</button>
      </div>

      {loading && <div className="flex flex-col gap-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 160 }} />)}</div>}

      {!loading && insights.length === 0 && (
        <div className="section-card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
          <h3 style={{ marginBottom: '8px' }}>All looks good!</h3>
          <p>No critical insights right now. Complete a few transactions to see AI analysis.</p>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {insights.map((ins, i) => {
          const cfg = typeConfig[ins.type] || typeConfig.INFO
          return (
            <div key={i} className="section-card" style={{ borderLeft: `4px solid ${cfg.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.emoji} {cfg.label}</span>
                {ins.impact && <span className="text-sm" style={{ color: 'var(--dash-text-2)' }}>Impact: {ins.impact}</span>}
              </div>
              <h3 style={{ marginBottom: '8px', color: 'var(--dash-text)' }}>{ins.title}</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '16px 0' }}>
                {ins.whatHappened && (
                  <div style={{ padding: '12px', background: 'var(--dash-surface-2)', borderRadius: 'var(--r-md)' }}>
                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--dash-text-2)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '4px' }}>What Happened?</div>
                    <div style={{ fontSize: '.88rem', color: 'var(--dash-text)' }}>{ins.whatHappened}</div>
                  </div>
                )}
                {ins.why && (
                  <div style={{ padding: '12px', background: 'var(--dash-surface-2)', borderRadius: 'var(--r-md)' }}>
                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--dash-text-2)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '4px' }}>Why?</div>
                    <div style={{ fontSize: '.88rem', color: 'var(--dash-text)' }}>{ins.why}</div>
                  </div>
                )}
                {ins.recommendation && (
                  <div style={{ padding: '12px', background: `rgba(0,186,242,.06)`, border: `1px solid rgba(0,186,242,.15)`, borderRadius: 'var(--r-md)', gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '4px' }}>AI Recommendation</div>
                    <div style={{ fontSize: '.9rem', color: 'var(--dash-text)', fontWeight: 500 }}>{ins.recommendation}</div>
                  </div>
                )}
              </div>

              {ins.actionLabel && (
                <button className="btn btn-primary btn-sm" id={`btn-insight-action-${i}`}>{ins.actionLabel}</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
