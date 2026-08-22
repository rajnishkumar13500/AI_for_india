import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, ShoppingBag, Users, IndianRupee, Activity, RefreshCw } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { getOverview, getTransactions } from '../../api/analytics.js'
import { useSocket } from '../../hooks/useSocket.js'
import './Merchant.css'

function StatCard({ label, value, trend, trendVal, icon: Icon, iconBg }) {
  const isUp = trend === 'up'
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className="stat-card-icon" style={{ background: iconBg }}>
          <Icon size={18} color="#fff" />
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className={`stat-card-trend ${trend}`}>
        {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {trendVal}
      </div>
    </div>
  )
}

function InsightCard({ type, title, body, actionLabel, typeColor, icon }) {
  return (
    <div className="insight-card">
      <div className="insight-card-type" style={{ color: typeColor }}>{icon} {type}</div>
      <div className="insight-card-title">{title}</div>
      <div className="insight-card-body">{body}</div>
      {actionLabel && (
        <div className="insight-card-action">
          <button className="btn btn-primary btn-sm" id={`btn-insight-${type.toLowerCase().replace(/\s/g,'-')}`}>{actionLabel}</button>
        </div>
      )}
    </div>
  )
}

export default function Overview() {
  const [data, setData] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [ov, txns] = await Promise.all([getOverview(), getTransactions()])
      setData(ov)
      setTransactions(Array.isArray(txns) ? txns.slice(0, 8) : [])
    } catch (e) {
      console.error('Overview load failed', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Socket: refresh on new transaction
  useSocket({
    'transaction:created': () => { load(); setLastUpdate(new Date()) },
    'session:reconciled':  () => { load(); setLastUpdate(new Date()) },
  })

  const greet = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) return (
    <div>
      <div className="page-header"><h1>Overview</h1></div>
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}
      </div>
    </div>
  )

  const stats = data?.stats || {}
  const revenueChart = data?.revenueChart || []
  const insights = data?.insights || []

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>{greet()}, Rajesh 👋</h1>
          <p>Here's what happened today{lastUpdate && ` · Updated ${lastUpdate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} id="btn-refresh-overview">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Today's Revenue" value={`₹${(stats.todayRevenue || 18420).toLocaleString('en-IN')}`} trend="up" trendVal="↑ 12% vs yesterday" icon={IndianRupee} iconBg="linear-gradient(135deg,#10b981,#059669)" />
        <StatCard label="Transactions" value={stats.transactionCount || 137} trend="up" trendVal="↑ 8% vs yesterday" icon={Activity} iconBg="linear-gradient(135deg,#00BAF2,#0097c7)" />
        <StatCard label="Avg Transaction" value={`₹${stats.avgTransactionValue || 134}`} trend="up" trendVal="↑ 4% this week" icon={ShoppingBag} iconBg="linear-gradient(135deg,#6366f1,#4f46e5)" />
        <StatCard label="Returning Customers" value={stats.returningCustomers || 23} trend="down" trendVal="↓ 26% this week" icon={Users} iconBg="linear-gradient(135deg,#f59e0b,#d97706)" />
      </div>

      {/* Revenue Chart */}
      {revenueChart.length > 0 && (
        <div className="section-card">
          <div className="section-card-header">
            <div className="section-card-title">Revenue — Last 14 Days</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueChart} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00BAF2" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00BAF2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--dash-text-2)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--dash-text-2)' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} contentStyle={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', borderRadius: 8, fontSize: 13 }} />
              <Area type="monotone" dataKey="revenue" stroke="#00BAF2" strokeWidth={2.5} fill="url(#rev-grad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, color: 'var(--dash-text)' }}>🧠 AI detected {insights.length} important things</h3>
          <div className="grid-3">
            {insights.map((ins, i) => (
              <InsightCard key={i}
                type={ins.type || 'Insight'}
                title={ins.title}
                body={ins.description || ins.body}
                actionLabel={ins.actionLabel}
                typeColor={ins.type === 'OPPORTUNITY' ? 'var(--success)' : ins.type === 'RISK' ? 'var(--danger)' : 'var(--warning)'}
                icon={ins.type === 'OPPORTUNITY' ? '🔥' : ins.type === 'RISK' ? '⚠️' : '📉'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <div className="data-table-wrapper">
          <div style={{ padding: '20px 24px 12px', fontWeight: 700, fontSize: '1rem', color: 'var(--dash-text)', borderBottom: '1px solid var(--dash-border)' }}>
            Recent Transactions
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Products</th>
                <th>Amount</th>
                <th>Confidence</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={t.id || i}>
                  <td><span className="font-mono text-sm" style={{ color: 'var(--dash-text-2)' }}>{t.id?.slice(-8) || `TXN-${1000 + i}`}</span></td>
                  <td>{t.items?.map(p => `${p.name}×${p.quantity}`).join(', ') || '—'}</td>
                  <td><strong>₹{t.amount?.toLocaleString('en-IN') || '—'}</strong></td>
                  <td>
                    <span className={`badge ${(t.confidence || 0.97) > 0.9 ? 'badge-green' : (t.confidence || 0.97) > 0.7 ? 'badge-yellow' : 'badge-red'}`}>
                      {Math.round((t.confidence || 0.97) * 100)}%
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${t.status === 'MATCHED' || t.reconciliationStatus === 'MATCHED' ? 'badge-green' : 'badge-yellow'}`}>
                      {t.status || t.reconciliationStatus || 'MATCHED'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--dash-text-2)', fontSize: '.8rem' }}>
                    {t.createdAt ? new Date(t.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
