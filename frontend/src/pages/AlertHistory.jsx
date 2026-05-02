/**
 * pages/AlertHistory.jsx
 * -----------------------
 * Paginated table + cards of all agent run alerts.
 */

import { useState, useEffect } from 'react'
import { RefreshCw, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { alertsApi } from '../services/api'
import AlertCard from '../components/AlertCard'

export default function AlertHistory() {
  const [alerts,  setAlerts]  = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('ALL')     // ALL | HIGH | MEDIUM | LOW
  const [expanded, setExpanded] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [aRes, sRes] = await Promise.all([
        alertsApi.list({ limit: 100 }),
        alertsApi.stats(),
      ])
      setAlerts(aRes.data)
      setStats(sRes.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'ALL' ? alerts : alerts.filter(a => a.risk_level === filter)

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔔 Alert History</h1>
          <p className="page-subtitle">All agent runs and risk assessments</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Runs',      value: stats.total_runs,    color: 'var(--indigo-light)' },
            { label: 'High Risk',       value: stats.high_alerts,   color: 'var(--risk-high)' },
            { label: 'Medium Risk',     value: stats.medium_alerts, color: 'var(--risk-medium)' },
            { label: 'Avg Risk Score',  value: `${Math.round((stats.avg_risk_score || 0) * 100)}%`, color: 'var(--cyan)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color, fontSize: '1.6rem' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={14} style={{ color: 'var(--text-muted)' }} />
        {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f}
            {f !== 'ALL' && stats && (
              <span style={{ opacity: 0.7, marginLeft: 4, fontSize: '0.75rem' }}>
                ({stats[`${f.toLowerCase()}_alerts`] ?? 0})
              </span>
            )}
          </button>
        ))}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {filtered.length} run{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Alert list ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Loading alerts...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No alerts yet</h3>
          <p>Run the agent from the Dashboard to start generating history</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(alert => (
            <div key={alert.id}>
              <AlertCard
                alert={alert}
                onClick={() => setExpanded(expanded === alert.id ? null : alert.id)}
              />

              {/* Expandable reasoning log */}
              {expanded === alert.id && (
                <div className="card" style={{
                  marginTop: '0.25rem',
                  borderTop: 'none',
                  borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                  padding: 0,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '0.6rem 1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Agent Reasoning Log
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setExpanded(null)}
                    >
                      <ChevronUp size={13} /> Collapse
                    </button>
                  </div>

                  <div className="agent-feed" style={{ height: 280 }}>
                    {(alert.reasoning_steps || []).map((step, i) => (
                      <div key={i} className="feed-line">
                        <span className="feed-text">{step}</span>
                      </div>
                    ))}
                    {(!alert.reasoning_steps || alert.reasoning_steps.length === 0) && (
                      <div className="feed-empty">No reasoning log stored for this run</div>
                    )}
                  </div>
                </div>
              )}

              {/* Expand button if not expanded */}
              {expanded !== alert.id && (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', borderRadius: '0 0 var(--radius-sm) var(--radius-sm)', marginTop: 1 }}
                  onClick={() => setExpanded(alert.id)}
                >
                  <ChevronDown size={13} /> View Reasoning Log
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
