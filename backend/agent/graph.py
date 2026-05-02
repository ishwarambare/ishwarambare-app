"""
agent/graph.py
--------------
LangGraph StateGraph definition — the "brain" of the portfolio agent.

Flow:
                        ┌─────────────────────────────────────────────────────┐
  START ──► fetch_news ──► get_prices ──► calc_risk ──► [conditional edge] ──►│
                                                          │                    │
                                                  risk_score > 0.70           │
                                                          │                    │
                                              YES: send_alert ──► log_and_end ──► END
                                               NO: ────────────► log_and_end ──► END

Key LangGraph concepts demonstrated:
  1. TypedDict state (AgentState) flows through every node
  2. Each node is a plain Python async function
  3. Conditional edge routes based on state value (risk_score)
  4. .astream() yields state deltas — SSE-ready
"""

import json
import logging
from typing import Any, Literal

from langgraph.graph import StateGraph, END

from agent.state import AgentState
from agent.tools.fetch_news import fetch_news
from agent.tools.get_prices import get_prices
from agent.tools.calc_risk import calc_risk
from agent.tools.send_alert import send_alert

logger = logging.getLogger(__name__)

HIGH_RISK_THRESHOLD = 0.70


# ══════════════════════════════════════════════════════════════════════════════
# NODE FUNCTIONS
# Each node receives the full AgentState and returns a PARTIAL update dict.
# LangGraph merges the partial update back into state automatically.
# ══════════════════════════════════════════════════════════════════════════════

async def node_fetch_news(state: AgentState) -> dict[str, Any]:
    """Node 1: Fetch news and compute sentiment for the portfolio."""
    logger.info("[node_fetch_news] starting")
    result = fetch_news.invoke({"portfolio": state["portfolio"]})
    return {
        "news_items":       result["news_items"],
        "avg_sentiment":    result["avg_sentiment"],
        "reasoning_steps":  state.get("reasoning_steps", []) + result["reasoning_steps"],
        "errors":           state.get("errors", []) + result.get("errors", []),
    }


async def node_get_prices(state: AgentState) -> dict[str, Any]:
    """Node 2: Download 1-year price history and compute daily returns."""
    logger.info("[node_get_prices] starting")
    result = get_prices.invoke({"portfolio": state["portfolio"]})
    return {
        "price_data":       result["price_data"],
        "daily_returns":    result["daily_returns"],
        "reasoning_steps":  state["reasoning_steps"] + result["reasoning_steps"],
        "errors":           state.get("errors", []) + result.get("errors", []),
    }


async def node_calc_risk(state: AgentState) -> dict[str, Any]:
    """Node 3: Compute Sharpe, Sortino, volatility → composite risk_score."""
    logger.info("[node_calc_risk] starting")
    result = calc_risk.invoke({
        "portfolio":     state["portfolio"],
        "daily_returns": state["daily_returns"],
        "avg_sentiment": state.get("avg_sentiment", 0.0),
    })

    # Build alert_message here while all context is available
    risk_level   = result["risk_level"]
    risk_score   = result["risk_score"]
    metrics      = result.get("risk_metrics", {})
    sharpe       = metrics.get("sharpe_ratio", "N/A")
    sortino      = metrics.get("sortino_ratio", "N/A")
    tickers      = ", ".join(state["portfolio"].keys())

    alert_message = (
        f"RISK ALERT [{risk_level}] for portfolio [{tickers}]\n"
        f"Composite Risk Score: {risk_score:.1%}\n"
        f"Sharpe Ratio: {sharpe} | Sortino Ratio: {sortino}\n"
        f"News Sentiment: {state.get('avg_sentiment', 0.0):+.3f}\n"
        f"Recommend reviewing portfolio allocation immediately."
    )

    return {
        "risk_metrics":    result["risk_metrics"],
        "risk_score":      risk_score,
        "risk_level":      risk_level,
        "should_alert":    result["should_alert"],
        "alert_message":   alert_message,
        "reasoning_steps": state["reasoning_steps"] + result["reasoning_steps"],
        "errors":          state.get("errors", []) + result.get("errors", []),
    }


