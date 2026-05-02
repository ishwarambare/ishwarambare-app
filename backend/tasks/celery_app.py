"""
tasks/celery_app.py
--------------------
Celery application + Beat schedule for the daily portfolio analysis job.

Requirements:
  pip install celery[redis] redis
  
  Redis must be running locally:
    docker run -d -p 6379:6379 redis:7-alpine
  OR set REDIS_URL to a hosted Redis (Render, Upstash, etc.)

Start worker (from backend/ dir):
  celery -A tasks.celery_app worker --loglevel=info

Start Beat scheduler:
  celery -A tasks.celery_app beat --loglevel=info

The daily task runs at 08:00 UTC every day and analyses all active portfolios.
"""

import os
import asyncio
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

try:
    from celery import Celery
    from celery.schedules import crontab

    celery_app = Celery(
        "portfolio_agent",
        broker=REDIS_URL,
        backend=REDIS_URL,
        include=["tasks.celery_app"],
    )

    celery_app.conf.update(
        task_serializer="json",
        result_serializer="json",
        accept_content=["json"],
        timezone="UTC",
        enable_utc=True,
        # ── Beat schedule: run every day at 08:00 UTC ────────────────────────
        beat_schedule={
            "daily-portfolio-analysis": {
                "task":     "tasks.celery_app.analyse_all_portfolios",
                "schedule": crontab(hour=8, minute=0),   # 08:00 UTC daily
            },
        },
    )

    @celery_app.task(name="tasks.celery_app.analyse_all_portfolios", bind=True, max_retries=3)
    def analyse_all_portfolios(self):
        """
        Celery task: iterate all active portfolios and run the LangGraph agent
        for each one. Persists results to the DB via the sync run path.
        """
        logger.info("[Celery] Starting daily portfolio analysis at %s", datetime.now(timezone.utc))

        from models.database import SessionLocal
        from models.portfolio import Portfolio
        from models.alert import Alert
        from agent.graph import portfolio_agent, make_initial_state

        db = SessionLocal()
        try:
            portfolios = db.query(Portfolio).filter(Portfolio.is_active == True).all()
            logger.info("[Celery] Found %d active portfolios", len(portfolios))

            for p in portfolios:
                try:
                    logger.info("[Celery] Analysing portfolio %d: %s", p.id, p.name)

                    initial_state = make_initial_state(
                        portfolio=p.tickers,
                        portfolio_id=p.id,
                        user_email=p.user_email or "",
                        user_phone=p.user_phone or "",
                    )

                    # Run async agent in sync Celery context
                    loop = asyncio.new_event_loop()
                    final_state = loop.run_until_complete(portfolio_agent.ainvoke(initial_state))
                    loop.close()

                    # Persist
                    import json
                    metrics = final_state.get("risk_metrics", {})
                    alert_row = Alert(
                        portfolio_id   = p.id,
                        risk_score     = final_state.get("risk_score", 0.0),
                        risk_level     = final_state.get("risk_level", "UNKNOWN"),
                        sharpe_ratio   = metrics.get("sharpe_ratio"),
                        sortino_ratio  = metrics.get("sortino_ratio"),
                        ann_volatility = metrics.get("annualised_volatility"),
                        max_drawdown   = metrics.get("max_drawdown"),
                        avg_sentiment  = final_state.get("avg_sentiment", 0.0),
                        alert_message  = final_state.get("alert_message", ""),
                        email_sent     = bool(p.user_email and final_state.get("should_alert")),
                        sms_sent       = bool(p.user_phone and final_state.get("risk_level") == "HIGH"),
                        sent_to_email  = p.user_email,
                        sent_to_phone  = p.user_phone,
                    )
                    alert_row.reasoning_steps = final_state.get("reasoning_steps", [])
                    alert_row.errors_log = json.dumps(final_state.get("errors", []))
                    db.add(alert_row)
                    db.commit()
                    logger.info(
                        "[Celery] Portfolio %d done — risk_score=%.3f level=%s alert=%s",
                        p.id,
                        final_state.get("risk_score", 0.0),
                        final_state.get("risk_level"),
                        final_state.get("should_alert"),
                    )

                except Exception as exc:
                    logger.exception("[Celery] Portfolio %d failed: %s", p.id, exc)
                    db.rollback()

        finally:
            db.close()

        return {"analysed": len(portfolios), "timestamp": datetime.now(timezone.utc).isoformat()}

    _HAS_CELERY = True

except ImportError:
    logger.warning("Celery not installed — scheduled jobs disabled. Run: pip install celery[redis] redis")
    celery_app = None
    _HAS_CELERY = False
