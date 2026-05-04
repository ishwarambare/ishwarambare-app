import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, PenSquare, Clock, Tag, Search, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'
import { articlesApi } from '../services/api'
import '../styles/articles.css'

const EMOJI_MAP = ['📡', '🧠', '⚡', '🔭', '🚀', '💡', '🔬', '📊', '🤖', '🌐']

export default function Articles() {
  const navigate  = useNavigate()
  const [articles, setArticles]   = useState([])
  const [loading,  setLoading]    = useState(true)
  const [showAll,  setShowAll]    = useState(false)   // include drafts
  const [search,   setSearch]     = useState('')
  const [activeTag, setActiveTag] = useState('All')
  const [toast,    setToast]      = useState(null)

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const res = await articlesApi.list(showAll ? { all: true } : {})
      setArticles(res.data)
    } catch {
      showToast('Failed to load articles', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchArticles() }, [showAll])

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set(['All'])
    articles.forEach(a => (a.tags || []).forEach(t => set.add(t)))
    return [...set]
  }, [articles])

  // Filter articles by tag + search
  const filtered = useMemo(() => {
    return articles.filter(a => {
      const matchTag = activeTag === 'All' || (a.tags || []).includes(activeTag)
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        (a.summary || '').toLowerCase().includes(q) ||
        (a.tags || []).some(t => t.toLowerCase().includes(q))
      return matchTag && matchSearch
    })
  }, [articles, activeTag, search])

  return (
    <div className="page-wrapper">
      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="articles-hero">
        <div className="articles-hero-badge">
          <BookOpen size={13} /> Technical Articles
        </div>
        <h1>Ideas Worth Sharing</h1>
        <p>
          Deep dives into AI, finance, engineering and more.
          Written in Markdown, rendered beautifully.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => navigate('/articles/new')}>
            <PenSquare size={15} /> Write Article
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowAll(v => !v)}
          >
            {showAll ? <EyeOff size={15} /> : <Eye size={15} />}
            {showAll ? 'Hide Drafts' : 'Show All'}
          </button>
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────────────── */}
      <div className="articles-filter-bar">
        {allTags.map(tag => (
          <button
            key={tag}
            className={`filter-tag ${activeTag === tag ? 'active' : ''}`}
            onClick={() => setActiveTag(tag)}
          >
            {tag !== 'All' && <Tag size={10} style={{ display: 'inline', marginRight: 3 }} />}
            {tag}
          </button>
        ))}

        <div className="articles-search">
          <Search size={14} className="articles-search-icon" />
          <input
            className="articles-search-input"
            placeholder="Search articles…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────── */}
      {loading ? (
        <div className="empty-state">
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Loading articles…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No articles found</h3>
          <p>Try a different filter or write your first article.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/articles/new')}>
            <PenSquare size={15} /> Write Article
          </button>
        </div>
      ) : (
        <div className="articles-grid">
          {filtered.map((article, idx) => (
            <ArticleCard
              key={article.id}
              article={article}
              emoji={EMOJI_MAP[idx % EMOJI_MAP.length]}
              onClick={() => navigate(`/articles/${article.slug}`)}
            />
          ))}
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────── */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function ArticleCard({ article, emoji, onClick }) {
  const date = article.created_at
    ? format(new Date(article.created_at), 'MMM d, yyyy')
    : ''

  return (
    <div className="article-card" onClick={onClick} role="button" tabIndex={0}>
      {!article.is_published && (
        <span className="article-draft-badge">Draft</span>
      )}

      {article.cover_url ? (
        <img src={article.cover_url} alt={article.title} className="article-card-cover" />
      ) : (
        <div className="article-card-cover-placeholder">{emoji}</div>
      )}

      <div className="article-card-body">
        {(article.tags || []).length > 0 && (
          <div className="article-card-tags">
            {article.tags.slice(0, 3).map(tag => (
              <span key={tag} className="article-tag">{tag}</span>
            ))}
          </div>
        )}

        <h2 className="article-card-title">{article.title}</h2>

        {article.summary && (
          <p className="article-card-summary">{article.summary}</p>
        )}

        <div className="article-card-meta">
          <span className="article-card-author">
            <BookOpen size={12} /> {article.author}
          </span>
          <span className="article-card-dot" />
          <span>{date}</span>
          {article.read_time && (
            <>
              <span className="article-card-dot" />
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={11} /> {article.read_time} min
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
