"""
agent/tools/calc_risk.py
-------------------------
Tool 3: Compute Sharpe ratio, Sortino ratio, annualised volatility,
        and max drawdown for the portfolio as a whole.

This is THE key differentiator in interviews — structured numerical computation
alongside LLM text reasoning.

─────────────────────────────────────────────────────────────────
MATH REFERENCE
─────────────────────────────────────────────────────────────────

Portfolio daily return (weighted sum):
    R_p(t) = Σ [ w_i * r_i(t) ]

Sharpe Ratio (annualised):
    Sharpe = (mean(R_p) - Rf_daily) / std(R_p)  *  sqrt(252)
    where Rf_daily = risk_free_rate / 252  (default 5% annual)

Interpretation: > 1.0 = good, > 2.0 = great, < 0.5 = poor

Sortino Ratio (annualised, penalises only downside volatility):
    downside_std = std( R_p[R_p < 0] )
    Sortino = (mean(R_p) - Rf_daily) / downside_std  *  sqrt(252)

Interpretation: > 1.5 = good.  Sortino > Sharpe means rare but deep losses.

Max Drawdown:
    peak = cumulative max of portfolio value
    drawdown = (value - peak) / peak
    max_drawdown = min(drawdown)   (most negative)

Risk Score (composite, 0.0 – 1.0):
    Combines normalised Sharpe, Sortino, volatility and news sentiment.
    Higher score = higher risk.
─────────────────────────────────────────────────────────────────
"""

import math
from typing import Any

import numpy as np
from langchain_core.tools import tool

# Annual risk-free rate (US 3-month T-bill approximate)
RISK_FREE_RATE_ANNUAL = 0.05
RISK_FREE_RATE_DAILY = RISK_FREE_RATE_ANNUAL / 252

# Thresholds for composite risk score
HIGH_RISK_THRESHOLD = 0.70
MEDIUM_RISK_THRESHOLD = 0.40


def _portfolio_returns(
    daily_returns: dict[str, list[float]],
    weights: dict[str, float],
) -> np.ndarray:
    """
    Compute daily portfolio returns as the weighted average of ticker returns.
    Aligns all tickers to the shortest return series.
    """
    tickers = list(weights.keys())
    min_len = min(len(daily_returns.get(t, [])) for t in tickers)
    if min_len == 0:
        return np.array([])

    weighted = np.zeros(min_len)
    total_weight = sum(weights[t] for t in tickers if t in daily_returns)

    for ticker in tickers:
        if ticker not in daily_returns:
            continue
        w = weights[ticker] / total_weight          # normalise in case weights don't sum to 1
        rets = np.array(daily_returns[ticker][:min_len])
        weighted += w * rets

    return weighted


def _sharpe(portfolio_rets: np.ndarray) -> float:
    """Annualised Sharpe ratio."""
    excess = portfolio_rets - RISK_FREE_RATE_DAILY
    std = np.std(portfolio_rets, ddof=1)
    if std == 0:
        return 0.0
    return float((np.mean(excess) / std) * math.sqrt(252))


def _sortino(portfolio_rets: np.ndarray) -> float:
    """Annualised Sortino ratio (uses downside deviation only)."""
    excess = portfolio_rets - RISK_FREE_RATE_DAILY
    downside = portfolio_rets[portfolio_rets < 0]
    downside_std = np.std(downside, ddof=1) if len(downside) > 1 else 1e-9
    return float((np.mean(excess) / downside_std) * math.sqrt(252))


def _max_drawdown(portfolio_rets: np.ndarray) -> float:
    """Maximum drawdown as a fraction (e.g. -0.23 = -23% peak-to-trough)."""
    cumulative = np.cumprod(1 + portfolio_rets)
    running_max = np.maximum.accumulate(cumulative)
    drawdowns = (cumulative - running_max) / running_max
    return float(np.min(drawdowns))


def _annualised_volatility(portfolio_rets: np.ndarray) -> float:
    """Annualised standard deviation of daily returns."""
    return float(np.std(portfolio_rets, ddof=1) * math.sqrt(252))


def _composite_risk_score(
    sharpe: float,
    sortino: float,
    ann_vol: float,
    max_dd: float,
    avg_sentiment: float,
) -> float:
    """
    Combine multiple signals into a single risk score [0.0, 1.0].

    Weighting logic:
      - Sharpe < 0.5 → high risk contribution (40% weight)
      - Sortino < 0 → very high risk (30% weight)
      - Annualised vol > 25% → high risk (20% weight)
      - News sentiment < -0.1 → risk amplifier (10% weight)
    """
    # Map each signal to 0..1 risk score (higher = riskier)
    # Sharpe: great(2) → 0.0 risk,  terrible(-1) → 1.0 risk
    sharpe_risk = max(0.0, min(1.0, (1.0 - sharpe) / 3.0))

    # Sortino: same mapping
    sortino_risk = max(0.0, min(1.0, (1.0 - sortino) / 3.0))

    # Volatility: 0% vol → 0.0 risk,  40%+ vol → 1.0 risk
    vol_risk = max(0.0, min(1.0, ann_vol / 0.40))

    # Sentiment: +1.0 → 0.0 risk,  -1.0 → 1.0 risk
    sentiment_risk = max(0.0, min(1.0, (-avg_sentiment + 1.0) / 2.0))

    composite = (
        0.40 * sharpe_risk
        + 0.30 * sortino_risk
        + 0.20 * vol_risk
        + 0.10 * sentiment_risk
    )
    return round(min(1.0, max(0.0, composite)), 3)


