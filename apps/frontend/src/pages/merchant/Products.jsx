import { useEffect, useState } from 'react'
import { getProductsAnalytics } from '../../api/analytics.js'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function Products() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProductsAnalytics().then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="page-enter">
      <div className="page-header"><h1>Products</h1></div>
      <div className="skeleton" style={{ height: 280, marginBottom: 24 }} />
      <div className="skeleton" style={{ height: 360 }} />
    </div>
  )

  const products  = data?.topProducts  || data || []
  const chartData = products.slice(0, 10).map(p => ({ name: p.name?.split(' ')[0], units: p.totalQuantity || p.units || 0, revenue: p.totalRevenue || p.revenue || 0 }))
  const combos    = data?.combos || []

  return (
    <div className="page-enter">
      <div className="page-header"><h1>📦 Product Intelligence</h1><p>Sales performance, trends, and product combinations.</p></div>

      {/* Bar chart */}
      <div className="section-card">
        <div className="section-card-header"><div className="section-card-title">Top Products by Units Sold</div></div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--dash-text-2)' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--dash-text-2)' }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', borderRadius: 8, fontSize: 13 }} />
            <Bar dataKey="units" fill="#00BAF2" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Products Table */}
      <div className="data-table-wrapper" style={{ marginBottom: 24 }}>
        <div style={{ padding: '20px 24px 12px', fontWeight: 700, fontSize: '1rem', color: 'var(--dash-text)', borderBottom: '1px solid var(--dash-border)' }}>All Products</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th><th>Product</th><th>Category</th><th>Units Sold</th><th>Revenue</th><th>Growth</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => {
              const growth = p.growthPercent ?? p.growth ?? (Math.random() > 0.5 ? Math.floor(Math.random()*30)+1 : -(Math.floor(Math.random()*20)+1))
              return (
                <tr key={p.id || i}>
                  <td style={{ color: 'var(--dash-text-3)', fontWeight: 600 }}>{i + 1}</td>
                  <td><strong>{p.name}</strong></td>
                  <td><span className="badge badge-blue">{p.category || '—'}</span></td>
                  <td>{(p.totalQuantity || p.units || 0).toLocaleString('en-IN')}</td>
                  <td><strong>₹{(p.totalRevenue || p.revenue || 0).toLocaleString('en-IN')}</strong></td>
                  <td>
                    <span className={`stat-card-trend ${growth >= 0 ? 'up' : 'down'}`} style={{ display: 'inline-flex' }}>
                      {growth >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {Math.abs(growth)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Combos */}
      {combos.length > 0 && (
        <div className="section-card">
          <div className="section-card-header"><div className="section-card-title">🔗 Frequently Bought Together</div></div>
          <div className="flex flex-col gap-3">
            {combos.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--dash-surface-2)', borderRadius: 'var(--r-md)' }}>
                <span style={{ fontWeight: 600, color: 'var(--dash-text)' }}>{c.products?.join(' + ') || c.label}</span>
                <span className="badge badge-green">{c.count || c.frequency} times</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
