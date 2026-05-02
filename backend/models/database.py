"""
models/database.py
-------------------
SQLAlchemy synchronous engine setup.
Uses SQLite by default (zero config) — switch to PostgreSQL by setting DATABASE_URL.

Development:  DATABASE_URL=sqlite:///./portfolio.db   (default)
Production:   DATABASE_URL=postgresql://user:pass@host/db
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./portfolio.db")

# SQLite needs check_same_thread=False for multi-threaded FastAPI
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency: yields a DB session and closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables (called on app startup)."""
    from models import portfolio, alert  # noqa: F401 — registers models
    Base.metadata.create_all(bind=engine)