@tool
def calc_risk(
    portfolio: dict,
    daily_returns: dict,
    avg_sentiment: float,
) -> dict[str, Any]:
    """
    Compute Sharpe ratio, Sortino ratio, annualised volatility, and max drawdown
    for the portfolio. Combine these into a composite risk_score (0.0–1.0) that
    drives the alert decision in LangGraph's conditional edge.

    Args:
        portfolio: dict mapping ticker → weight
        daily_returns: {ticker: [daily_return, ...]} from get_prices()
        avg_sentiment: float from fetch_news() — blended into risk_score

    Returns:
        Partial AgentState update with:
        - risk_metrics: dict of all ratio values
        - risk_score: float 0.0–1.0
        - risk_level: "LOW" | "MEDIUM" | "HIGH"
        - should_alert: bool (True if risk_score > HIGH_RISK_THRESHOLD)
        - reasoning_steps: appended log lines
    """
    steps: list[str] = []
    errors: list[str] = []

    steps.append("🔢 Calculating portfolio risk metrics...")

    # Validate inputs
    if not daily_returns or not portfolio:
        errors.append("calc_risk: empty daily_returns or portfolio — using default risk score 0.5")
        return {
            "risk_metrics": {},
            "risk_score": 0.5,
            "risk_level": "MEDIUM",
            "should_alert": False,
            "reasoning_steps": steps,
            "errors": errors,
        }

    # Build portfolio return series
    port_rets = _portfolio_returns(daily_returns, portfolio)

    if len(port_rets) < 20:
        errors.append(f"calc_risk: only {len(port_rets)} return observations — need ≥ 20")
        return {
            "risk_metrics": {},
            "risk_score": 0.5,
            "risk_level": "MEDIUM",
            "should_alert": False,
            "reasoning_steps": steps,
            "errors": errors,
        }

    # ── Core ratio calculations ────────────────────────────────────────────────
    sharpe        = round(_sharpe(port_rets), 4)
    sortino       = round(_sortino(port_rets), 4)
    ann_vol       = round(_annualised_volatility(port_rets), 4)
    max_dd        = round(_max_drawdown(port_rets), 4)
    mean_ret      = round(float(np.mean(port_rets)), 6)

    risk_metrics = {
        "sharpe_ratio": sharpe,
        "sortino_ratio": sortino,
        "annualised_volatility": ann_vol,
        "max_drawdown": max_dd,
        "mean_daily_return": mean_ret,
    }

    # ── Composite risk score ──────────────────────────────────────────────────
    risk_score = _composite_risk_score(sharpe, sortino, ann_vol, max_dd, avg_sentiment)

    if risk_score >= HIGH_RISK_THRESHOLD:
        risk_level = "HIGH"
    elif risk_score >= MEDIUM_RISK_THRESHOLD:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    should_alert = risk_score >= HIGH_RISK_THRESHOLD

    # ── Reasoning log ─────────────────────────────────────────────────────────
    steps.append(f"   Observations : {len(port_rets)} trading days")
    steps.append(f"   Mean daily Rp: {mean_ret:+.4%}")
    steps.append(f"   Ann. Volatility: {ann_vol:.2%}")
    steps.append(f"   Max Drawdown  : {max_dd:.2%}")
    steps.append(f"   Sharpe Ratio  : {sharpe:.4f}  {'✅ good' if sharpe >= 1.0 else '⚠️  below 1.0' if sharpe >= 0 else '🔴 negative'}")
    steps.append(f"   Sortino Ratio : {sortino:.4f}  {'✅ good' if sortino >= 1.5 else '⚠️  below 1.5' if sortino >= 0 else '🔴 negative'}")
    steps.append(f"   Sentiment input: {avg_sentiment:+.3f}")
    steps.append(f"   ─────────────────────────────────────────")
    steps.append(f"   Composite Risk Score: {risk_score:.3f}  → {risk_level}")

    if should_alert:
        steps.append(f"   🚨 ALERT THRESHOLD EXCEEDED ({risk_score:.3f} ≥ {HIGH_RISK_THRESHOLD})")
    else:
        steps.append(f"   ✅ Risk within acceptable range ({risk_score:.3f} < {HIGH_RISK_THRESHOLD})")

    return {
        "risk_metrics": risk_metrics,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "should_alert": should_alert,
        "reasoning_steps": steps,
        "errors": errors,
    }
