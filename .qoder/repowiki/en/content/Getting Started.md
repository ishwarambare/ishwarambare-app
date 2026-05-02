# Getting Started

<cite>
**Referenced Files in This Document**
- [README.md](file://README.md)
- [backend/main.py](file://backend/main.py)
- [backend/models/database.py](file://backend/models/database.py)
- [backend/routers/items.py](file://backend/routers/items.py)
- [backend/routers/auth.py](file://backend/routers/auth.py)
- [backend/agent/graph.py](file://backend/agent/graph.py)
- [frontend/package.json](file://frontend/package.json)
- [frontend/vite.config.js](file://frontend/vite.config.js)
- [frontend/src/services/api.js](file://frontend/src/services/api.js)
- [frontend/src/App.jsx](file://frontend/src/App.jsx)
- [render.yaml](file://render.yaml)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Core Components](#core-components)
5. [Architecture Overview](#architecture-overview)
6. [Local Development Setup](#local-development-setup)
7. [Accessing Services](#accessing-services)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [IDE-Based Development Workflows](#ide-based-development-workflows)
10. [Conclusion](#conclusion)

## Introduction
This guide helps you set up ishwarambare-app for local development and become productive quickly. The project is a full-stack application built with FastAPI (Python) for the backend and React + Vite for the frontend. It includes a portfolio agent powered by LangGraph, real-time streaming via Server-Sent Events (SSE), and a simple SQLite-backed ORM layer.

## Project Structure
The repository is organized into two primary areas:
- backend/: FastAPI application with routers, models, agent, and Celery tasks
- frontend/: React application with routing, components, pages, and API services
- render.yaml: Deployment blueprint for Render

```mermaid
graph TB
subgraph "Backend (FastAPI)"
BM["backend/main.py"]
BR["backend/routers/*"]
BD["backend/models/*"]
BA["backend/agent/*"]
BT["backend/tasks/*"]
end
subgraph "Frontend (React + Vite)"
FP["frontend/package.json"]
FV["frontend/vite.config.js"]
FA["frontend/src/services/api.js"]
FR["frontend/src/App.jsx"]
end
RM["render.yaml"]
FP --> FV
FA --> BM
FR --> FA
BM --> BR
BM --> BD
BM --> BA
RM --> BM
RM --> FP
```

**Diagram sources**
- [backend/main.py:1-59](file://backend/main.py#L1-L59)
- [frontend/package.json:1-27](file://frontend/package.json#L1-L27)
- [frontend/vite.config.js:1-23](file://frontend/vite.config.js#L1-L23)
- [frontend/src/services/api.js:1-35](file://frontend/src/services/api.js#L1-L35)
- [frontend/src/App.jsx:1-21](file://frontend/src/App.jsx#L1-L21)
- [render.yaml:1-48](file://render.yaml#L1-L48)

**Section sources**
- [README.md:5-25](file://README.md#L5-L25)
- [README.md:29-75](file://README.md#L29-L75)

## Prerequisites
- Python 3.14+ for the backend
- Node.js 18+ for the frontend
- Git for cloning and pushing to GitHub (for deployment)
- Optional: Docker for containerized runs (not required)

These versions ensure compatibility with the latest FastAPI, React, and related toolchains used in the project.

**Section sources**
- [README.md:31-34](file://README.md#L31-L34)

## Core Components
- Backend API server: FastAPI app with CORS middleware, router registration, and startup table creation
- Database layer: SQLAlchemy engine configured for SQLite by default; can be switched to PostgreSQL
- Agent pipeline: LangGraph-based workflow orchestrating news fetching, price retrieval, risk calculation, and optional alerting
- Frontend client: React SPA with routing, charting, and SSE support for live agent updates

Key implementation highlights:
- Backend entrypoint defines routers under /api/* and exposes health and root endpoints
- Database initialization occurs on startup and supports SQLite or PostgreSQL via environment variable
- Agent graph defines a deterministic pipeline with conditional branching and SSE-ready streaming
- Frontend proxies API calls to the backend during development and reads base URL from environment variables

**Section sources**
- [backend/main.py:12-59](file://backend/main.py#L12-L59)
- [backend/models/database.py:10-42](file://backend/models/database.py#L10-L42)
- [backend/agent/graph.py:1-243](file://backend/agent/graph.py#L1-L243)
- [frontend/src/services/api.js:1-35](file://frontend/src/services/api.js#L1-L35)

## Architecture Overview
The system consists of a FastAPI backend serving REST endpoints and optional SSE streams, and a React frontend that consumes the API and displays portfolio analytics and agent insights.

```mermaid
graph TB
FE["Frontend (React + Vite)"]
API["Backend (FastAPI)"]
DB["Database (SQLite by default)"]
AG["Agent Pipeline (LangGraph)"]
FE --> |HTTP requests| API
API --> |ORM queries| DB
API --> |Agent orchestration| AG
AG --> |Optional alerts| API
API --> |SSE streams| FE
```

**Diagram sources**
- [backend/main.py:38-44](file://backend/main.py#L38-L44)
- [backend/models/database.py:15-42](file://backend/models/database.py#L15-L42)
- [backend/agent/graph.py:162-204](file://backend/agent/graph.py#L162-L204)
- [frontend/vite.config.js:7-17](file://frontend/vite.config.js#L7-L17)

## Local Development Setup
Follow these steps to run the backend and frontend locally.

### Backend (FastAPI)
1. Navigate to the backend directory.
2. Create and activate a Python virtual environment appropriate for your OS.
3. Install Python dependencies from the requirements file.
4. Duplicate the environment example file to create your .env and configure variables as needed.
5. Start the FastAPI development server on port 8000.

After starting the backend, you can access the interactive API documentation at http://localhost:8000/docs.

**Section sources**
- [README.md:35-56](file://README.md#L35-L56)
- [backend/main.py:19-30](file://backend/main.py#L19-L30)

### Frontend (React + Vite)
1. Navigate to the frontend directory.
2. Install JavaScript dependencies using your package manager.
3. Duplicate the environment example file to create your .env.local and set the API base URL if needed.
4. Start the Vite development server.

The frontend runs at http://localhost:5173 and proxies API calls under /api to the backend.

**Section sources**
- [README.md:58-74](file://README.md#L58-L74)
- [frontend/vite.config.js:7-17](file://frontend/vite.config.js#L7-L17)
- [frontend/src/services/api.js:3](file://frontend/src/services/api.js#L3)

## Accessing Services
- Backend API docs: http://localhost:8000/docs
- Frontend app: http://localhost:5173
- API calls from the frontend are proxied to http://localhost:8000 during development

The frontend’s routing and pages integrate with the backend’s API endpoints exposed under /api/*.

**Section sources**
- [README.md:56](file://README.md#L56)
- [README.md:73-74](file://README.md#L73-L74)
- [frontend/src/App.jsx:8-20](file://frontend/src/App.jsx#L8-L20)

## Troubleshooting Guide
Common setup issues and resolutions:

- Port conflicts
  - If port 8000 or 5173 is in use, adjust the ports in the backend and/or Vite configuration accordingly.
  - Backend port is configurable in the development command.
  - Vite port is defined in the frontend configuration.

- CORS and origin mismatches
  - The backend allows all origins for SSE compatibility but respects the ALLOWED_ORIGINS environment variable.
  - Ensure the frontend origin matches the allowed origins during development.

- Database connectivity
  - SQLite is used by default; no additional setup is required.
  - To use PostgreSQL, set the DATABASE_URL environment variable to a PostgreSQL connection string.

- Environment variables
  - Backend: create .env from the example and set ALLOWED_ORIGINS and SECRET_KEY as needed.
  - Frontend: create .env.local from the example and set VITE_API_URL to the backend URL if different from the default.

- Proxy settings
  - Vite proxies /api to the backend during development.
  - If you encounter proxy issues, verify the proxy target and changeOrigin settings in the Vite configuration.

- Authentication
  - The demo login endpoint accepts a username and password pair.
  - Replace the demo login with a proper JWT-based authentication system before production.

- Agent pipeline
  - The agent graph compiles on import and supports synchronous invocation and SSE-ready streaming.
  - Ensure the agent tools are available and the agent endpoints are reachable via the backend.

**Section sources**
- [backend/main.py:19-30](file://backend/main.py#L19-L30)
- [backend/models/database.py:15-18](file://backend/models/database.py#L15-L18)
- [frontend/vite.config.js:9-16](file://frontend/vite.config.js#L9-L16)
- [frontend/src/services/api.js:3](file://frontend/src/services/api.js#L3)
- [backend/routers/auth.py:18-32](file://backend/routers/auth.py#L18-L32)
- [backend/agent/graph.py:162-204](file://backend/agent/graph.py#L162-L204)

## IDE-Based Development Workflows
- Backend
  - Use your IDE’s integrated terminal to navigate to the backend directory and run the development server.
  - Set environment variables in your IDE’s run configuration or use a .env file loaded by your IDE.
  - Enable hot reload and breakpoints for efficient debugging.

- Frontend
  - Use your IDE’s integrated terminal to navigate to the frontend directory and run the development server.
  - Configure environment variables in .env.local or your IDE’s run configuration.
  - Leverage the proxy settings so API calls route to the backend seamlessly.

- Shared
  - Keep both servers running concurrently.
  - Use the backend’s interactive docs to test endpoints and the frontend to verify UI integrations.

[No sources needed since this section provides general guidance]

## Conclusion
You now have the essentials to run ishwarambare-app locally, understand the architecture, and troubleshoot common issues. Explore the backend routers and the agent pipeline to deepen your understanding, and extend the frontend pages and services to meet your feature requirements.