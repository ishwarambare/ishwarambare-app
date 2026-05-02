/**
 * pages/LiveAgent.jsx
 * --------------------
 * Dedicated full-screen live agent run page.
 * Shows full-width agent feed + real-time risk gauge side by side.
 */

import { useState, useEffect } from 'react'
import { portfolioApi } from '../services/api'
import AgentFeed from '../components/AgentFeed'
import RiskGauge from '../components/RiskGauge'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function LiveAgent() {
  const [portfolios, setPortfolios] = useState([])
  const [selected,   setSelected]   = useState(null)
  const [riskData,   setRiskData]   = useState({ risk_score: 0, risk_level: 'LOW', metrics: {} })

  useEffect(() => {
    portfolioApi.list().then(r => {
      setPortfolios(r.data)
      if (r.data.length > 0) setSelected(r.data[0].id)
    })
  }, [])

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/" className="btn btn-secondary btn-sm">
            <ArrowLeft size={13} /> Back
          </Link>
          <div>
            <h1 className="page-title">⚡ Live Agent Run</h1>
            <p className="page-subtitle">Watch the LangGraph agent reason in real time</p>
          </div>
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 200 }}
          value={selected || ''}
          onChange={e => { setSelected(Number(e.target.value)); setRiskData({ risk_score: 0, risk_level: 'LOW', metrics: {} }) }}
        >
          <option value="" disabled>Select portfolio</option>
          {portfolios.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', alignItems: 'start' }}>
        <AgentFeed
          portfolioId={selected}
          onRiskUpdate={setRiskData}
          onDone={() => {}}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Gauge */}
          <div className="card" style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
            <div className="card-title" style={{ marginBottom: '1rem', alignSelf: 'flex-start' }}>
              Risk Gauge
            </div>
            <RiskGauge
              riskScore={riskData.risk_score}
              riskLevel={riskData.risk_level}
              metrics={riskData.metrics}
            />
          </div>

          {/* Interview talking points */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '0.75rem' }}>🎯 Interview Points</div>
            {[
              ['Function Calling', 'LLM outputs JSON → Python function → result back to state'],
              ['State Management', 'AgentState TypedDict flows through every LangGraph node'],
              ['Streaming', 'FastAPI SSE → EventSource → live UI updates'],
              ['RAG Ready', 'Pinecone retrieval slot in graph.py (Week 3)'],
            ].map(([title, desc]) => (
              <div key={title} style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--indigo-light)', marginBottom: '0.15rem' }}>
                  {title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
