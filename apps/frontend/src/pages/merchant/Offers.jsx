import { useEffect, useState } from 'react'
import { getOffers, prepareOffer } from '../../api/analytics.js'
import { Tag, Users, Zap } from 'lucide-react'

export default function Offers() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [preparing, setPreparing] = useState(null)

  useEffect(() => {
    getOffers().then(d => { setOffers(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const handlePrepare = async (offer, i) => {
    setPreparing(i)
    try { await prepareOffer(offer) } catch {}
    await new Promise(r => setTimeout(r, 800))
    setPreparing(null)
    // Refresh
    const updated = await getOffers().catch(() => offers)
    setOffers(Array.isArray(updated) ? updated : offers)
  }

  if (loading) return (
    <div className="page-enter">
      <div className="page-header"><h1>Offers</h1></div>
      <div className="flex flex-col gap-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 180 }} />)}</div>
    </div>
  )

  return (
    <div className="page-enter">
      <div className="page-header"><h1>🎯 Offers</h1><p>AI-recommended offers based on your customer data and sales patterns.</p></div>

      {offers.length === 0 && (
        <div className="section-card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎯</div>
          <h3 style={{ marginBottom: 8 }}>No offers yet</h3>
          <p>Complete more transactions so AI can generate targeted offer recommendations.</p>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {offers.map((offer, i) => {
          // Build display values from backend Offer schema
          const discountLabel = offer.discount ||
            (offer.discountType === 'FLAT'
              ? `₹${offer.discountValue} off above ₹${offer.minOrderValue}`
              : offer.discountType === 'PERCENT'
              ? `${offer.discountValue}% off`
              : null)
          const impactLabel = offer.estimatedImpact ||
            (offer.targetCount && offer.discountValue
              ? `~${offer.targetCount} customers targeted`
              : null)
          const reason = offer.reason || offer.suggestedReason
          const targetLabel = typeof offer.targetSegment === 'string'
            ? offer.targetSegment
            : offer.targetCount ? `${offer.targetCount} Customers` : null

          return (
          <div key={offer.id || i} className="section-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className="badge badge-purple"><Tag size={10} /> AI GENERATED</span>
                  {offer.status && <span className={`badge ${offer.status === 'ACTIVE' ? 'badge-green' : offer.status === 'READY' ? 'badge-blue' : 'badge-gray'}`}>{offer.status}</span>}
                </div>
                <h3 style={{ marginBottom: 6, color: 'var(--dash-text)' }}>{offer.title || offer.name}</h3>
                <div style={{ fontSize: '.9rem', color: 'var(--dash-text-2)', marginBottom: 12, lineHeight: 1.6 }}>{offer.description}</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12 }}>
                  {targetLabel && (
                    <div style={{ padding: '10px 14px', background: 'var(--dash-surface-2)', borderRadius: 'var(--r-md)' }}>
                      <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--dash-text-3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Target</div>
                      <div style={{ fontWeight: 600, marginTop: 2 }}><Users size={12} style={{ display: 'inline', marginRight: 4 }} />{targetLabel}</div>
                    </div>
                  )}
                  {discountLabel && (
                    <div style={{ padding: '10px 14px', background: 'var(--primary-light)', borderRadius: 'var(--r-md)' }}>
                      <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Discount</div>
                      <div style={{ fontWeight: 700, color: 'var(--primary)', marginTop: 2 }}>{discountLabel}</div>
                    </div>
                  )}
                  {impactLabel && (
                    <div style={{ padding: '10px 14px', background: 'var(--success-bg)', borderRadius: 'var(--r-md)' }}>
                      <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Est. Impact</div>
                      <div style={{ fontWeight: 600, color: 'var(--success)', marginTop: 2 }}>{impactLabel}</div>
                    </div>
                  )}
                </div>

                {reason && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(0,186,242,.06)', border: '1px solid rgba(0,186,242,.15)', borderRadius: 'var(--r-md)', fontSize: '.83rem', color: 'var(--dash-text-2)' }}>
                    <strong style={{ color: 'var(--primary)' }}>Why? </strong>{reason}
                  </div>
                )}
              </div>

              <button className="btn btn-primary btn-sm" onClick={() => handlePrepare(offer, i)} disabled={preparing === i} id={`btn-prepare-offer-${i}`} style={{ flexShrink: 0, marginTop: 4 }}>
                <Zap size={14} /> {preparing === i ? 'Preparing...' : 'Prepare Offer'}
              </button>
            </div>
          </div>
          )
        })}
      </div>
    </div>
  )
}
