"""
routers/portfolio.py
---------------------
REST endpoints for managing user portfolios.

Endpoints:
  GET    /api/portfolio          — list all portfolios
  POST   /api/portfolio          — create a new portfolio
  GET    /api/portfolio/{id}     — get single portfolio
  PUT    /api/portfolio/{id}     — update portfolio
  DELETE /api/portfolio/{id}     — delete portfolio
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional

from models.database import get_db
from models.portfolio import Portfolio

router = APIRouter()


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class PortfolioCreate(BaseModel):
    name: str = Field("My Portfolio", min_length=1, max_length=120)
    tickers: dict[str, float] = Field(
        ...,
        description="Ticker → weight mapping. Weights should sum to ~1.0",
        example={"AAPL": 0.4, "MSFT": 0.3, "SPY": 0.3},
    )
    user_email: Optional[str] = None
    user_phone: Optional[str] = None
    risk_threshold: float = Field(0.70, ge=0.0, le=1.0)


class PortfolioUpdate(BaseModel):
    name: Optional[str] = None
    tickers: Optional[dict[str, float]] = None
    user_email: Optional[str] = None
    user_phone: Optional[str] = None
    risk_threshold: Optional[float] = None
    is_active: Optional[bool] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", summary="List all portfolios")
def list_portfolios(db: Session = Depends(get_db)):
    portfolios = db.query(Portfolio).order_by(Portfolio.created_at.desc()).all()
    return [p.to_dict() for p in portfolios]


@router.post("", summary="Create a new portfolio", status_code=201)
def create_portfolio(payload: PortfolioCreate, db: Session = Depends(get_db)):
    # Validate weights sum approximately to 1.0
    total_weight = sum(payload.tickers.values())
    if not (0.95 <= total_weight <= 1.05):
        raise HTTPException(
            status_code=422,
            detail=f"Portfolio weights must sum to ~1.0 (got {total_weight:.3f}). "
                   "Adjust your ticker weights.",
        )

    portfolio = Portfolio(
        name=payload.name,
        user_email=payload.user_email,
        user_phone=payload.user_phone,
        risk_threshold=payload.risk_threshold,
    )
    portfolio.tickers = payload.tickers
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    return portfolio.to_dict()


@router.get("/{portfolio_id}", summary="Get portfolio by ID")
def get_portfolio(portfolio_id: int, db: Session = Depends(get_db)):
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolio.to_dict()


@router.put("/{portfolio_id}", summary="Update portfolio")
def update_portfolio(
    portfolio_id: int,
    payload: PortfolioUpdate,
    db: Session = Depends(get_db),
):
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    if payload.name is not None:
        portfolio.name = payload.name
    if payload.tickers is not None:
        portfolio.tickers = payload.tickers
    if payload.user_email is not None:
        portfolio.user_email = payload.user_email
    if payload.user_phone is not None:
        portfolio.user_phone = payload.user_phone
    if payload.risk_threshold is not None:
        portfolio.risk_threshold = payload.risk_threshold
    if payload.is_active is not None:
        portfolio.is_active = payload.is_active

    db.commit()
    db.refresh(portfolio)
    return portfolio.to_dict()


@router.delete("/{portfolio_id}", summary="Delete portfolio", status_code=204)
def delete_portfolio(portfolio_id: int, db: Session = Depends(get_db)):
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    db.delete(portfolio)
    db.commit()
    return None
