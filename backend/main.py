from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from routers import items, auth
from routers import portfolio, agent, alerts
from routers import articles
from models.database import create_tables

load_dotenv()

app = FastAPI(
    title="Financial Portfolio Agent API",
    description="LangGraph-powered portfolio risk analysis with real-time SSE streaming",
    version="2.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,https://ishwarambare.online,https://www.ishwarambare.online",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # allow all origins for SSE compatibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Create DB tables on startup ───────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    create_tables()


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(items.router,     prefix="/api/items",     tags=["Items"])
app.include_router(auth.router,      prefix="/api/auth",      tags=["Auth"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["Portfolio"])
app.include_router(agent.router,     prefix="/api/agent",     tags=["Agent"])
app.include_router(alerts.router,    prefix="/api/alerts",    tags=["Alerts"])
app.include_router(articles.router,  prefix="/api/articles",  tags=["Articles"])


# ── Root & health ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Financial Portfolio Agent API",
        "status":  "running",
        "docs":    "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}
