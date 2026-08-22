import { useEffect, useState } from 'react'
import { getInventory, addProduct, restockProduct } from '../../api/analytics.js'
import { AlertTriangle, CheckCircle, AlertCircle, Plus, PackagePlus, X, RefreshCw } from 'lucide-react'

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
  const [showAddModal, setShowAddModal] = useState(false)
  const [restockingId, setRestockingId] = useState(null)
  const [form, setForm] = useState({
    name: '',
    category: 'Grocery & FMCG',
    sellingPrice: '',
    costPrice: '',
    stock: '25',
    reorderLevel: '10',
  })
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    getInventory()
      .then(d => { setItems(Array.isArray(d) ? d : d?.items || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    if (!form.name || !form.sellingPrice) return
    setSubmitting(true)
    try {
      await addProduct({
        name: form.name,
        category: form.category,
        sellingPrice: Number(form.sellingPrice),
        costPrice: Number(form.costPrice) || Math.round(Number(form.sellingPrice) * 0.75),
        stock: Number(form.stock) || 20,
        reorderLevel: Number(form.reorderLevel) || 10,
      })
      setShowAddModal(false)
      setForm({ name: '', category: 'Grocery & FMCG', sellingPrice: '', costPrice: '', stock: '25', reorderLevel: '10' })
      load()
    } catch (err) {
      console.error('Failed to add product', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickRestock = async (productId, qty = 20) => {
    setRestockingId(productId)
    try {
      await restockProduct(productId, qty)
      load()
    } catch (err) {
      console.error('Restock failed', err)
    } finally {
      setRestockingId(null)
    }
  }

  if (loading && items.length === 0) return (
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
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>📦 Inventory &amp; Stock Levels</h1>
          <p>Real-time Kirana stock, demand velocity, and 1-click supplier restocking.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)} id="btn-add-product">
            <Plus size={15} /> Add New Product
          </button>
        </div>
      </div>

      {high.length > 0 && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 'var(--r-lg)', padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
          <AlertTriangle size={20} color="var(--danger)" />
          <div>
            <div style={{ fontWeight: 700, color: '#7f1d1d' }}>⚠️ {high.length} products at HIGH stock risk</div>
            <div style={{ fontSize: '.85rem', color: '#991b1b', marginTop: 2 }}>{high.map(h => h.productName || h.name).join(', ')} — recommended reorder before peak hours.</div>
          </div>
        </div>
      )}

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Est. Stock</th>
              <th>Daily Demand</th>
              <th>Days Remaining</th>
              <th>Risk</th>
              <th>Quick Restock</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, i) => {
              const daysRemaining = item.daysRemaining ?? (item.estimatedStock / (item.dailyDemand || 1))
              const isRestocking = restockingId === item.productId
              return (
                <tr key={item.productId || i}>
                  <td>
                    <strong>{item.productName || item.name}</strong>
                    <br />
                    <span style={{ fontSize: '.75rem', color: 'var(--dash-text-3)' }}>{item.category}</span>
                  </td>
                  <td><strong>{item.estimatedStock ?? item.stock ?? '—'} units</strong></td>
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
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        className="btn btn-outline btn-xs"
                        disabled={isRestocking}
                        onClick={() => handleQuickRestock(item.productId, 20)}
                        title="Add +20 units to stock"
                        style={{ fontSize: '.75rem', padding: '3px 8px' }}
                      >
                        <PackagePlus size={12} /> +20
                      </button>
                      <button
                        className="btn btn-outline btn-xs"
                        disabled={isRestocking}
                        onClick={() => handleQuickRestock(item.productId, 50)}
                        title="Add +50 units to stock"
                        style={{ fontSize: '.75rem', padding: '3px 8px' }}
                      >
                        +50
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16
        }}>
          <div style={{
            background: 'var(--dash-surface)', border: '1px solid var(--dash-border)',
            borderRadius: 'var(--r-xl)', width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, color: 'var(--dash-text)' }}>➕ Add New Product</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--dash-text-2)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, marginBottom: 4, color: 'var(--dash-text-2)' }}>Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kurkure Solid Masti 50g"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--dash-border)', background: 'var(--dash-surface-2)', color: 'var(--dash-text)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, marginBottom: 4, color: 'var(--dash-text-2)' }}>Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="20"
                    value={form.sellingPrice}
                    onChange={e => setForm({ ...form, sellingPrice: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--dash-border)', background: 'var(--dash-surface-2)', color: 'var(--dash-text)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, marginBottom: 4, color: 'var(--dash-text-2)' }}>Cost Price (₹)</label>
                  <input
                    type="number"
                    placeholder="15"
                    value={form.costPrice}
                    onChange={e => setForm({ ...form, costPrice: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--dash-border)', background: 'var(--dash-surface-2)', color: 'var(--dash-text)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, marginBottom: 4, color: 'var(--dash-text-2)' }}>Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--dash-border)', background: 'var(--dash-surface-2)', color: 'var(--dash-text)' }}
                  >
                    <option value="Grocery & FMCG">Grocery & FMCG</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Instant Food">Instant Food</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Household">Household</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 700, marginBottom: 4, color: 'var(--dash-text-2)' }}>Initial Stock</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--dash-border)', background: 'var(--dash-surface-2)', color: 'var(--dash-text)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : '✓ Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
