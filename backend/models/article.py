"""
models/article.py
------------------
Article ORM model — stores technical articles / blog posts.

Content is stored raw as Markdown text.
The frontend renders it using react-markdown.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from models.database import Base


class Article(Base):
    __tablename__ = "articles"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(300), nullable=False)
    slug        = Column(String(320), unique=True, nullable=False, index=True)
    summary     = Column(String(500), nullable=True)     # short description / excerpt
    content     = Column(Text, nullable=False, default="")  # raw Markdown
    tags        = Column(String(500), nullable=True)     # comma-separated tags
    cover_url   = Column(String(500), nullable=True)     # optional hero image URL
    author      = Column(String(120), nullable=False, default="Ishwar Ambare")
    is_published = Column(Boolean, nullable=False, default=False)
    read_time   = Column(Integer, nullable=True)         # minutes (auto-calculated)
    created_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                         onupdate=lambda: datetime.now(timezone.utc))

    # ── helpers ─────────────────────────────────────────────────────────────────

    @property
    def tag_list(self) -> list[str]:
        """Return tags as a list."""
        if not self.tags:
            return []
        return [t.strip() for t in self.tags.split(",") if t.strip()]

    def calc_read_time(self) -> int:
        """Estimate reading time: ~200 words per minute."""
        words = len(self.content.split())
        return max(1, round(words / 200))

    def to_dict(self, include_content: bool = True) -> dict:
        d = {
            "id":           self.id,
            "title":        self.title,
            "slug":         self.slug,
            "summary":      self.summary,
            "tags":         self.tag_list,
            "cover_url":    self.cover_url,
            "author":       self.author,
            "is_published": self.is_published,
            "read_time":    self.read_time,
            "created_at":   self.created_at.isoformat() if self.created_at else None,
            "updated_at":   self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_content:
            d["content"] = self.content
        return d
