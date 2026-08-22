import { useEffect, useState } from 'react'
import { getInventory } from '../../api/analytics.js'
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'

function RiskBadge({ level }) {
  const cfg = {
    HIGH:   { cls: 'badge risk-badge-high',   icon: <AlertTriangle size={11} />, label: 'HIGH RISK' },
    MEDIUM: { cls: 'badge risk-badge-medium', icon: <AlertCircle   size={11} />, label: 'MEDIUM' },
    LOW:    { cls: 'badge risk-badge-low',    icon: <CheckCircle   size={11} />, label: 'LOW RISK' },
  }[level?.toUpperCase()] || { cls: 'badge badge-gray', icon: null, label: level || '—' }
  return <span className={cfg.cls}>{cfg.icon} {cfg.label}</span>
}

export default function Inventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getInventory().then(d => { setItems(Array.isArray(d) ? d : d?.items || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="page-enter">
      <div className="page-header"><h1>Inventory</h1></div>
      <div className="skeleton" style={{ height: 400 }} />
    </div>
  )

  const sorted = [...items].sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 }
    return (order[a.riskLevel?.toUpperCase()] ?? 3) - (order[b.riskLevel?.toUpperCase()] ?? 3)
  })

  const high = sorted.filter(i => i.riskLevel?.toUpperCase() === 'HIGH')

  return (
    <div className="page-enter">
      <div className="page-header"><h1>📦 Inventory</h1><p>Stock levels, risk indicators, and reorder recommendations.</p></div>

      {high.length > 0 && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 'var(--r-lg)', padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
          <AlertTriangle size={20} color="var(--danger)" />
          <div>
            <div style={{ fontWeight: 700, color: '#7f1d1d' }}>⚠️ {high.length} products at HIGH stock risk</div>
            <div style={{ fontSize: '.85rem', color: '#991b1b', marginTop: 2 }}>{high.map(h => h.productName || h.name).join(', ')} — consider ordering today.</div>
          </div>
        </div>
      )}

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr><th>Product</th><th>Est. Stock</th><th>Daily Demand</th><th>Days Remaining</th><th>Risk</th><th>Recommendation</th></tr>
          </thead>
          <tbody>
            {sorted.map((item, i) => {
              const daysRemaining = item.daysRemaining ?? (item.estimatedStock / (item.dailyDemand || 1))
              return (
                <tr key={item.productId || i}>
                  <td><strong>{item.productName || item.name}</strong><br /><span style={{ fontSize: '.75rem', color: 'var(--dash-text-3)' }}>{item.category}</span></td>
                  <td>{item.estimatedStock ?? item.stock ?? '—'} units</td>
                  <td>{item.dailyDemand ?? '—'} units/day</td>
                  <td>
                    <div style={{ fontWeight: 700, color: daysRemaining < 2 ? 'var(--danger)' : daysRemaining < 4 ? 'var(--warning)' : 'var(--success)' }}>
                      {typeof daysRemaining === 'number' ? daysRemaining.toFixed(1) : '—'} days
                    </div>
                    <div className="progress-bar" style={{ width: 80, marginTop: 4 }}>
                      <div className="progress-fill" style={{
                        width: `${Math.min(100, (daysRemaining / 7) * 100)}%`,
                        background: daysRemaining < 2 ? 'var(--danger)' : daysRemaining < 4 ? 'var(--warning)' : 'var(--success)',
                      }} />
                    </div>
                  </td>
                  <td><RiskBadge level={item.riskLevel} /></td>
                  <td style={{ fontSize: '.82rem', color: 'var(--dash-text-2)', maxWidth: 200 }}>{item.recommendation || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
