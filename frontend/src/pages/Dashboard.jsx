/**
 * pages/Dashboard.jsx
 * --------------------
 * Main dashboard: portfolio selector + risk gauge + agent feed + charts.
 */

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Plus, TrendingUp, Bell, Activity, Zap } from 'lucide-react'
import { portfolioApi, alertsApi } from '../services/api'
import AgentFeed from '../components/AgentFeed'
import RiskGauge from '../components/RiskGauge'
import { AllocationPie, RiskHistory } from '../components/PortfolioChart'
import AlertCard from '../components/AlertCard'

export default function Dashboard() {
  const [portfolios, setPortfolios]   = useState([])
  const [selected, setSelected]       = useState(null)
  const [stats, setStats]             = useState(null)
  const [recentAlerts, setRecentAlerts] = useState([])
  const [riskData, setRiskData]       = useState({ risk_score: 0, risk_level: 'LOW', metrics: {} })
  const [loading, setLoading]         = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, sRes, aRes] = await Promise.all([
        portfolioApi.list(),
        alertsApi.stats(),
        alertsApi.list({ limit: 5 }),
      ])
      setPortfolios(pRes.data)
      setStats(sRes.data)
      setRecentAlerts(aRes.data)
      if (pRes.data.length > 0 && !selected) {
        setSelected(pRes.data[0])
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleRiskUpdate = (data) => setRiskData(data)
  const handleDone = () => load()  // refresh history after run

  const currentPortfolio = selected || portfolios[0]

  return (
    <div className="page-wrapper">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📈 Portfolio Dashboard</h1>
          <p className="page-subtitle">Real-time AI-powered risk analysis with LangGraph agent</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={load}>
            <RefreshCw size={13} /> Refresh
          </button>
          <Link to="/portfolio" className="btn btn-primary btn-sm">
            <Plus size={13} /> New Portfolio
          </Link>
        </div>
      </div>

      {/* ── Stats Row ── */}
      {stats && (
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          <StatCard icon="🔄" label="Total Runs"    value={stats.total_runs}    color="var(--indigo-light)" />
          <StatCard icon="🚨" label="High Alerts"   value={stats.high_alerts}   color="var(--risk-high)" />
          <StatCard icon="⚠️" label="Medium Alerts" value={stats.medium_alerts} color="var(--risk-medium)" />
          <StatCard icon="📊" label="Avg Risk Score" value={`${Math.round((stats.avg_risk_score || 0) * 100)}%`} color="var(--cyan)" />
        </div>
      )}

      {loading && portfolios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Loading portfolios...</p>
        </div>
      ) : portfolios.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
          <h3>No portfolios yet</h3>
          <p style={{ margin: '0.5rem 0 1.5rem' }}>Create your first portfolio to start analysis</p>
          <Link to="/portfolio" className="btn btn-primary">
            <Plus size={15} /> Create Portfolio
          </Link>
        </div>
      ) : (
        <>
          {/* ── Portfolio selector ── */}
          <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Active Portfolio:
              </span>
              <select
                className="form-select"
                style={{ width: 'auto', flex: '1', minWidth: 200 }}
                value={currentPortfolio?.id || ''}
                onChange={e => {
                  const p = portfolios.find(p => p.id === Number(e.target.value))
                  setSelected(p)
                  setRiskData({ risk_score: 0, risk_level: 'LOW', metrics: {} })
                }}
              >
                {portfolios.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({Object.keys(p.tickers).join(', ')})</option>
                ))}
              </select>

              {currentPortfolio && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {Object.entries(currentPortfolio.tickers).map(([ticker, w]) => (
                    <span key={ticker} className="ticker-chip">
                      {ticker} <span style={{ opacity: 0.6 }}>{Math.round(w * 100)}%</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Main grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem', alignItems: 'start' }}>
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Agent feed */}
              <AgentFeed
                portfolioId={currentPortfolio?.id}
                onRiskUpdate={handleRiskUpdate}
                onDone={handleDone}
              />

              {/* Risk history chart */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">
                    <TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} />
                    Risk Score History
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 20 runs</span>
                </div>
                <RiskHistory alerts={recentAlerts} />
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Risk gauge */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
                <div className="card-title" style={{ marginBottom: '1rem', alignSelf: 'flex-start' }}>
                  <Activity size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Live Risk Score
                </div>
                <RiskGauge
                  riskScore={riskData.risk_score}
                  riskLevel={riskData.risk_level}
                  metrics={riskData.metrics}
                />
              </div>

              {/* Allocation pie */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: '0.75rem' }}>
                  Allocation
                </div>
                <AllocationPie tickers={currentPortfolio?.tickers || {}} />
              </div>
            </div>
          </div>

          {/* ── Recent alerts ── */}
          {recentAlerts.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Bell size={16} /> Recent Alerts
                </h3>
                <Link to="/alerts" style={{ fontSize: '0.82rem', color: 'var(--indigo-light)' }}>
                  View all →
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentAlerts.slice(0, 3).map(a => (
                  <AlertCard key={a.id} alert={a} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color, fontSize: '1.6rem' }}>
        {icon} {value}
      </div>
    </div>
  )
}
