import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Clipboard, ClipboardCheck } from 'lucide-react'
import { articlesApi } from '../services/api'
import '../styles/articles.css'

export default function ArticleEditor() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const isEdit    = Boolean(id)

  const [title,     setTitle]     = useState('')
  const [summary,   setSummary]   = useState('')
  const [tags,      setTags]      = useState('')
  const [coverUrl,  setCoverUrl]  = useState('')
  const [author,    setAuthor]    = useState('Ishwar Ambare')
  const [publish,   setPublish]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState(null)
  const [wordCount, setWordCount] = useState(0)
  const [articleId, setArticleId] = useState(null)

  const editorRef = useRef(null)

  // ── word count from live text ────────────────────────────
  const updateWordCount = () => {
    const text = editorRef.current?.innerText || ''
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length)
  }

  // ── image paste → insert as <img> inline ────────────────
  const handlePaste = useCallback((e) => {
    const items     = Array.from(e.clipboardData?.items || [])
    const imageItem = items.find(i => i.type.startsWith('image/'))
    if (!imageItem) return   // rich-text / plain text: let browser handle normally

    e.preventDefault()
    const file = imageItem.getAsFile()
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      document.execCommand('insertHTML', false,
        `<img src="${ev.target.result}" style="max-width:100%;border-radius:8px;margin:1rem 0;" alt="pasted image" />`
      )
      showToast('Image pasted 📸', 'info')
    }
    reader.readAsDataURL(file)
  }, [])

  // ── load article for edit ────────────────────────────────
  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      try {
        const res   = await articlesApi.list({ all: true })
        const found = res.data.find(a => String(a.id) === String(id))
        if (!found) { showToast('Article not found', 'error'); return }
        const full  = await articlesApi.get(found.slug)
        const a     = full.data
        setArticleId(a.id)
        setTitle(a.title)
        setSummary(a.summary || '')
        setTags((a.tags || []).join(', '))
        setCoverUrl(a.cover_url || '')
        setAuthor(a.author)
        setPublish(a.is_published)
        // set rich-text content
        if (editorRef.current) {
          editorRef.current.innerHTML = a.content
          updateWordCount()
        }
      } catch {
        showToast('Failed to load article', 'error')
      }
    }
    load()
  }, [id, isEdit])

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── save ─────────────────────────────────────────────────
  const handleSave = async () => {
    const rawHtml = editorRef.current?.innerHTML?.trim() || ''
    if (!title.trim()) { showToast('Title is required', 'error');   return }
    if (!rawHtml)      { showToast('Content is required', 'error'); return }

    setSaving(true)
    const payload = {
      title:        title.trim(),
      content:      rawHtml,
      summary:      summary.trim()  || null,
      tags:         tags.trim()     || null,
      cover_url:    coverUrl.trim() || null,
      author:       author.trim(),
      is_published: publish,
    }

    try {
      if (isEdit && articleId) {
        await articlesApi.update(articleId, payload)
        showToast('Article updated! ✅', 'success')
        setTimeout(() => navigate('/articles'), 1200)
      } else {
        const res = await articlesApi.create(payload)
        showToast('Article created! 🎉', 'success')
        setTimeout(() => navigate(`/articles/${res.data.slug}`), 1200)
      }
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const readTime = Math.max(1, Math.round(wordCount / 200))

  return (
    <div className="page-wrapper" style={{ paddingBottom: '3rem' }}>

      {/* ── Header ──────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <button className="article-reader-back" onClick={() => navigate('/articles')}>
            <ArrowLeft size={15} /> Back to Articles
          </button>
          <h1 className="page-title" style={{ marginTop: '0.5rem' }}>
            {isEdit ? '✏️ Edit Article' : '✍️ New Article'}
          </h1>
          <p className="page-subtitle">
            {wordCount} words · ~{readTime} min read
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)'
          }}>
            <input
              type="checkbox"
              checked={publish}
              onChange={e => setPublish(e.target.checked)}
              style={{ accentColor: 'var(--indigo)' }}
            />
            Publish immediately
          </label>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={15} /> {saving ? 'Saving…' : (isEdit ? 'Update' : 'Save Article')}
          </button>
        </div>
      </div>

      {/* ── Meta Fields ─────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="editor-form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Title *</label>
            <input
              id="article-title"
              className="form-input"
              placeholder="Your article title…"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Author</label>
            <input
              id="article-author"
              className="form-input"
              value={author}
              onChange={e => setAuthor(e.target.value)}
            />
          </div>
        </div>

        <div className="editor-form-row" style={{ marginTop: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tags (comma-separated)</label>
            <input
              id="article-tags"
              className="form-input"
              placeholder="e.g. AI, FastAPI, Python"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Cover Image URL</label>
            <input
              id="article-cover"
              className="form-input"
              placeholder="https://…"
              value={coverUrl}
              onChange={e => setCoverUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
          <label className="form-label">Summary / Excerpt</label>
          <input
            id="article-summary"
            className="form-input"
            placeholder="A short description shown on the articles list…"
            value={summary}
            onChange={e => setSummary(e.target.value)}
            maxLength={500}
          />
          <span className="form-hint">{summary.length}/500 chars</span>
        </div>
      </div>

      {/* ── Rich-text Editor ────────────────────────────── */}
      <div className="rich-editor-wrapper">
        <div className="rich-editor-header">
          <span>✍️ Content</span>
          <span className="rich-editor-hint">
            Paste your article directly — formatting, images and code blocks are preserved
          </span>
        </div>
        <div
          id="article-content"
          ref={editorRef}
          className="rich-editor-body"
          contentEditable
          suppressContentEditableWarning
          onInput={updateWordCount}
          onPaste={handlePaste}
          data-placeholder="Paste or type your article here…"
        />
      </div>

      {/* ── Toast ───────────────────────────────────────── */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
