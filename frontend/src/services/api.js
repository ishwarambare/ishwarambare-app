import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Items ─────────────────────────────────────────────────────────────────────
export const getItems   = ()       => api.get('/api/items/')
export const getItem    = (id)     => api.get(`/api/items/${id}`)
export const createItem = (data)   => api.post('/api/items/', data)
export const deleteItem = (id)     => api.delete(`/api/items/${id}`)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login      = (creds)  => api.post('/api/auth/login', creds)
export const getMe      = ()       => api.get('/api/auth/me')

// ── Health ────────────────────────────────────────────────────────────────────
export const healthCheck = ()      => api.get('/health')

export default api
