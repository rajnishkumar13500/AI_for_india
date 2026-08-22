import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Brain, Package, Warehouse, Users, Tag, MessageSquare, Smartphone, ChevronRight } from 'lucide-react'
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
  return (
    <div className="merchant-root">
      {/* Paytm Navy Sidebar */}
      <aside className="merchant-sidebar">
        {/* Paytm Logo */}
        <div className="merchant-sidebar-logo">
          <div className="merchant-logo-icon">
            <span className="merchant-logo-p">p</span>
          </div>
          <div>
            <div className="merchant-logo-name">Paytm</div>
            <div className="merchant-logo-sub">For Business</div>
          </div>
        </div>

        <nav className="merchant-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              id={`nav-${to}`}
              className={({ isActive }) => `merchant-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === 'Ask AI' && <span className="merchant-nav-badge">AI</span>}
            </NavLink>
          ))}
        </nav>

        <div className="merchant-sidebar-footer">
          <button className="merchant-device-link" onClick={() => nav('/device')} id="btn-open-device">
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
    </div>
  )
}
