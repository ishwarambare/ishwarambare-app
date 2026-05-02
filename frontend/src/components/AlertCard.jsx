/**
 * components/AlertCard.jsx
 * -------------------------
 * Compact card for displaying a single alert from history.
 */

import { formatDistanceToNow } from 'date-fns'
import { Mail, MessageSquare, TrendingDown, AlertTriangle } from 'lucide-react'

export default function AlertCard({ alert, onClick }) {
  const level = (alert.risk_level || 'LOW').toLowerCase()
  const ts    = alert.created_at
    ? formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })
    : '—'

  return (
    <div
      className="card"
      onClick={() => onClick?.(alert)}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: `3px solid var(--risk-${level === 'high' ? 'high' : level === 'medium' ? 'medium' : 'low'})`,
        padding: '1rem 1.25rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`badge badge-${level}`}>
            {alert.risk_level}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Portfolio #{alert.portfolio_id}
          </span>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{ts}</span>
      </div>

      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <Metric label="Risk Score" value={`${Math.round((alert.risk_score || 0) * 100)}%`} color={`var(--risk-${level === 'high' ? 'high' : level === 'medium' ? 'medium' : 'low'})`} />
        <Metric label="Sharpe"    value={alert.sharpe_ratio?.toFixed(3) ?? '—'} />
        <Metric label="Sortino"   value={alert.sortino_ratio?.toFixed(3) ?? '—'} />
        <Metric label="Ann. Vol"  value={alert.ann_volatility ? `${(alert.ann_volatility * 100).toFixed(1)}%` : '—'} />
        <Metric label="Sentiment" value={alert.avg_sentiment != null ? alert.avg_sentiment.toFixed(3) : '—'} />
      </div>

      {/* Delivery badges */}
      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {alert.email_sent && (
          <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
            <Mail size={10} /> Email Sent
          </span>
        )}
        {alert.sms_sent && (
          <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
            <MessageSquare size={10} /> SMS Sent
          </span>
        )}
        {!alert.email_sent && !alert.sms_sent && alert.risk_level === 'HIGH' && (
          <span className="badge badge-medium" style={{ fontSize: '0.68rem' }}>
            <AlertTriangle size={10} /> No contact info set
          </span>
        )}
        {alert.risk_level !== 'HIGH' && (
          <span className="badge badge-low" style={{ fontSize: '0.68rem' }}>
            No alert needed
          </span>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{
        fontSize: '0.95rem', fontWeight: 700,
        color: color || 'var(--text-primary)',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        {value}
      </div>
    </div>
  )
}
