# Gemini Project Instructions: ishwarambare-app

This document provides project-specific instructions, architectural patterns, and coding standards for `ishwarambare-app`.

## Project Overview
- **Domain:** [ishwarambare.online](https://ishwarambare.online)
- **Purpose:** Full-stack financial portfolio risk analysis platform using LangGraph agents and real-time SSE streaming.
- **Tech Stack:**
    - **Backend:** FastAPI (Python 3.14+), SQLAlchemy, LangGraph, Celery.
    - **Frontend:** React (Vite, Node.js 18+), Vanilla CSS.
    - **Database:** SQLite (dev) / PostgreSQL (prod).
    - **Deployment:** Render (via `render.yaml`).

## Core Architecture
- **Agent Workflow:** A LangGraph-powered pipeline: `fetch_news` -> `get_prices` -> `calc_risk` -> `send_alert` (conditional).
- **Streaming:** Backend uses `StreamingResponse` with SSE to push agent reasoning steps to the frontend.
- **State Management:** Backend uses `AgentState` (TypedDict) in LangGraph. Frontend uses React `useState`/`useEffect` and custom SSE hooks.

## Engineering Standards

### Private Memory
- **Location:** `C:\Users\ishwa\.gemini\tmp\ishwarambare-app\memory\MEMORY.md`
- **Purpose:** Store personal-to-the-user, project-specific notes that should NOT be committed to the repo. Use sibling `*.md` files for detailed notes and point to them from `MEMORY.md`.

### Backend (Python/FastAPI)
- **Conventions:** Follow PEP 8. Use `snake_case` for functions/variables and `PascalCase` for classes.
- **Typing:** Use explicit type hints for all function parameters and return types.
- **Routers:** Feature-based routing in `backend/routers/`. Use `APIRouter` with prefixes and tags.
- **Models:** Pydantic for request/response schemas; SQLAlchemy for ORM.
- **Database:** Use `Depends(get_db)` for session management. Always ensure sessions are closed.
- **SSE:** Emit structured events (`start`, `step`, `risk`, `alert`, `done`, `error`).

### Frontend (React/Vite)
- **Conventions:** Functional components with Hooks. `PascalCase` for component files and `camelCase` for props.
- **Services:** Encapsulate API calls in `frontend/src/services/api.js`.
- **SSE:** Use the SSE wrapper in `frontend/src/services/sse.js` for agent streaming.
- **Styling:** Prefer Vanilla CSS. Component-specific styles in `frontend/src/styles/`.

## Key Files & Directories
- `backend/main.py`: Application entry point and middleware.
- `backend/agent/graph.py`: LangGraph workflow definition.
- `backend/agent/tools/`: Individual agent tool implementations.
- `backend/routers/agent.py`: SSE endpoint for agent execution.
- `frontend/src/pages/LiveAgent.jsx`: Main interface for real-time agent monitoring.
- `frontend/src/components/AgentFeed.jsx`: Renders the streaming agent reasoning.

## Development Workflows
- **Local Dev:** 
    - Backend: `uvicorn main:app --reload --port 8000` (in `backend/`)
    - Frontend: `npm run dev` (in `frontend/`)
- **Testing:** 
    - Backend: Use `pytest` for unit and integration tests (e.g., `test_pipeline.py`).
- **Deployment:** Managed via Render blueprints (`render.yaml`).
