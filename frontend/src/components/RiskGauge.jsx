/**
 * components/RiskGauge.jsx
 * -------------------------
 * Radial gauge showing the composite risk score.
 * Uses Recharts RadialBarChart.
 */

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'

function getRiskColor(score) {
  if (score >= 0.70) return '#ef4444'
  if (score >= 0.40) return '#f59e0b'
  return '#10b981'
}

function getRiskLabel(level) {
  return level || 'UNKNOWN'
}

export default function RiskGauge({ riskScore = 0, riskLevel = 'LOW', metrics = {} }) {
  const pct   = Math.round(riskScore * 100)
  const color = getRiskColor(riskScore)

  const data = [{ value: pct, fill: color }]

  return (
    <div className="gauge-wrapper">
      <div style={{ width: 200, height: 200, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="65%" outerRadius="90%"
            startAngle={230} endAngle={-50}
            data={data}
            barSize={14}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />

            {/* Track (background) */}
            <RadialBar
              background={{ fill: 'rgba(255,255,255,0.05)' }}
              dataKey="value"
              angleAxisId={0}
              cornerRadius={7}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="gauge-value" style={{ color }}>{pct}</span>
          <span className="gauge-label">/ 100</span>
        </div>
      </div>

      {/* Risk level badge */}
      <span className={`badge badge-${(riskLevel || 'low').toLowerCase()}`}>
        {getRiskLabel(riskLevel)} RISK
      </span>

      {/* Metrics grid */}
      {metrics && Object.keys(metrics).length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem', width: '100%', marginTop: '0.5rem',
        }}>
          {[
            ['Sharpe',   metrics.sharpe_ratio?.toFixed(3)],
            ['Sortino',  metrics.sortino_ratio?.toFixed(3)],
            ['Ann. Vol', metrics.annualised_volatility
              ? `${(metrics.annualised_volatility * 100).toFixed(1)}%`
              : '—'],
            ['Max DD',   metrics.max_drawdown
              ? `${(metrics.max_drawdown * 100).toFixed(1)}%`
              : '—'],
          ].map(([label, val]) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '0.4rem 0.6rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                {val ?? '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
