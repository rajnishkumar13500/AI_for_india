// API Configuration
// In development: Vite proxies /api → http://localhost:5000/api
// In production: set VITE_API_BASE env var to your backend URL
export const API_BASE = import.meta.env.VITE_API_BASE || '/api'
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
export const MERCHANT_ID = 'M001'

// Set to false to always use mock data (for demo without backend)
export const USE_REAL_API = true