async def node_send_alert(state: AgentState) -> dict[str, Any]:
    """Node 4 (conditional): Send email + SMS alert when risk is HIGH."""
    logger.info("[node_send_alert] sending %s alert", state["risk_level"])
    result = send_alert.invoke({
        "portfolio":     state["portfolio"],
        "risk_score":    state["risk_score"],
        "risk_level":    state["risk_level"],
        "risk_metrics":  state["risk_metrics"],
        "news_items":    state.get("news_items", []),
        "alert_message": state.get("alert_message", ""),
        "user_email":    state.get("user_email", ""),
        "user_phone":    state.get("user_phone", ""),
    })
    return {
        "reasoning_steps": state["reasoning_steps"] + result["reasoning_steps"],
        "errors":          state.get("errors", []) + result.get("errors", []),
    }


async def node_log_and_end(state: AgentState) -> dict[str, Any]:
    """Terminal node: log final summary to console (and DB in Week 1 integration)."""
    summary_lines = [
        "─" * 50,
        "✅ Agent run complete",
        f"   Portfolio  : {list(state['portfolio'].keys())}",
        f"   Risk Score : {state.get('risk_score', 0.0):.3f}  [{state.get('risk_level', 'UNKNOWN')}]",
        f"   Alerted    : {state.get('should_alert', False)}",
        f"   News items : {len(state.get('news_items', []))}",
        f"   Errors     : {len(state.get('errors', []))}",
        "─" * 50,
    ]
    logger.info("\n".join(summary_lines))
    return {
        "reasoning_steps": state["reasoning_steps"] + summary_lines,
    }


# ══════════════════════════════════════════════════════════════════════════════
# CONDITIONAL EDGE
# ══════════════════════════════════════════════════════════════════════════════

def should_send_alert(state: AgentState) -> Literal["send_alert", "log_and_end"]:
    """
    Route to send_alert if risk_score exceeds threshold, otherwise skip to end.
    This is THE interview-ready conditional edge — the LLM never decides this;
    hard deterministic logic does.
    """
    risk_score = state.get("risk_score", 0.0)
    if risk_score >= HIGH_RISK_THRESHOLD:
        return "send_alert"
    return "log_and_end"


# ══════════════════════════════════════════════════════════════════════════════
# GRAPH ASSEMBLY
# ══════════════════════════════════════════════════════════════════════════════

def build_graph() -> StateGraph:
    """
    Construct and compile the LangGraph StateGraph.

    Returns a compiled graph that supports:
      graph.invoke(initial_state)        — synchronous, returns final state
      graph.astream(initial_state)       — async generator, yields step deltas
                                           (used for SSE streaming to React)
    """
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("fetch_news",   node_fetch_news)
    workflow.add_node("get_prices",   node_get_prices)
    workflow.add_node("calc_risk",    node_calc_risk)
    workflow.add_node("send_alert",   node_send_alert)
    workflow.add_node("log_and_end",  node_log_and_end)

    # Linear edges: fetch_news → get_prices → calc_risk
    workflow.set_entry_point("fetch_news")
    workflow.add_edge("fetch_news", "get_prices")
    workflow.add_edge("get_prices", "calc_risk")

    # Conditional edge after calc_risk
    workflow.add_conditional_edges(
        "calc_risk",
        should_send_alert,
        {
            "send_alert":  "send_alert",
            "log_and_end": "log_and_end",
        },
    )

    # Both terminal paths lead to END
    workflow.add_edge("send_alert",  "log_and_end")
    workflow.add_edge("log_and_end", END)

    return workflow.compile()


# ── Module-level compiled graph (import this everywhere) ──────────────────────
portfolio_agent = build_graph()


# ══════════════════════════════════════════════════════════════════════════════
# INITIAL STATE FACTORY
# ══════════════════════════════════════════════════════════════════════════════

def make_initial_state(
    portfolio: dict[str, float],
    portfolio_id: int | None = None,
    user_email: str = "",
    user_phone: str = "",
) -> AgentState:
    """
    Create a clean initial AgentState for a new agent run.

    Args:
        portfolio: {ticker: weight}  weights should sum to ~1.0
        portfolio_id: DB row id (optional, used for persistence)
        user_email: where to send email alerts
        user_phone: where to send SMS alerts (E.164 format: +919876543210)
    """
    return AgentState(
        portfolio=portfolio,
        portfolio_id=portfolio_id,
        user_email=user_email,
        user_phone=user_phone,
        news_items=[],
        avg_sentiment=0.0,
        price_data={},
        daily_returns={},
        risk_metrics={},
        risk_score=0.0,
        risk_level="LOW",
        should_alert=False,
        alert_message="",
        rag_context=[],
        reasoning_steps=["🚀 Agent initialised — starting portfolio analysis..."],
        errors=[],
    )
