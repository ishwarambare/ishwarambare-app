"""
agent/state.py
--------------
Defines the AgentState TypedDict that flows through every LangGraph node.
Every tool reads from this dict and returns a PARTIAL update — LangGraph
merges the update back into the shared state automatically.
"""

from typing import TypedDict, Optional


class NewsItem(TypedDict):
    headline: str
    source: str
    url: str
    polarity: float        # TextBlob sentiment: -1.0 (very negative) → +1.0 (very positive)
    subjectivity: float    # TextBlob: 0.0 (objective) → 1.0 (subjective)


class RiskMetrics(TypedDict):
    sharpe_ratio: float
    sortino_ratio: float
    annualised_volatility: float
    max_drawdown: float
    mean_daily_return: float


class AgentState(TypedDict):
    # ── Input ─────────────────────────────────────────────────
    portfolio: dict                # {ticker: weight}   e.g. {"AAPL": 0.4, "MSFT": 0.3, "SPY": 0.3}
    portfolio_id: Optional[int]    # DB row id (None during standalone runs)
    user_email: Optional[str]
    user_phone: Optional[str]

    # ── Populated by fetch_news() ──────────────────────────────
    news_items: list[NewsItem]
    avg_sentiment: float           # mean polarity across all headlines

    # ── Populated by get_prices() ──────────────────────────────
    price_data: dict               # {ticker: [close_price, ...]}  252 trading days
    daily_returns: dict            # {ticker: [daily_return, ...]}

    # ── Populated by calc_risk() ───────────────────────────────
    risk_metrics: RiskMetrics
    risk_score: float              # composite 0.0 – 1.0  (higher = riskier)
    risk_level: str                # "LOW" | "MEDIUM" | "HIGH"

    # ── Decision flags ─────────────────────────────────────────
    should_alert: bool
    alert_message: str

    # ── RAG context (added in Week 3) ──────────────────────────
    rag_context: list[str]         # retrieved chunks from Pinecone

    # ── Audit trail (streamed to SSE) ──────────────────────────
    reasoning_steps: list[str]
    errors: list[str]

