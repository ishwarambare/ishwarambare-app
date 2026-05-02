"""
routers/agent.py
-----------------
Agent triggering and SSE streaming endpoint.

Endpoints:
  GET  /api/agent/stream/{portfolio_id}  — SSE: streams agent reasoning steps live
  POST /api/agent/run/{portfolio_id}     — sync: run agent, save result, return summary
  GET  /api/agent/status                 — health check / status
"""

import json
import asyncio
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from models.database import get_db
from models.portfolio import Portfolio
from models.alert import Alert
from agent.graph import portfolio_agent, make_initial_state

logger = logging.getLogger(__name__)
router = APIRouter()


# ── SSE helper ────────────────────────────────────────────────────────────────

def _sse(data: dict) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json.dumps(data)}\n\n"


# ── Stream endpoint (SSE) ─────────────────────────────────────────────────────

@router.get("/stream/{portfolio_id}", summary="Stream agent run via SSE")
async def stream_agent(
    portfolio_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Server-Sent Events endpoint.
    The React frontend connects with EventSource and renders each message
    in real time as the agent traverses nodes.

    Event types sent to client:
      { type: "step",   node: str, message: str }
      { type: "risk",   risk_score: float, risk_level: str, metrics: dict }
      { type: "alert",  triggered: bool }
      { type: "done",   alert_id: int }
      { type: "error",  message: str }
    """
    # Load portfolio from DB
    portfolio_row = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio_row:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    portfolio_data = portfolio_row.tickers
    user_email     = portfolio_row.user_email or ""
    user_phone     = portfolio_row.user_phone or ""

    # Snapshot DB session data we need (session can't cross thread boundaries)
    portfolio_name = portfolio_row.name

    async def event_generator():
        # Send initial handshake
        yield _sse({"type": "start", "portfolio": portfolio_data, "name": portfolio_name})

        seen_steps = 0
        final_state = {}

        try:
            initial_state = make_initial_state(
                portfolio=portfolio_data,
                portfolio_id=portfolio_id,
                user_email=user_email,
                user_phone=user_phone,
            )

            # Stream node-by-node updates
            async for event in portfolio_agent.astream(initial_state):
                # Check if client disconnected
                if await request.is_disconnected():
                    logger.info("SSE client disconnected for portfolio %s", portfolio_id)
                    break

                for node_name, state_update in event.items():
                    final_state.update(state_update)

                    # Emit new reasoning steps (delta only)
                    all_steps = state_update.get("reasoning_steps", [])
                    new_steps = all_steps[seen_steps:]
                    seen_steps = len(all_steps)

                    for step in new_steps:
                        yield _sse({"type": "step", "node": node_name, "message": step})
                        await asyncio.sleep(0.05)   # slight delay for visual effect

                    # Emit risk metrics when calc_risk node completes
                    if "risk_score" in state_update:
                        yield _sse({
                            "type":       "risk",
                            "risk_score": state_update["risk_score"],
                            "risk_level": state_update.get("risk_level", "UNKNOWN"),
                            "metrics":    state_update.get("risk_metrics", {}),
                        })

                    # Emit alert decision
                    if "should_alert" in state_update:
                        yield _sse({
                            "type":      "alert",
                            "triggered": state_update["should_alert"],
                        })

                    # Emit any errors
                    for err in state_update.get("errors", []):
                        yield _sse({"type": "error", "message": err})

        except Exception as exc:
            logger.exception("Agent run failed for portfolio %s", portfolio_id)
            yield _sse({"type": "error", "message": str(exc)})
            return

        # ── Persist result to DB ──────────────────────────────────────────────
        try:
            metrics  = final_state.get("risk_metrics", {})
            alert_row = Alert(
                portfolio_id   = portfolio_id,
                risk_score     = final_state.get("risk_score", 0.0),
                risk_level     = final_state.get("risk_level", "UNKNOWN"),
                sharpe_ratio   = metrics.get("sharpe_ratio"),
                sortino_ratio  = metrics.get("sortino_ratio"),
                ann_volatility = metrics.get("annualised_volatility"),
                max_drawdown   = metrics.get("max_drawdown"),
                avg_sentiment  = final_state.get("avg_sentiment", 0.0),
                alert_message  = final_state.get("alert_message", ""),
                email_sent     = bool(user_email and final_state.get("should_alert")),
                sms_sent       = bool(user_phone and final_state.get("risk_level") == "HIGH"),
                sent_to_email  = user_email or None,
                sent_to_phone  = user_phone or None,
            )
            alert_row.reasoning_steps = final_state.get("reasoning_steps", [])
            alert_row.errors_log      = json.dumps(final_state.get("errors", []))

            # Run DB write in executor to avoid blocking async loop
            loop = asyncio.get_event_loop()
            alert_id = await loop.run_in_executor(None, _save_alert, alert_row)

            yield _sse({"type": "done", "alert_id": alert_id})

        except Exception as exc:
            logger.exception("Failed to persist alert for portfolio %s", portfolio_id)
            yield _sse({"type": "error", "message": f"DB save failed: {exc}"})
            yield _sse({"type": "done", "alert_id": None})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":               "no-cache",
            "X-Accel-Buffering":           "no",   # needed for Nginx
            "Access-Control-Allow-Origin": "*",
        },
    )


def _save_alert(alert_row: Alert) -> int:
    """Run in thread executor — creates a fresh DB session for the insert."""
    from models.database import SessionLocal
    db = SessionLocal()
    try:
        db.add(alert_row)
        db.commit()
        db.refresh(alert_row)
        return alert_row.id
    finally:
        db.close()


# ── Sync run endpoint ─────────────────────────────────────────────────────────

@router.post("/run/{portfolio_id}", summary="Run agent synchronously (returns JSON summary)")
async def run_agent_sync(portfolio_id: int, db: Session = Depends(get_db)):
    """Trigger an agent run and wait for completion. Returns a JSON summary."""
    portfolio_row = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio_row:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    initial_state = make_initial_state(
        portfolio=portfolio_row.tickers,
        portfolio_id=portfolio_id,
        user_email=portfolio_row.user_email or "",
        user_phone=portfolio_row.user_phone or "",
    )

    # Run the full graph
    final_state = await portfolio_agent.ainvoke(initial_state)

    # Persist
    metrics = final_state.get("risk_metrics", {})
    alert_row = Alert(
        portfolio_id   = portfolio_id,
        risk_score     = final_state.get("risk_score", 0.0),
        risk_level     = final_state.get("risk_level", "UNKNOWN"),
        sharpe_ratio   = metrics.get("sharpe_ratio"),
        sortino_ratio  = metrics.get("sortino_ratio"),
        ann_volatility = metrics.get("annualised_volatility"),
        max_drawdown   = metrics.get("max_drawdown"),
        avg_sentiment  = final_state.get("avg_sentiment", 0.0),
        alert_message  = final_state.get("alert_message", ""),
        email_sent     = bool(portfolio_row.user_email and final_state.get("should_alert")),
        sms_sent       = bool(portfolio_row.user_phone and final_state.get("risk_level") == "HIGH"),
        sent_to_email  = portfolio_row.user_email,
        sent_to_phone  = portfolio_row.user_phone,
    )
    alert_row.reasoning_steps = final_state.get("reasoning_steps", [])
    alert_row.errors_log      = json.dumps(final_state.get("errors", []))
    db.add(alert_row)
    db.commit()
    db.refresh(alert_row)

    return {
        "alert_id":    alert_row.id,
        "risk_score":  final_state.get("risk_score"),
        "risk_level":  final_state.get("risk_level"),
        "should_alert": final_state.get("should_alert"),
        "risk_metrics": metrics,
    }


@router.get("/status", summary="Agent service health check")
def agent_status():
    return {
        "status":  "ready",
        "agent":   "LangGraph portfolio agent",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
