"""
models/portfolio.py
--------------------
Portfolio ORM model — stores user portfolio configurations.

A Portfolio is a named set of tickers with weights (stored as JSON).
One user can have multiple portfolios.
"""

import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean
from models.database import Base


class Portfolio(Base):
    __tablename__ = "portfolios"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(120), nullable=False, default="My Portfolio")
    user_id       = Column(String(80), nullable=False, default="admin", index=True)

    # Tickers + weights stored as JSON: {"AAPL": 0.4, "MSFT": 0.6}
    tickers_json  = Column(Text, nullable=False, default="{}")

    user_email    = Column(String(200), nullable=True)
    user_phone    = Column(String(30), nullable=True)    # E.164 format

    risk_threshold = Column(Float, nullable=False, default=0.70)  # alert if score > this

    is_active     = Column(Boolean, nullable=False, default=True)
    created_at    = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at    = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    # ── helpers ───────────────────────────────────────────────────────────────

    @property
    def tickers(self) -> dict[str, float]:
        """Return portfolio as {ticker: weight} dict."""
        try:
            return json.loads(self.tickers_json)
        except (json.JSONDecodeError, TypeError):
            return {}

    @tickers.setter
    def tickers(self, value: dict[str, float]):
        self.tickers_json = json.dumps(value)

    def to_dict(self) -> dict:
        return {
            "id":             self.id,
            "name":           self.name,
            "user_id":        self.user_id,
            "tickers":        self.tickers,
            "user_email":     self.user_email,
            "user_phone":     self.user_phone,
            "risk_threshold": self.risk_threshold,
            "is_active":      self.is_active,
            "created_at":     self.created_at.isoformat() if self.created_at else None,
            "updated_at":     self.updated_at.isoformat() if self.updated_at else None,
        }
