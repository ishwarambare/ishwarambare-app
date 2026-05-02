"""
routers/alerts.py
------------------
Read-only endpoints for alert history (written by the agent router).

Endpoints:
  GET /api/alerts                     — all alerts (latest first)
  GET /api/alerts/{portfolio_id}      — alerts for a specific portfolio
  GET /api/alerts/detail/{alert_id}   — single alert with full reasoning log
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from models.database import get_db
from models.alert import Alert

router = APIRouter()


@router.get("", summary="List all alerts")
def list_alerts(
    limit: int = 50,
    portfolio_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Alert).order_by(Alert.created_at.desc())
    if portfolio_id is not None:
        query = query.filter(Alert.portfolio_id == portfolio_id)
    alerts = query.limit(limit).all()
    return [a.to_dict() for a in alerts]


@router.get("/detail/{alert_id}", summary="Get full alert detail with reasoning log")
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert.to_dict()


@router.get("/portfolio/{portfolio_id}", summary="Alerts for a specific portfolio")
def alerts_for_portfolio(
    portfolio_id: int,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    alerts = (
        db.query(Alert)
        .filter(Alert.portfolio_id == portfolio_id)
        .order_by(Alert.created_at.desc())
        .limit(limit)
        .all()
    )
    return [a.to_dict() for a in alerts]


@router.get("/stats", summary="Summary stats across all alerts")
def alert_stats(db: Session = Depends(get_db)):
    total    = db.query(Alert).count()
    high     = db.query(Alert).filter(Alert.risk_level == "HIGH").count()
    medium   = db.query(Alert).filter(Alert.risk_level == "MEDIUM").count()
    low      = db.query(Alert).filter(Alert.risk_level == "LOW").count()
    emailed  = db.query(Alert).filter(Alert.email_sent == True).count()
    smsed    = db.query(Alert).filter(Alert.sms_sent == True).count()

    latest   = db.query(Alert).order_by(Alert.created_at.desc()).first()
    avg_risk = db.query(Alert).with_entities(
        Alert.risk_score
    ).all()
    avg = round(sum(r[0] for r in avg_risk) / len(avg_risk), 3) if avg_risk else 0.0

    return {
        "total_runs":    total,
        "high_alerts":   high,
        "medium_alerts": medium,
        "low_alerts":    low,
        "emails_sent":   emailed,
        "sms_sent":      smsed,
        "avg_risk_score": avg,
        "latest_run":    latest.created_at.isoformat() if latest and latest.created_at else None,
    }
