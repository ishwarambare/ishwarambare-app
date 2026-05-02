/**
 * pages/Portfolio.jsx
 * --------------------
 * Portfolio manager: create, edit, delete portfolios.
 * Inline ticker/weight editor with live validation.
 */

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Edit2, X, CheckCircle, AlertTriangle } from 'lucide-react'
import { portfolioApi } from '../services/api'
import { AllocationPie } from '../components/PortfolioChart'

const PRESET_PORTFOLIOS = [
  { name: 'Aggressive Tech', tickers: { AAPL: 0.30, MSFT: 0.25, NVDA: 0.25, TSLA: 0.20 } },
  { name: 'Balanced Growth', tickers: { AAPL: 0.20, MSFT: 0.20, SPY: 0.30, BND: 0.20, GLD: 0.10 } },
  { name: 'Conservative',    tickers: { SPY: 0.50, BND: 0.30, GLD: 0.20 } },
  { name: 'S&P 500 Only',   tickers: { SPY: 1.00 } },
]

function TickerEditor({ tickers, onChange }) {
  const [rows, setRows] = useState(
    Object.entries(tickers).map(([t, w]) => ({ ticker: t, weight: (w * 100).toFixed(0) }))
  )
  const [newTicker, setNewTicker] = useState('')
  const [newWeight, setNewWeight] = useState('')

  const totalWeight = rows.reduce((s, r) => s + (parseFloat(r.weight) || 0), 0)
  const isValid = Math.abs(totalWeight - 100) <= 1

  function updateParent(updated) {
    const dict = {}
    updated.forEach(r => {
      if (r.ticker) dict[r.ticker.toUpperCase()] = parseFloat(r.weight) / 100 || 0
    })
    onChange(dict)
  }

  function updateRow(i, field, val) {
    const updated = [...rows]
    updated[i] = { ...updated[i], [field]: val }
    setRows(updated)
    updateParent(updated)
  }

  function removeRow(i) {
    const updated = rows.filter((_, idx) => idx !== i)
    setRows(updated)
    updateParent(updated)
  }

  function addRow() {
    if (!newTicker.trim()) return
    const updated = [...rows, { ticker: newTicker.toUpperCase().trim(), weight: newWeight || '0' }]
    setRows(updated)
    updateParent(updated)
    setNewTicker('')
    setNewWeight('')
  }

  return (
    <div>
      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              className="form-input"
              style={{ width: 90, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}
              value={row.ticker}
              onChange={e => updateRow(i, 'ticker', e.target.value)}
              placeholder="AAPL"
              maxLength={6}
            />
            <input
              className="form-input"
              style={{ width: 80 }}
              type="number"
              min={0} max={100}
              value={row.weight}
              onChange={e => updateRow(i, 'weight', e.target.value)}
              placeholder="%"
            />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', width: 20 }}>%</span>
            <div
              style={{
                flex: 1,
                height: 4, borderRadius: 100,
                background: 'rgba(255,255,255,0.05)',
                overflow: 'hidden',
              }}
            >
              <div style={{
                height: '100%',
                width: `${Math.min(100, parseFloat(row.weight) || 0)}%`,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                borderRadius: 100,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <button
              type="button"
              className="btn btn-danger btn-icon btn-sm"
              onClick={() => removeRow(i)}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Add row */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          className="form-input"
          style={{ width: 90, fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase' }}
          value={newTicker}
          onChange={e => setNewTicker(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addRow()}
          placeholder="TICKER"
          maxLength={6}
        />
        <input
          className="form-input"
          style={{ width: 80 }}
          type="number" min={0} max={100}
          value={newWeight}
          onChange={e => setNewWeight(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addRow()}
          placeholder="%"
        />
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>%</span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={addRow}>
          <Plus size={13} /> Add
        </button>
      </div>

      {/* Weight validation */}
      <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {isValid ? (
          <><CheckCircle size={13} color="var(--risk-low)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--risk-low)' }}>Weights sum to {totalWeight.toFixed(0)}% ✓</span></>
        ) : (
          <><AlertTriangle size={13} color="var(--risk-medium)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--risk-medium)' }}>
              Weights sum to {totalWeight.toFixed(0)}% (need 100%)
            </span></>
        )}
      </div>
    </div>
  )
}

function PortfolioForm({ initial, onSave, onCancel }) {
  const [name,      setName]      = useState(initial?.name          || '')
  const [tickers,   setTickers]   = useState(initial?.tickers       || { AAPL: 0.4, MSFT: 0.3, SPY: 0.3 })
  const [email,     setEmail]     = useState(initial?.user_email    || '')
  const [phone,     setPhone]     = useState(initial?.user_phone    || '')
  const [threshold, setThreshold] = useState(initial?.risk_threshold ?? 0.70)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { name, tickers, user_email: email || null, user_phone: phone || null, risk_threshold: threshold }
      if (initial?.id) {
        await portfolioApi.update(initial.id, payload)
      } else {
        await portfolioApi.create(payload)
      }
      onSave()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save portfolio')
    }
    setSaving(false)
  }

  return (
    <form className="card" onSubmit={handleSubmit} style={{ border: '1px solid var(--border-accent)' }}>
      <h3 style={{ marginBottom: '1.25rem' }}>
        {initial?.id ? '✏️ Edit Portfolio' : '➕ New Portfolio'}
      </h3>

      {/* Presets */}
      {!initial?.id && (
        <div style={{ marginBottom: '1rem' }}>
          <div className="form-label">Quick Presets</div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {PRESET_PORTFOLIOS.map(p => (
              <button
                key={p.name} type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => { setName(p.name); setTickers(p.tickers) }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Portfolio Name</label>
        <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Aggressive Tech" required />
      </div>

      <div className="form-group">
        <label className="form-label">Tickers & Weights</label>
        <TickerEditor tickers={tickers} onChange={setTickers} />
      </div>

      <hr className="divider" />

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Alert Email (optional)</label>
          <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          <p className="form-hint">SendGrid will send HTML alerts to this address</p>
        </div>
        <div className="form-group">
          <label className="form-label">Alert Phone (optional)</label>
          <input className="form-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+919876543210" />
          <p className="form-hint">Twilio SMS for HIGH risk alerts</p>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Risk Threshold: {Math.round(threshold * 100)}%</label>
        <input
          type="range" min={0.3} max={0.9} step={0.05}
          value={threshold}
          onChange={e => setThreshold(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--indigo)' }}
        />
        <p className="form-hint">Alert triggers when risk score exceeds this threshold</p>
      </div>

      {error && <div className="form-error" style={{ marginBottom: '0.75rem' }}>⚠️ {error}</div>}

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        {onCancel && <button type="button" className="btn btn-secondary" onClick={onCancel}><X size={14} /> Cancel</button>}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : <><Save size={14} /> Save Portfolio</>}
        </button>
      </div>
    </form>
  )
}

export default function Portfolio() {
  const [portfolios, setPortfolios] = useState([])
  const [editing,    setEditing]    = useState(null)   // null | 'new' | portfolio object
  const [loading,    setLoading]    = useState(true)
  const [toast,      setToast]      = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await portfolioApi.list()
      setPortfolios(res.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this portfolio? This also removes its alert history.')) return
    try {
      await portfolioApi.remove(id)
      showToast('Portfolio deleted')
      load()
    } catch { showToast('Failed to delete', 'error') }
  }

  const handleSave = () => {
    setEditing(null)
    showToast('Portfolio saved!')
    load()
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">💼 Portfolio Manager</h1>
          <p className="page-subtitle">Configure your investment portfolios and alert settings</p>
        </div>
        {!editing && (
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            <Plus size={15} /> New Portfolio
          </button>
        )}
      </div>

      {/* Create / Edit form */}
      {editing && (
        <div style={{ marginBottom: '1.5rem' }}>
          <PortfolioForm
            initial={editing === 'new' ? null : editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {/* Portfolio list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      ) : portfolios.length === 0 && !editing ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
          <h3>No portfolios yet</h3>
          <p style={{ margin: '0.5rem 0 1.5rem' }}>Click "New Portfolio" to get started</p>
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            <Plus size={15} /> Create Portfolio
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {portfolios.map(p => (
            <div key={p.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontSize: '1.05rem' }}>{p.name}</h3>
                    <span className="badge badge-info">ID #{p.id}</span>
                    {!p.is_active && <span className="badge badge-medium">Inactive</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                    {Object.entries(p.tickers).map(([ticker, w]) => (
                      <span key={ticker} className="ticker-chip">
                        {ticker} <span style={{ opacity: 0.6 }}>{Math.round(w * 100)}%</span>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Alert threshold: {Math.round(p.risk_threshold * 100)}%</span>
                    {p.user_email && <span>📧 {p.user_email}</span>}
                    {p.user_phone && <span>📱 {p.user_phone}</span>}
                    <span>Created: {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</span>
                  </div>
                </div>

                <div style={{ flexShrink: 0, width: 140 }}>
                  <AllocationPie tickers={p.tickers} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditing(editing?.id === p.id ? null : p)}
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(p.id)}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}
    </div>
  )
}
