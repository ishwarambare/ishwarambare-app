from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from routers import items, auth

load_dotenv()

app = FastAPI(
    title="Ishwarambare API",
    description="FastAPI backend for ishwarambare.online",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,https://ishwarambare.online,https://www.ishwarambare.online",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(items.router, prefix="/api/items", tags=["Items"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])


# ── Root & health ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    return {"message": "Welcome to ishwarambare.online API 🚀", "status": "running"}


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}
