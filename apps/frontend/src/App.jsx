import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import DeviceLayout from './pages/device/DeviceLayout.jsx'
import MerchantLayout from './pages/merchant/MerchantLayout.jsx'
import Overview from './pages/merchant/Overview.jsx'
import AIInsights from './pages/merchant/AIInsights.jsx'
import Products from './pages/merchant/Products.jsx'
import Inventory from './pages/merchant/Inventory.jsx'
import Customers from './pages/merchant/Customers.jsx'
import Offers from './pages/merchant/Offers.jsx'
import AskAI from './pages/merchant/AskAI.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing / Interface Switcher */}
        <Route path="/" element={<Landing />} />

        {/* Device Interface */}
        <Route path="/device/*" element={<DeviceLayout />} />

        {/* Merchant Analytics */}
        <Route path="/dashboard" element={<MerchantLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview"   element={<Overview />} />
          <Route path="insights"   element={<AIInsights />} />
          <Route path="products"   element={<Products />} />
          <Route path="inventory"  element={<Inventory />} />
          <Route path="customers"  element={<Customers />} />
          <Route path="offers"     element={<Offers />} />
          <Route path="askai"      element={<AskAI />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
