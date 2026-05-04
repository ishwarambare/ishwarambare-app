"""
routers/articles.py
--------------------
CRUD endpoints for technical articles / blog posts.

Routes:
  GET    /api/articles              — list (published only by default; ?all=true for drafts)
  GET    /api/articles/{slug}       — single article by slug
  POST   /api/articles              — create new article
  PUT    /api/articles/{id}         — update article
  DELETE /api/articles/{id}         — delete article
  POST   /api/articles/{id}/publish — toggle published flag
"""

import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from models.database import get_db
from models.article import Article

router = APIRouter()


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class ArticleCreate(BaseModel):
    title:        str              = Field(..., min_length=1, max_length=300)
    content:      str              = Field(..., min_length=1)
    summary:      Optional[str]   = Field(None, max_length=500)
    tags:         Optional[str]   = None   # comma-separated
    cover_url:    Optional[str]   = None
    author:       str             = "Ishwar Ambare"
    is_published: bool            = False


class ArticleUpdate(BaseModel):
    title:        Optional[str]   = Field(None, min_length=1, max_length=300)
    content:      Optional[str]   = Field(None, min_length=1)
    summary:      Optional[str]   = None
    tags:         Optional[str]   = None
    cover_url:    Optional[str]   = None
    author:       Optional[str]   = None
    is_published: Optional[bool]  = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _slugify(text: str) -> str:
    """Convert a title to a URL-safe slug."""
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug[:300]


def _unique_slug(db: Session, base: str, exclude_id: int = None) -> str:
    """Ensure slug uniqueness by appending a counter if needed."""
    slug = base
    counter = 1
    while True:
        q = db.query(Article).filter(Article.slug == slug)
        if exclude_id:
            q = q.filter(Article.id != exclude_id)
        if not q.first():
            return slug
        slug = f"{base}-{counter}"
        counter += 1


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("")
def list_articles(
    all: bool = Query(False, description="Include unpublished drafts"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    db: Session = Depends(get_db),
):
    """Return articles. By default only published ones."""
    q = db.query(Article)
    if not all:
        q = q.filter(Article.is_published == True)  # noqa: E712
    if tag:
        q = q.filter(Article.tags.contains(tag))
    articles = q.order_by(Article.created_at.desc()).all()
    # Exclude heavy content field from list view
    return [a.to_dict(include_content=False) for a in articles]


@router.get("/{slug}")
def get_article(slug: str, db: Session = Depends(get_db)):
    """Return a single article by slug (includes full Markdown content)."""
    article = db.query(Article).filter(Article.slug == slug).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article.to_dict(include_content=True)


@router.post("", status_code=201)
def create_article(payload: ArticleCreate, db: Session = Depends(get_db)):
    """Create a new article. Auto-generates a unique slug from the title."""
    base_slug = _slugify(payload.title)
    slug = _unique_slug(db, base_slug)

    article = Article(
        title        = payload.title,
        slug         = slug,
        content      = payload.content,
        summary      = payload.summary,
        tags         = payload.tags,
        cover_url    = payload.cover_url,
        author       = payload.author,
        is_published = payload.is_published,
    )
    article.read_time = article.calc_read_time()
    db.add(article)
    db.commit()
    db.refresh(article)
    return article.to_dict()


@router.put("/{article_id}")
def update_article(
    article_id: int,
    payload: ArticleUpdate,
    db: Session = Depends(get_db),
):
    """Update an existing article."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    if payload.title is not None:
        article.title = payload.title
        # Regenerate slug when title changes
        base_slug = _slugify(payload.title)
        article.slug = _unique_slug(db, base_slug, exclude_id=article_id)
    if payload.content is not None:
        article.content = payload.content
        article.read_time = article.calc_read_time()
    if payload.summary is not None:
        article.summary = payload.summary
    if payload.tags is not None:
        article.tags = payload.tags
    if payload.cover_url is not None:
        article.cover_url = payload.cover_url
    if payload.author is not None:
        article.author = payload.author
    if payload.is_published is not None:
        article.is_published = payload.is_published

    article.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(article)
    return article.to_dict()


@router.delete("/{article_id}", status_code=204)
def delete_article(article_id: int, db: Session = Depends(get_db)):
    """Delete an article permanently."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    db.delete(article)
    db.commit()
    return None


@router.post("/{article_id}/publish")
def toggle_publish(article_id: int, db: Session = Depends(get_db)):
    """Toggle the published/draft status of an article."""
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    article.is_published = not article.is_published
    article.updated_at   = datetime.now(timezone.utc)
    db.commit()
    db.refresh(article)
    return {"id": article.id, "is_published": article.is_published}
