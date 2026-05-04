import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ArrowLeft, Save, Eye, Code2, Bold,
  Italic, List, Link, Heading2, Quote,
  Image, CheckSquare
} from 'lucide-react'
import { articlesApi } from '../services/api'
import '../styles/articles.css'

const DEFAULT_CONTENT = `# Your Article Title

Write your introduction here. Explain what this article covers and why it matters.

## Section 1

Start with the fundamentals. Use **bold** for key terms and *italics* for emphasis.

### Code Example

\`\`\`python
def hello_world():
    print("Hello, World!")
\`\`\`

## Section 2

Add more sections as needed. Use bullet lists to organize ideas:

- Point one
- Point two
- Point three

> 💡 Use blockquotes for tips, warnings, or quotes.

## Conclusion

Wrap up your article with key takeaways.
`

export default function ArticleEditor() {
  const { id }   = useParams()           // present when editing
  const navigate = useNavigate()
  const isEdit   = Boolean(id)

  const [title,    setTitle]    = useState('')
  const [content,  setContent]  = useState(isEdit ? '' : DEFAULT_CONTENT)
  const [summary,  setSummary]  = useState('')
  const [tags,     setTags]     = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [author,   setAuthor]   = useState('Ishwar Ambare')
  const [publish,  setPublish]  = useState(false)
  const [preview,  setPreview]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState(null)
  const [articleId, setArticleId] = useState(null)

  const textareaRef = useRef(null)

  // Load existing article when editing
  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      try {
        // We need to get the article by ID → use list + find approach
        const res = await articlesApi.list({ all: true })
        const found = res.data.find(a => String(a.id) === String(id))
        if (!found) { showToast('Article not found', 'error'); return }
        // Fetch full content
        const full = await articlesApi.get(found.slug)
        const a = full.data
        setArticleId(a.id)
        setTitle(a.title)
        setContent(a.content)
        setSummary(a.summary || '')
        setTags((a.tags || []).join(', '))
        setCoverUrl(a.cover_url || '')
        setAuthor(a.author)
        setPublish(a.is_published)
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

  // ── Toolbar helpers ──────────────────────────────────────
  const insertAtCursor = (before, after = '', defaultText = '') => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end   = ta.selectionEnd
    const selected = ta.value.slice(start, end) || defaultText
    const newVal = ta.value.slice(0, start) + before + selected + after + ta.value.slice(end)
    setContent(newVal)
    // Restore cursor after React re-render
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 0)
  }

  const toolbarActions = [
    { icon: <Bold size={13} />,        label: 'Bold',       fn: () => insertAtCursor('**', '**', 'bold text') },
    { icon: <Italic size={13} />,      label: 'Italic',     fn: () => insertAtCursor('*', '*', 'italic text') },
    { icon: <Heading2 size={13} />,    label: 'Heading',    fn: () => insertAtCursor('\n## ', '', 'Heading') },
    { icon: <Quote size={13} />,       label: 'Blockquote', fn: () => insertAtCursor('\n> ', '', 'Quote') },
    { icon: <List size={13} />,        label: 'List',       fn: () => insertAtCursor('\n- ', '', 'List item') },
    { icon: <CheckSquare size={13} />, label: 'Task',       fn: () => insertAtCursor('\n- [ ] ', '', 'Task item') },
    { icon: <Code2 size={13} />,       label: 'Code',       fn: () => insertAtCursor('`', '`', 'code') },
    { icon: <Link size={13} />,        label: 'Link',       fn: () => insertAtCursor('[', '](url)', 'link text') },
    { icon: <Image size={13} />,       label: 'Image',      fn: () => insertAtCursor('![', '](url)', 'alt text') },
  ]

  // ── Save ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) { showToast('Title is required', 'error'); return }
    if (!content.trim()) { showToast('Content is required', 'error'); return }

    setSaving(true)
    const payload = {
      title:        title.trim(),
      content:      content.trim(),
      summary:      summary.trim() || null,
      tags:         tags.trim() || null,
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

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const readTime  = Math.max(1, Math.round(wordCount / 200))

  return (
    <div className="page-wrapper" style={{ paddingBottom: '2rem' }}>
      {/* ── Header ────────────────────────────────────── */}
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

        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={publish}
              onChange={e => setPublish(e.target.checked)}
              style={{ accentColor: 'var(--indigo)' }}
            />
            Publish immediately
          </label>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPreview(v => !v)}
          >
            <Eye size={13} /> {preview ? 'Edit Mode' : 'Preview'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={15} /> {saving ? 'Saving…' : (isEdit ? 'Update' : 'Save Article')}
          </button>
        </div>
      </div>

      {/* ── Meta Fields ───────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="editor-form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Title *</label>
            <input
              id="article-title"
              className="form-input"
              placeholder="Your compelling article title…"
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
              placeholder="e.g. AI, LangGraph, FastAPI"
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
            placeholder="Brief description shown on the articles list page…"
            value={summary}
            onChange={e => setSummary(e.target.value)}
            maxLength={500}
          />
          <span className="form-hint">{summary.length}/500 chars</span>
        </div>
      </div>

      {/* ── Editor / Preview Panes ────────────────────── */}
      <div className={`editor-layout ${preview ? 'preview-only' : ''}`}>
        {/* Left: Markdown editor */}
        <div className="editor-pane">
          <div className="editor-pane-header">
            <span><Code2 size={13} style={{ display: 'inline', marginRight: 4 }} />Markdown</span>
            <div className="editor-toolbar">
              {toolbarActions.map(({ icon, label, fn }) => (
                <button
                  key={label}
                  className="editor-toolbar-btn"
                  title={label}
                  onClick={fn}
                >
                  {icon}
                </button>
              ))}
              <span className="editor-char-count">{content.length} chars</span>
            </div>
          </div>
          <textarea
            id="article-content"
            ref={textareaRef}
            className="editor-textarea"
            placeholder="Start writing in Markdown…"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>

        {/* Right: Live Preview */}
        <div className="editor-pane">
          <div className="editor-pane-header">
            <span><Eye size={13} style={{ display: 'inline', marginRight: 4 }} />Live Preview</span>
          </div>
          <div className="preview-pane">
            {title && <h1 className="article-reader-title" style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>{title}</h1>}
            {summary && <p className="article-reader-summary">{summary}</p>}
            <div className="article-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || '*Start typing to see a preview…*'}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toast ─────────────────────────────────────── */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
