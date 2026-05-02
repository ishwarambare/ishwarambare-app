/**
 * services/sse.js
 * ----------------
 * EventSource wrapper for the agent SSE stream.
 * Returns a controller object so the caller can stop the stream.
 *
 * Usage:
 *   const ctrl = connectAgentStream(portfolioId, {
 *     onStep:  ({ node, message }) => ...,
 *     onRisk:  ({ risk_score, risk_level, metrics }) => ...,
 *     onAlert: ({ triggered }) => ...,
 *     onDone:  ({ alert_id }) => ...,
 *     onError: (message) => ...,
 *   })
 *   // later:
 *   ctrl.stop()
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function connectAgentStream(portfolioId, handlers = {}) {
  const url = `${BASE}/api/agent/stream/${portfolioId}`
  const es  = new EventSource(url)

  es.onmessage = (event) => {
    let data
    try { data = JSON.parse(event.data) } catch { return }

    switch (data.type) {
      case 'start':
        handlers.onStart?.(data)
        break
      case 'step':
        handlers.onStep?.(data)
        break
      case 'risk':
        handlers.onRisk?.(data)
        break
      case 'alert':
        handlers.onAlert?.(data)
        break
      case 'done':
        handlers.onDone?.(data)
        es.close()
        break
      case 'error':
        handlers.onError?.(data.message)
        break
      default:
        break
    }
  }

  es.onerror = (err) => {
    handlers.onError?.('SSE connection error — agent may have finished or server restarted')
    es.close()
  }

  return {
    stop: () => es.close(),
  }
}
