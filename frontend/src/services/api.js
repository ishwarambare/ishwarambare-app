import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Portfolio ─────────────────────────────────────────────────────────────────
export const portfolioApi = {
  list:   ()           => api.get('/api/portfolio'),
  get:    (id)         => api.get(`/api/portfolio/${id}`),
  create: (data)       => api.post('/api/portfolio', data),
  update: (id, data)   => api.put(`/api/portfolio/${id}`, data),
  remove: (id)         => api.delete(`/api/portfolio/${id}`),
}

// ── Agent ─────────────────────────────────────────────────────────────────────
export const agentApi = {
  run:    (id)  => api.post(`/api/agent/run/${id}`),
  status: ()    => api.get('/api/agent/status'),
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export const alertsApi = {
  list:     (params) => api.get('/api/alerts', { params }),
  detail:   (id)     => api.get(`/api/alerts/detail/${id}`),
  stats:    ()       => api.get('/api/alerts/stats'),
  forPortfolio: (id) => api.get(`/api/alerts/portfolio/${id}`),
}

// ── Articles ──────────────────────────────────────────────────────────────────
export const articlesApi = {
  list:    (params) => api.get('/api/articles', { params }),
  get:     (slug)   => api.get(`/api/articles/${slug}`),
  create:  (data)   => api.post('/api/articles', data),
  update:  (id, data) => api.put(`/api/articles/${id}`, data),
  remove:  (id)     => api.delete(`/api/articles/${id}`),
  publish: (id)     => api.post(`/api/articles/${id}/publish`),
}

export default api
