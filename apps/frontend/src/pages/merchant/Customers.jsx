import { useEffect, useState } from 'react'
import { getCustomers } from '../../api/analytics.js'

const SEGMENT_CONFIG = {
  NEW:        { label: 'New',        color: 'var(--info)',    bg: 'var(--info-bg)',    emoji: '🌟' },
  REGULAR:    { label: 'Regular',    color: 'var(--success)', bg: 'var(--success-bg)', emoji: '😊' },
  HIGH_VALUE: { label: 'High Value', color: '#d97706',        bg: '#fef3c7',           emoji: '💎' },
  AT_RISK:    { label: 'At Risk',    color: 'var(--warning)', bg: 'var(--warning-bg)', emoji: '⚠️' },
  INACTIVE:   { label: 'Inactive',   color: 'var(--danger)',  bg: 'var(--danger-bg)',  emoji: '😴' },
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSegment, setActiveSegment] = useState('ALL')

  useEffect(() => {
    getCustomers().then(d => { setCustomers(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const segmentCounts = customers.reduce((acc, c) => { acc[c.segment] = (acc[c.segment] || 0) + 1; return acc }, {})
  const filtered = activeSegment === 'ALL' ? customers : customers.filter(c => c.segment === activeSegment)

  if (loading) return (
    <div className="page-enter">
      <div className="page-header"><h1>Customers</h1></div>
      <div className="grid-4" style={{ marginBottom: 24 }}>{[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}</div>
    </div>
  )

  const inactive = customers.filter(c => c.segment === 'INACTIVE')

  return (
    <div className="page-enter">
      <div className="page-header"><h1>👥 Customers</h1><p>Customer segments, visit patterns, and re-engagement opportunities.</p></div>

      {inactive.length > 0 && (
        <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning)', borderRadius: 'var(--r-lg)', padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, color: '#78350f' }}>😴 {inactive.length} customers haven't visited recently</div>
            <div style={{ fontSize: '.85rem', color: '#92400e', marginTop: 2 }}>Create a weekend offer to bring them back</div>
          </div>
          <button className="btn btn-warning btn-sm" id="btn-reactivate" style={{ background: 'var(--warning)', color: '#fff', flexShrink: 0 }}>Prepare Offer</button>
        </div>
      )}

      {/* Segment cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div onClick={() => setActiveSegment('ALL')} className={`stat-card card-hover`} style={{ minWidth: 100, cursor: 'pointer', padding: '16px', flex: 1, border: activeSegment === 'ALL' ? '2px solid var(--primary)' : undefined }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{customers.length}</div>
          <div style={{ fontSize: '.75rem', color: 'var(--dash-text-2)', fontWeight: 600 }}>ALL</div>
        </div>
        {Object.entries(SEGMENT_CONFIG).map(([seg, cfg]) => (
          <div key={seg} onClick={() => setActiveSegment(seg)} className="stat-card card-hover" style={{ minWidth: 100, flex: 1, cursor: 'pointer', border: activeSegment === seg ? `2px solid ${cfg.color}` : undefined }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: cfg.color }}>{segmentCounts[seg] || 0}</div>
            <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--dash-text-2)' }}>{cfg.emoji} {cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead><tr><th>Customer</th><th>Segment</th><th>Total Spend</th><th>Visits</th><th>Last Visit</th><th>Favourite Products</th></tr></thead>
          <tbody>
            {filtered.map((c, i) => {
              const cfg = SEGMENT_CONFIG[c.segment] || {}
              return (
                <tr key={c.id || i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: cfg.bg || 'var(--dash-surface-2)', color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.8rem', flexShrink: 0 }}>
                        {c.name?.[0] || 'C'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.name || `Customer ${i + 1}`}</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--dash-text-3)' }}>{c.phone || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.emoji} {cfg.label}</span></td>
                  <td><strong>₹{(c.totalSpend || 0).toLocaleString('en-IN')}</strong></td>
                  <td>{c.visitCount || 0}</td>
                  <td style={{ fontSize: '.8rem', color: 'var(--dash-text-2)' }}>
                    {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                  </td>
                  <td style={{ fontSize: '.8rem', color: 'var(--dash-text-2)' }}>
                    {c.favoriteProducts?.slice(0, 2).join(', ') || '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
