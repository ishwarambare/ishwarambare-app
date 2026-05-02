import { useEffect, useState } from 'react'
import { getItems, createItem, deleteItem } from '../services/api'
import '../styles/Items.css'

export default function Items() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [form,    setForm]    = useState({ name: '', description: '', price: '', in_stock: true })
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState(null)

  const fetchItems = async () => {
    try {
      setLoading(true)
      const { data } = await getItems()
      setItems(data)
    } catch {
      setError('Failed to load items. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name || !form.price) return
    setSaving(true); setMsg(null)
    try {
      await createItem({ ...form, price: parseFloat(form.price) })
      setMsg({ type: 'success', text: 'Item created successfully!' })
      setForm({ name: '', description: '', price: '', in_stock: true })
      fetchItems()
    } catch {
      setMsg({ type: 'error', text: 'Failed to create item.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return
    try {
      await deleteItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch {
      setMsg({ type: 'error', text: 'Failed to delete item.' })
    }
  }

  return (
    <main className="items-page">
      <div className="container">
        <h1>Items <span className="items-count">{items.length}</span></h1>
        <p className="page-sub">Live data fetched from the FastAPI backend.</p>

        {/* Add Item Form */}
        <div className="card add-form">
          <h2>Add New Item</h2>
          {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input id="name" name="name" className="form-control"
                  value={form.name} onChange={handleChange} placeholder="Item name" required />
              </div>
              <div className="form-group">
                <label htmlFor="price">Price *</label>
                <input id="price" name="price" className="form-control" type="number" step="0.01" min="0"
                  value={form.price} onChange={handleChange} placeholder="0.00" required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <input id="description" name="description" className="form-control"
                value={form.description} onChange={handleChange} placeholder="Optional description" />
            </div>
            <div className="form-check">
              <input id="in_stock" name="in_stock" type="checkbox"
                checked={form.in_stock} onChange={handleChange} />
              <label htmlFor="in_stock">In Stock</label>
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : '+ Add Item'}
            </button>
          </form>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="spinner" />
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <div className="grid grid-2 items-grid">
            {items.map(item => (
              <div key={item.id} className="card item-card">
                <div className="item-card__header">
                  <h3>{item.name}</h3>
                  <span className={`badge ${item.in_stock ? 'badge-green' : 'badge-red'}`}>
                    {item.in_stock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                {item.description && <p className="item-card__desc">{item.description}</p>}
                <div className="item-card__footer">
                  <span className="item-card__price">${item.price.toFixed(2)}</span>
                  <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
