"""
agent/tools/get_prices.py
--------------------------
Tool 2: Download 1-year OHLC price history for every ticker in the portfolio
        using yfinance (free, no API key required) and compute daily returns.

Fallback: If yfinance call fails (network/ticker error), synthetic price data
          is generated using geometric Brownian motion so the pipeline never
          stalls in demo/offline mode.
"""

import os
import random
import math
from typing import Any

import numpy as np
from langchain_core.tools import tool

# ── yfinance ──────────────────────────────────────────────────────────────────
try:
    import yfinance as yf
    _HAS_YFINANCE = True
except ImportError:
    _HAS_YFINANCE = False

MOCK_PRICES = os.getenv("MOCK_PRICES", "false").lower() == "true"


def _geometric_brownian_motion(
    S0: float = 150.0,
    mu: float = 0.0008,
    sigma: float = 0.018,
    days: int = 252,
    seed: int = 42,
) -> list[float]:
    """Generate synthetic daily close prices via GBM for offline demo."""
    rng = random.Random(seed)
    prices = [S0]
    for _ in range(days - 1):
        z = rng.gauss(0, 1)
        dt = 1 / 252
        S_new = prices[-1] * math.exp((mu - 0.5 * sigma**2) * dt + sigma * math.sqrt(dt) * z)
        prices.append(round(S_new, 2))
    return prices


def _mock_prices(tickers: list[str]) -> dict[str, list[float]]:
    """Return synthetic 1-year price histories for each ticker."""
    base_prices = {"AAPL": 178.0, "MSFT": 415.0, "GOOGL": 172.0,
                   "AMZN": 185.0, "SPY": 523.0, "QQQ": 445.0}
    result = {}
    for i, ticker in enumerate(tickers):
        S0 = base_prices.get(ticker, 100.0 + i * 30)
        # Use different seeds per ticker so prices diverge
        result[ticker] = _geometric_brownian_motion(S0=S0, seed=i * 7 + 13)
    return result


def _real_prices(tickers: list[str]) -> dict[str, list[float]]:
    """Download 1-year daily close prices from Yahoo Finance."""
    price_data = {}
    for ticker in tickers:
        try:
            df = yf.download(ticker, period="1y", interval="1d", progress=False, auto_adjust=True)
            closes = df["Close"].dropna().tolist()
            price_data[ticker] = [round(float(p), 2) for p in closes]
        except Exception:
            # Fallback to GBM for this individual ticker
            price_data[ticker] = _geometric_brownian_motion(seed=hash(ticker) % 1000)
    return price_data


def _compute_daily_returns(price_data: dict[str, list[float]]) -> dict[str, list[float]]:
    """Compute daily percentage returns: (P_t - P_{t-1}) / P_{t-1}."""
    returns = {}
    for ticker, prices in price_data.items():
        prices_arr = np.array(prices)
        daily_ret = np.diff(prices_arr) / prices_arr[:-1]
        returns[ticker] = [round(float(r), 6) for r in daily_ret]
    return returns


@tool
def get_prices(portfolio: dict) -> dict[str, Any]:
    """
    Download 1-year daily close prices for every ticker in the portfolio
    using Yahoo Finance (yfinance). Compute daily percentage returns for
    each ticker — these feed directly into calc_risk().

    Args:
        portfolio: dict mapping ticker → weight  e.g. {"AAPL": 0.4, "MSFT": 0.6}

    Returns:
        Partial AgentState update with:
        - price_data: {ticker: [252 close prices]}
        - daily_returns: {ticker: [251 daily returns]}
        - reasoning_steps: appended log lines
    """
    tickers = list(portfolio.keys())
    steps: list[str] = []
    errors: list[str] = []

    steps.append(f"📊 Fetching 1-year price history for: {', '.join(tickers)}")

    if MOCK_PRICES or not _HAS_YFINANCE:
        steps.append("   → MOCK_PRICES=true or yfinance unavailable, using GBM simulation")
        price_data = _mock_prices(tickers)
    else:
        steps.append("   → Calling Yahoo Finance (yfinance) — live data")
        try:
            price_data = _real_prices(tickers)
        except Exception as exc:
            errors.append(f"yfinance error: {exc}")
            steps.append("   → yfinance failed, falling back to GBM simulation")
            price_data = _mock_prices(tickers)

    # Compute returns
    daily_returns = _compute_daily_returns(price_data)

    # Log summary stats per ticker
    for ticker in tickers:
        prices = price_data[ticker]
        rets = daily_returns[ticker]
        ytd_pct = ((prices[-1] - prices[0]) / prices[0]) * 100 if prices else 0
        ann_vol = np.std(rets) * math.sqrt(252) * 100 if rets else 0
        steps.append(
            f"   [{ticker}] {len(prices)} days | "
            f"YTD: {ytd_pct:+.1f}% | "
            f"Ann. Vol: {ann_vol:.1f}%"
        )

    return {
        "price_data": price_data,
        "daily_returns": daily_returns,
        "reasoning_steps": steps,
        "errors": errors,
    }
