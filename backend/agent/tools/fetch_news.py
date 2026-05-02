"""
agent/tools/fetch_news.py
--------------------------
Tool 1: Fetch latest financial news for each ticker in the portfolio,
        score each headline with TextBlob sentiment analysis, and
        compute an average portfolio-level sentiment score.

Real API: NewsAPI (newsapi.org)  — free tier: 100 req/day
Mock mode: set NEWS_API_KEY=mock in .env (auto-used when key missing)

Sentiment interpretation:
  polarity < -0.1  → BEARISH (bad news)
  polarity > +0.1  → BULLISH (good news)
  -0.1 to +0.1     → NEUTRAL
"""

import os
import random
from datetime import datetime, timedelta
from typing import Any

from langchain_core.tools import tool
from textblob import TextBlob

# ── NewsAPI SDK (optional) ────────────────────────────────────────────────────
try:
    from newsapi import NewsApiClient
    _HAS_NEWSAPI = True
except ImportError:
    _HAS_NEWSAPI = False

NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")

# ── Mock headlines for demo / offline mode ────────────────────────────────────
_MOCK_HEADLINES = [
    ("Fed signals further rate hikes amid persistent inflation fears", -0.35),
    ("Tech sector faces headwinds as AI chip exports restricted", -0.42),
    ("Strong earnings season boosts investor confidence in S&P 500", 0.61),
    ("Banking stocks tumble on regional bank contagion concerns", -0.55),
    ("Apple reports record quarterly revenue, beats analyst expectations", 0.72),
    ("Microsoft Azure growth slows, cloud competition intensifies", -0.20),
    ("Oil prices surge on OPEC supply cuts, energy sector rallies", 0.38),
    ("Consumer confidence index drops to 6-month low", -0.44),
    ("Nasdaq posts best week in two months on cooling inflation data", 0.53),
    ("SEC launches investigation into crypto exchange practices", -0.30),
]


def _mock_news(tickers: list[str]) -> list[dict]:
    """Return deterministic-ish mock headlines when no API key is set."""
    items = []
    sample = random.sample(_MOCK_HEADLINES, min(len(_MOCK_HEADLINES), 6))
    for i, (headline, polarity) in enumerate(sample):
        ticker = tickers[i % len(tickers)]
        blob = TextBlob(headline)
        items.append(
            {
                "headline": headline,
                "source": "MockNews",
                "url": f"https://example.com/news/{i}",
                "polarity": polarity,
                "subjectivity": round(blob.sentiment.subjectivity, 3),
            }
        )
    return items


def _real_news(tickers: list[str]) -> list[dict]:
    """Fetch live headlines from NewsAPI for each ticker symbol."""
    client = NewsApiClient(api_key=NEWS_API_KEY)
    query = " OR ".join(tickers)
    from_date = (datetime.utcnow() - timedelta(days=2)).strftime("%Y-%m-%d")

    response = client.get_everything(
        q=query,
        language="en",
        sort_by="relevancy",
        from_param=from_date,
        page_size=20,
    )

    items = []
    for article in response.get("articles", [])[:10]:
        title = article.get("title") or ""
        blob = TextBlob(title)
        items.append(
            {
                "headline": title,
                "source": article.get("source", {}).get("name", "Unknown"),
                "url": article.get("url", ""),
                "polarity": round(blob.sentiment.polarity, 3),
                "subjectivity": round(blob.sentiment.subjectivity, 3),
            }
        )
    return items


@tool
def fetch_news(portfolio: dict) -> dict[str, Any]:
    """
    Fetch the latest financial news headlines for every ticker in the portfolio
    and compute a sentiment score for each headline using TextBlob NLP.

    Args:
        portfolio: dict mapping ticker symbol → portfolio weight
                   e.g. {"AAPL": 0.4, "MSFT": 0.3, "SPY": 0.3}

    Returns:
        Partial AgentState update with keys:
        - news_items: list of NewsItem dicts
        - avg_sentiment: float (-1.0 to +1.0)
        - reasoning_steps: list of log strings (appended, not replaced)
    """
    tickers = list(portfolio.keys())
    steps: list[str] = []
    errors: list[str] = []

    steps.append(f"📰 Fetching news for tickers: {', '.join(tickers)}")

    # Choose real or mock data source
    if NEWS_API_KEY and NEWS_API_KEY != "mock" and _HAS_NEWSAPI:
        steps.append("   → Using NewsAPI (live data)")
        try:
            news_items = _real_news(tickers)
        except Exception as exc:
            errors.append(f"NewsAPI error: {exc} — falling back to mock data")
            news_items = _mock_news(tickers)
    else:
        steps.append("   → NEWS_API_KEY not set, using mock headlines")
        news_items = _mock_news(tickers)

    # Compute portfolio-level sentiment
    if news_items:
        avg_sentiment = round(
            sum(item["polarity"] for item in news_items) / len(news_items), 3
        )
    else:
        avg_sentiment = 0.0

    # Sentiment label for the log
    if avg_sentiment < -0.1:
        sentiment_label = f"BEARISH ({avg_sentiment:+.3f})"
    elif avg_sentiment > 0.1:
        sentiment_label = f"BULLISH ({avg_sentiment:+.3f})"
    else:
        sentiment_label = f"NEUTRAL ({avg_sentiment:+.3f})"

    steps.append(f"   → Retrieved {len(news_items)} headlines")
    steps.append(f"   → Average sentiment: {sentiment_label}")

    # Log top negative headlines for context
    negative = [n for n in news_items if n["polarity"] < -0.15]
    if negative:
        steps.append(f"   ⚠️  {len(negative)} bearish headline(s) detected:")
        for n in negative[:3]:
            steps.append(f"      • \"{n['headline'][:80]}\" [{n['polarity']:+.2f}]")

    return {
        "news_items": news_items,
        "avg_sentiment": avg_sentiment,
        "reasoning_steps": steps,
        "errors": errors,
    }
