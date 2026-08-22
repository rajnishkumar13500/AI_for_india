import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Brain, Package, Warehouse, Users, Tag, MessageSquare, Smartphone, ChevronRight, Menu, X } from 'lucide-react'
import './Merchant.css'

const NAV_ITEMS = [
  { to: 'overview',  label: 'Overview',    icon: LayoutDashboard },
  { to: 'insights',  label: 'AI Insights', icon: Brain },
  { to: 'products',  label: 'Products',    icon: Package },
  { to: 'inventory', label: 'Inventory',   icon: Warehouse },
  { to: 'customers', label: 'Customers',   icon: Users },
  { to: 'offers',    label: 'Offers',      icon: Tag },
  { to: 'askai',     label: 'Ask AI',      icon: MessageSquare },
]

export default function MerchantLayout() {
  const nav = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMobile = () => setMobileMenuOpen(false)

  return (
    <div className="merchant-root">
      {/* Mobile Top Header */}
      <header className="merchant-mobile-topbar">
        <button
          className="merchant-mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          id="btn-mobile-menu-toggle"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className="merchant-mobile-logo" onClick={() => nav('/dashboard/overview')}>
          <img src="/icon.png" alt="Paytm" style={{ height: 26, width: 'auto' }} />
          <span style={{ fontSize: '.7rem', color: 'var(--paytm-navy)', fontWeight: 800, marginLeft: 6 }}>FOR BUSINESS</span>
        </div>
        <button
          className="btn btn-primary btn-sm"
          style={{ padding: '6px 12px', fontSize: '.75rem', gap: '4px' }}
          onClick={() => nav('/device')}
          id="btn-mobile-open-soundbox"
        >
          <Smartphone size={14} /> Soundbox
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="merchant-drawer-overlay" onClick={closeMobile} />
      )}

      {/* Paytm Navy Sidebar (Desktop & Mobile Drawer) */}
      <aside className={`merchant-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Paytm Logo — genuine image in crisp white badge */}
        <div className="merchant-sidebar-logo">
          <div className="merchant-logo-badge-container">
            <img
              src="/icon.png"
              alt="Paytm"
              className="merchant-logo-img"
            />
          </div>
          <div className="merchant-logo-text-group">
            <div className="merchant-logo-sub">For Business</div>
          </div>
          {mobileMenuOpen && (
            <button className="device-icon-btn" style={{ marginLeft: 'auto' }} onClick={closeMobile}>
              <X size={18} />
            </button>
          )}
        </div>


        <nav className="merchant-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              id={`nav-${to}`}
              onClick={closeMobile}
              className={({ isActive }) => `merchant-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === 'Ask AI' && <span className="merchant-nav-badge">AI</span>}
            </NavLink>
          ))}
        </nav>

        <div className="merchant-sidebar-footer">
          <button className="merchant-device-link" onClick={() => { closeMobile(); nav('/device') }} id="btn-open-device">
            <Smartphone size={16} />
            <span>Open Soundbox</span>
            <ChevronRight size={14} />
          </button>
          <div className="merchant-merchant-info">
            <div className="merchant-avatar">R</div>
            <div>
              <div className="merchant-merchant-name">Rajesh Kumar</div>
              <div className="merchant-merchant-store">Kirana &amp; General Store</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="merchant-main">
        <div className="merchant-content page-enter">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Quick Navigation Bar */}
      <nav className="merchant-mobile-bottom-nav">
        <NavLink to="overview" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </NavLink>
        <NavLink to="insights" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <Brain size={18} />
          <span>Insights</span>
        </NavLink>
        <NavLink to="products" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <Package size={18} />
          <span>Products</span>
        </NavLink>
        <NavLink to="offers" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <Tag size={18} />
          <span>Offers</span>
        </NavLink>
        <NavLink to="askai" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <MessageSquare size={18} />
          <span>Ask AI</span>
        </NavLink>
      </nav>
    </div>
  )
}

