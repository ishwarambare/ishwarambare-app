/**
 * components/PortfolioChart.jsx
 * ------------------------------
 * Area chart showing portfolio allocation as a pie + a sparkline of risk history.
 */

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const PALETTE = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(13,17,23,0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8,
      padding: '0.6rem 0.9rem',
      fontSize: '0.8rem',
    }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}
        </p>
      ))}
    </div>
  )
}

export function AllocationPie({ tickers = {} }) {
  const data = Object.entries(tickers).map(([name, value]) => ({
    name,
    value: Math.round(value * 100),
  }))

  if (data.length === 0) return (
    <div className="empty-state" style={{ padding: '2rem' }}>
      <p>No tickers configured</p>
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%" cy="50%"
          innerRadius={55} outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          label={({ name, value }) => `${name} ${value}%`}
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => `${v}%`} contentStyle={{
          background: 'rgba(13,17,23,0.95)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
        }} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function RiskHistory({ alerts = [] }) {
  // Build chart data from alert history (latest 20, oldest first)
  const data = [...alerts]
    .reverse()
    .slice(0, 20)
    .map((a, i) => ({
      name: `Run ${i + 1}`,
      risk: parseFloat((a.risk_score * 100).toFixed(1)),
      sharpe: parseFloat((a.sharpe_ratio || 0).toFixed(2)),
    }))

  if (data.length === 0) return (
    <div className="empty-state" style={{ padding: '2rem' }}>
      <div className="empty-state-icon">📉</div>
      <p>No run history yet — click Run Agent to start</p>
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="risk"
          stroke="#ef4444"
          strokeWidth={2}
          fill="url(#riskGrad)"
          name="Risk Score %"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
