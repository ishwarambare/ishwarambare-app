"""
models/alert.py
----------------
Alert ORM model — persists every alert dispatched by the agent.
Also stores the full agent run log (reasoning_steps) for the UI feed.
"""

from datetime import datetime, timezone
import json
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from models.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id              = Column(Integer, primary_key=True, index=True)
    portfolio_id    = Column(Integer, ForeignKey("portfolios.id"), index=True)

    # Risk snapshot
    risk_score      = Column(Float, nullable=False)
    risk_level      = Column(String(10), nullable=False)   # "LOW" | "MEDIUM" | "HIGH"
    sharpe_ratio    = Column(Float, nullable=True)
    sortino_ratio   = Column(Float, nullable=True)
    ann_volatility  = Column(Float, nullable=True)
    max_drawdown    = Column(Float, nullable=True)
    avg_sentiment   = Column(Float, nullable=True)

    # Alert delivery
    alert_message   = Column(Text, nullable=True)
    email_sent      = Column(Boolean, default=False)
    sms_sent        = Column(Boolean, default=False)
    sent_to_email   = Column(String(200), nullable=True)
    sent_to_phone   = Column(String(30), nullable=True)

    # Full reasoning log (JSON list of strings)
    reasoning_log   = Column(Text, nullable=True)  # JSON: ["step1", "step2", ...]

    # Errors encountered during run
    errors_log      = Column(Text, nullable=True)  # JSON list

    created_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # ── helpers ───────────────────────────────────────────────────────────────

    @property
    def reasoning_steps(self) -> list[str]:
        try:
            return json.loads(self.reasoning_log or "[]")
        except (json.JSONDecodeError, TypeError):
            return []

    @reasoning_steps.setter
    def reasoning_steps(self, value: list[str]):
        self.reasoning_log = json.dumps(value)

    def to_dict(self) -> dict:
        return {
            "id":             self.id,
            "portfolio_id":   self.portfolio_id,
            "risk_score":     self.risk_score,
            "risk_level":     self.risk_level,
            "sharpe_ratio":   self.sharpe_ratio,
            "sortino_ratio":  self.sortino_ratio,
            "ann_volatility": self.ann_volatility,
            "max_drawdown":   self.max_drawdown,
            "avg_sentiment":  self.avg_sentiment,
            "alert_message":  self.alert_message,
            "email_sent":     self.email_sent,
            "sms_sent":       self.sms_sent,
            "sent_to_email":  self.sent_to_email,
            "sent_to_phone":  self.sent_to_phone,
            "reasoning_steps": self.reasoning_steps,
            "errors":         json.loads(self.errors_log or "[]"),
            "created_at":     self.created_at.isoformat() if self.created_at else None,
        }
