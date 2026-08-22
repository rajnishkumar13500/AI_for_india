import { Routes, Route, Navigate } from 'react-router-dom'
import DeviceHome from './DeviceHome.jsx'
import './Device.css'

export default function DeviceLayout() {
  return (
    <div className="device-root">
      <div className="device-frame">
        {/* Status bar */}
        <div className="device-statusbar">
          <span className="device-statusbar-time">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="device-statusbar-right">
            <span className="device-status-dot" />
            <span style={{ fontSize: '.7rem', color: 'var(--primary)' }}>PAYTM</span>
          </div>
        </div>

        {/* Content routed */}
        <div className="device-screen">
          <Routes>
            <Route index element={<DeviceHome />} />
            <Route path="*" element={<Navigate to="/device" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
