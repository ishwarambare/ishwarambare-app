import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { format } from 'date-fns'
import {
  ArrowLeft, Clock, Calendar, User, Tag,
  Edit, Trash2, Eye, EyeOff
} from 'lucide-react'
import { articlesApi } from '../services/api'
import '../styles/articles.css'

export default function ArticleDetail() {
  const { slug }   = useParams()
  const navigate   = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast,   setToast]   = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await articlesApi.get(slug)
        setArticle(res.data)
      } catch {
        showToast('Article not found', 'error')
        setTimeout(() => navigate('/articles'), 2000)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handlePublishToggle = async () => {
    try {
      const res = await articlesApi.publish(article.id)
      setArticle(a => ({ ...a, is_published: res.data.is_published }))
      showToast(
        res.data.is_published ? 'Article published! 🎉' : 'Article moved to drafts.',
        'success'
      )
    } catch {
      showToast('Failed to toggle publish status', 'error')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this article permanently? This cannot be undone.')) return
    setDeleting(true)
    try {
      await articlesApi.remove(article.id)
      showToast('Article deleted.', 'success')
      setTimeout(() => navigate('/articles'), 1200)
    } catch {
      showToast('Failed to delete article', 'error')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', paddingTop: '6rem' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem', width: 32, height: 32 }} />
        <p>Loading article…</p>
      </div>
    )
  }

  if (!article) return null

  const date = article.created_at
    ? format(new Date(article.created_at), 'MMMM d, yyyy')
    : ''
  const initials = (article.author || 'IA')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="article-reader">
      {/* ── Back Button ───────────────────────────────── */}
      <button className="article-reader-back" onClick={() => navigate('/articles')}>
        <ArrowLeft size={15} /> Back to Articles
      </button>

      {/* ── Admin Actions ─────────────────────────────── */}
      <div className="article-reader-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate(`/articles/edit/${article.id}`)}
        >
          <Edit size={13} /> Edit
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={handlePublishToggle}
        >
          {article.is_published
            ? <><EyeOff size={13} /> Unpublish</>
            : <><Eye size={13} /> Publish</>}
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>

      {/* ── Tags ──────────────────────────────────────── */}
      {(article.tags || []).length > 0 && (
        <div className="article-reader-tags">
          {article.tags.map(tag => (
            <span key={tag} className="article-tag">
              <Tag size={9} style={{ display: 'inline', marginRight: 3 }} />{tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Title ─────────────────────────────────────── */}
      <h1 className="article-reader-title">{article.title}</h1>

      {/* ── Summary ───────────────────────────────────── */}
      {article.summary && (
        <p className="article-reader-summary">{article.summary}</p>
      )}

      {/* ── Meta ──────────────────────────────────────── */}
      <div className="article-reader-meta">
        <div className="article-reader-meta-author">
          <div className="author-avatar">{initials}</div>
          <span>{article.author}</span>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Calendar size={13} /> {date}
        </span>
        {article.read_time && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={13} /> {article.read_time} min read
          </span>
        )}
        {!article.is_published && (
          <span className="badge badge-medium">Draft</span>
        )}
      </div>

      {/* ── Cover Image ───────────────────────────────── */}
      {article.cover_url && (
        <img
          src={article.cover_url}
          alt={article.title}
          className="article-cover-img"
        />
      )}

      {/* ── Markdown Content ──────────────────────────── */}
      <div className="article-markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {article.content}
        </ReactMarkdown>
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
