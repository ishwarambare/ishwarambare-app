/**
 * components/AgentFeed.jsx
 * -------------------------
 * Real-time streaming log of the agent's reasoning steps.
 * Connects to the SSE endpoint and renders each step as it arrives.
 */

import { useEffect, useRef, useState } from 'react'
import { connectAgentStream } from '../services/sse'
import { Play, Square, RefreshCw } from 'lucide-react'

const NODE_COLORS = {
  fetch_news:  'fetch_news',
  get_prices:  'get_prices',
  calc_risk:   'calc_risk',
  send_alert:  'send_alert',
  log_and_end: 'log_and_end',
}

function classifyLine(message) {
  if (message.includes('ALERT') || message.includes('🚨')) return 'alert'
  if (message.includes('✅') || message.includes('good')) return 'good'
  if (message.includes('⚠️') || message.includes('warn')) return 'warn'
  if (message.includes('❌') || message.includes('error')) return 'error'
  return ''
}

export default function AgentFeed({ portfolioId, onRiskUpdate, onDone }) {
  const [lines, setLines]       = useState([])
  const [running, setRunning]   = useState(false)
  const [status, setStatus]     = useState('idle')    // idle | running | done | error
  const [stepCount, setStepCount] = useState(0)
  const bottomRef               = useRef(null)
  const ctrlRef                 = useRef(null)

  // Auto-scroll to bottom on new lines
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  function startStream() {
    if (!portfolioId) return
    setLines([])
    setStepCount(0)
    setRunning(true)
    setStatus('running')

    ctrlRef.current = connectAgentStream(portfolioId, {
      onStart: ({ name }) => {
        appendLine('log_and_end', `🚀 Starting analysis for portfolio: "${name}"`)
      },
      onStep: ({ node, message }) => {
        appendLine(node, message)
        setStepCount(c => c + 1)
      },
      onRisk: (data) => {
        onRiskUpdate?.(data)
      },
      onAlert: ({ triggered }) => {
        appendLine('send_alert', triggered
          ? '🚨 HIGH RISK DETECTED — Alert triggered!'
          : '✅ Risk within acceptable range — no alert needed'
        )
      },
      onDone: ({ alert_id }) => {
        appendLine('log_and_end', `✅ Agent run complete — Alert saved (ID: ${alert_id ?? 'N/A'})`)
        setRunning(false)
        setStatus('done')
        onDone?.()
      },
      onError: (msg) => {
        appendLine('log_and_end', `❌ Error: ${msg}`)
        setRunning(false)
        setStatus('error')
      },
    })
  }

  function stopStream() {
    ctrlRef.current?.stop()
    setRunning(false)
    setStatus('idle')
    appendLine('log_and_end', '⏹ Stream stopped by user')
  }

  function appendLine(node, message) {
    setLines(prev => [...prev, { node, message, id: Date.now() + Math.random() }])
  }

  function reset() {
    ctrlRef.current?.stop()
    setLines([])
    setRunning(false)
    setStatus('idle')
    setStepCount(0)
  }

  const statusColor = { idle: '#475569', running: '#6366f1', done: '#10b981', error: '#ef4444' }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {running && <span className="pulse-dot" />}
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Agent Reasoning Feed</span>
          {stepCount > 0 && (
            <span className="badge badge-info">{stepCount} steps</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={reset} title="Clear">
            <RefreshCw size={13} />
          </button>
          {!running ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={startStream}
              disabled={!portfolioId}
            >
              <Play size={13} /> Run Agent
            </button>
          ) : (
            <button className="btn btn-danger btn-sm" onClick={stopStream}>
              <Square size={13} /> Stop
            </button>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="agent-feed">
        {lines.length === 0 ? (
          <div className="feed-empty">
            {portfolioId
              ? 'Click "Run Agent" to start live analysis...'
              : 'Select a portfolio first'}
          </div>
        ) : (
          lines.map(({ id, node, message }) => (
            <div key={id} className="feed-line">
              {node && (
                <span className={`feed-node-tag ${NODE_COLORS[node] || ''}`}>
                  {node.replace('_', ' ')}
                </span>
              )}
              <span className={`feed-text ${classifyLine(message)}`}>
                {message}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Status bar */}
      <div className="feed-status-bar">
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: statusColor[status],
            display: 'inline-block',
          }} />
          {status === 'running' ? 'Streaming...' : status === 'done' ? 'Complete' : status === 'error' ? 'Error' : 'Idle'}
        </span>
        <span>{lines.length} log lines</span>
      </div>
    </div>
  )
}
