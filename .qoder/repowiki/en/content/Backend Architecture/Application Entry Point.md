# Application Entry Point

<cite>
**Referenced Files in This Document**
- [backend/main.py](file://backend/main.py)
- [backend/models/database.py](file://backend/models/database.py)
- [backend/routers/items.py](file://backend/routers/items.py)
- [backend/routers/auth.py](file://backend/routers/auth.py)
- [backend/routers/portfolio.py](file://backend/routers/portfolio.py)
- [backend/routers/alerts.py](file://backend/routers/alerts.py)
- [backend/routers/agent.py](file://backend/routers/agent.py)
- [README.md](file://README.md)
- [render.yaml](file://render.yaml)
- [backend/requirements.txt](file://backend/requirements.txt)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document provides comprehensive documentation for the FastAPI application entry point and configuration. It covers the application initialization process, CORS middleware configuration for cross-origin resource sharing (including SSE compatibility), automatic database table creation on startup, router registration with URL prefixes and tags, root and health endpoints, environment variable loading and configuration management, and practical guidance for customizing application settings across development, staging, and production environments. Security considerations and best practices for production deployments are also addressed.

## Project Structure
The backend is organized around a FastAPI application entry point that initializes the application, configures middleware, registers routers, and exposes health checks. Supporting modules include database configuration and SQLAlchemy ORM base classes, and multiple routers that define API endpoints grouped by functional domains.

```mermaid
graph TB
subgraph "Backend"
Main["backend/main.py"]
DB["backend/models/database.py"]
Routers["backend/routers/*"]
end
subgraph "Routers"
Items["routers/items.py"]
Auth["routers/auth.py"]
Portfolio["routers/portfolio.py"]
Alerts["routers/alerts.py"]
Agent["routers/agent.py"]
end
Main --> DB
Main --> Routers
Routers --> Items
Routers --> Auth
Routers --> Portfolio
Routers --> Alerts
Routers --> Agent
```

**Diagram sources**
- [backend/main.py:1-59](file://backend/main.py#L1-L59)
- [backend/models/database.py:1-42](file://backend/models/database.py#L1-L42)
- [backend/routers/items.py:1-72](file://backend/routers/items.py#L1-L72)
- [backend/routers/auth.py:1-39](file://backend/routers/auth.py#L1-L39)
- [backend/routers/portfolio.py:1-124](file://backend/routers/portfolio.py#L1-L124)
- [backend/routers/alerts.py:1-84](file://backend/routers/alerts.py#L1-L84)
- [backend/routers/agent.py:1-243](file://backend/routers/agent.py#L1-L243)

**Section sources**
- [backend/main.py:1-59](file://backend/main.py#L1-L59)
- [README.md:1-129](file://README.md#L1-L129)

## Core Components
This section details the primary components involved in application initialization and configuration.

- FastAPI Instance Creation with Custom Metadata
  - The application defines a FastAPI instance with custom title, description, and version metadata. These attributes populate OpenAPI documentation and improve discoverability.
  - Reference: [backend/main.py:12-16](file://backend/main.py#L12-L16)

- Environment Variable Loading and Configuration Management
  - The application loads environment variables using a dotenv loader at startup, enabling dynamic configuration of runtime behavior.
  - Reference: [backend/main.py:10](file://backend/main.py#L10)

- CORS Middleware Configuration
  - CORS is configured to allow all origins for SSE compatibility. Additional headers and methods are permitted to support streaming and cross-domain requests.
  - Reference: [backend/main.py:18-30](file://backend/main.py#L18-L30)

- Startup Event Handler for Database Initialization
  - On application startup, the database tables are created automatically by invoking a dedicated function. This ensures the schema is ready before serving requests.
  - Reference: [backend/main.py:32-35](file://backend/main.py#L32-L35)

- Router Registration with URL Prefixes and Tags
  - Routers are registered under distinct URL prefixes and tagged for improved API organization and documentation grouping.
  - Reference: [backend/main.py:38-43](file://backend/main.py#L38-L43)

- Root Endpoint and Health Check Endpoints
  - The root endpoint returns a simple welcome message and links to the interactive API documentation.
  - A dedicated health check endpoint indicates service readiness.
  - References:
    - [backend/main.py:46-53](file://backend/main.py#L46-L53)
    - [backend/main.py:55-58](file://backend/main.py#L55-L58)

**Section sources**
- [backend/main.py:10-59](file://backend/main.py#L10-L59)

## Architecture Overview
The application follows a layered architecture:
- Entry point initializes FastAPI, middleware, and routers.
- Database module manages connection and table creation.
- Routers encapsulate API endpoints grouped by domain.
- SSE streaming endpoints rely on CORS configuration for cross-origin delivery.

```mermaid
graph TB
Client["Client"]
Uvicorn["Uvicorn ASGI Server"]
App["FastAPI App<br/>backend/main.py"]
CORS["CORS Middleware"]
Startup["Startup Event Handler"]
DBInit["create_tables()"]
DB["Database Engine<br/>backend/models/database.py"]
Routers["Routers<br/>backend/routers/*"]
SSE["SSE Streaming Endpoint<br/>/api/agent/stream/{portfolio_id}"]
Client --> Uvicorn
Uvicorn --> App
App --> CORS
App --> Startup
Startup --> DBInit
DBInit --> DB
App --> Routers
Routers --> SSE
```

**Diagram sources**
- [backend/main.py:12-59](file://backend/main.py#L12-L59)
- [backend/models/database.py:38-42](file://backend/models/database.py#L38-L42)
- [backend/routers/agent.py:39-168](file://backend/routers/agent.py#L39-L168)

## Detailed Component Analysis

### FastAPI Application Initialization
- Purpose: Creates the FastAPI application instance with custom metadata and sets up environment-driven configuration.
- Key behaviors:
  - Loads environment variables for runtime customization.
  - Initializes CORS middleware with broad permissions for SSE compatibility.
  - Registers routers with URL prefixes and tags for API organization.
  - Defines root and health endpoints for service discovery and monitoring.
- Implementation references:
  - [backend/main.py:10-16](file://backend/main.py#L10-L16)
  - [backend/main.py:18-30](file://backend/main.py#L18-L30)
  - [backend/main.py:32-43](file://backend/main.py#L32-L43)
  - [backend/main.py:46-58](file://backend/main.py#L46-L58)

**Section sources**
- [backend/main.py:10-59](file://backend/main.py#L10-L59)

### CORS Middleware Configuration
- Purpose: Enables cross-origin requests to support browser-based clients and SSE streaming.
- Behavior:
  - Allows all origins to accommodate various frontend origins and streaming scenarios.
  - Permits credentials, methods, and headers to maximize compatibility.
- Security note: While convenient for development and SSE, broad origin allowances should be restricted in production.
- Implementation reference:
  - [backend/main.py:18-30](file://backend/main.py#L18-L30)

```mermaid
flowchart TD
Start(["CORS Configuration"]) --> Origins["Load ALLOWED_ORIGINS from environment"]
Origins --> AllowAll["Set allow_origins=['*'] for SSE compatibility"]
AllowAll --> Credentials["Allow credentials"]
Credentials --> Methods["Allow all methods"]
Methods --> Headers["Allow all headers"]
Headers --> Apply["Apply CORSMiddleware to app"]
Apply --> End(["CORS Active"])
```

**Diagram sources**
- [backend/main.py:18-30](file://backend/main.py#L18-L30)

**Section sources**
- [backend/main.py:18-30](file://backend/main.py#L18-L30)

### Startup Event Handler and Database Initialization
- Purpose: Ensures the database schema is initialized before accepting requests.
- Behavior:
  - Invoked on application startup.
  - Calls a function that creates all tables defined in the models.
- Implementation references:
  - [backend/main.py:32-35](file://backend/main.py#L32-L35)
  - [backend/models/database.py:38-42](file://backend/models/database.py#L38-L42)

```mermaid
sequenceDiagram
participant Uvicorn as "Uvicorn"
participant App as "FastAPI App"
participant Startup as "Startup Event"
participant DB as "Database Module"
Uvicorn->>App : Initialize app
App->>Startup : Register startup handler
Uvicorn->>Startup : Trigger on_event('startup')
Startup->>DB : create_tables()
DB-->>Startup : Tables created
Startup-->>App : Ready
```

**Diagram sources**
- [backend/main.py:32-35](file://backend/main.py#L32-L35)
- [backend/models/database.py:38-42](file://backend/models/database.py#L38-L42)

**Section sources**
- [backend/main.py:32-35](file://backend/main.py#L32-L35)
- [backend/models/database.py:38-42](file://backend/models/database.py#L38-L42)

### Router Registration and API Organization
- Purpose: Organizes endpoints under logical URL prefixes and tags for improved documentation and navigation.
- Behavior:
  - Registers routers for items, auth, portfolio, agent, and alerts.
  - Applies URL prefixes and tags for each router.
- Implementation references:
  - [backend/main.py:38-43](file://backend/main.py#L38-L43)

```mermaid
graph LR
App["FastAPI App"]
Items["Items Router<br/>/api/items"]
Auth["Auth Router<br/>/api/auth"]
Portfolio["Portfolio Router<br/>/api/portfolio"]
Agent["Agent Router<br/>/api/agent"]
Alerts["Alerts Router<br/>/api/alerts"]
App --> Items
App --> Auth
App --> Portfolio
App --> Agent
App --> Alerts
```

**Diagram sources**
- [backend/main.py:38-43](file://backend/main.py#L38-L43)

**Section sources**
- [backend/main.py:38-43](file://backend/main.py#L38-L43)

### Root Endpoint and Health Check Endpoints
- Purpose: Provides quick service discovery and monitoring capabilities.
- Endpoints:
  - Root: Returns a welcome message and documentation link.
  - Health: Returns a simple health status.
- Implementation references:
  - [backend/main.py:46-58](file://backend/main.py#L46-L58)

```mermaid
sequenceDiagram
participant Client as "Client"
participant App as "FastAPI App"
participant Root as "Root Endpoint"
participant Health as "Health Endpoint"
Client->>App : GET /
App->>Root : route("/")
Root-->>Client : {message, status, docs}
Client->>App : GET /health
App->>Health : route("/health")
Health-->>Client : {status : healthy}
```

**Diagram sources**
- [backend/main.py:46-58](file://backend/main.py#L46-L58)

**Section sources**
- [backend/main.py:46-58](file://backend/main.py#L46-L58)

### Environment Variable Loading and Configuration Management
- Purpose: Centralizes configuration via environment variables for flexibility across environments.
- Behavior:
  - Loads environment variables at startup.
  - Uses environment variables to configure CORS origins and database connections.
- Implementation references:
  - [backend/main.py:10](file://backend/main.py#L10)
  - [backend/models/database.py:15](file://backend/models/database.py#L15)

**Section sources**
- [backend/main.py:10](file://backend/main.py#L10)
- [backend/models/database.py:15](file://backend/models/database.py#L15)

### SSE Compatibility and CORS Considerations
- Purpose: Enables real-time streaming to browsers via Server-Sent Events.
- Behavior:
  - CORS allows all origins for SSE compatibility.
  - Additional headers are set in the SSE endpoint to ensure compatibility with reverse proxies.
- Implementation references:
  - [backend/main.py:18-30](file://backend/main.py#L18-L30)
  - [backend/routers/agent.py:160-168](file://backend/routers/agent.py#L160-L168)

```mermaid
sequenceDiagram
participant Browser as "Browser"
participant App as "FastAPI App"
participant Agent as "Agent Router"
participant SSE as "SSE Endpoint"
Browser->>App : GET /api/agent/stream/{id}
App->>Agent : Route to stream endpoint
Agent->>SSE : Create StreamingResponse
SSE-->>Browser : text/event-stream with CORS headers
Browser-->>SSE : Connection closed
```

**Diagram sources**
- [backend/routers/agent.py:39-168](file://backend/routers/agent.py#L39-L168)

**Section sources**
- [backend/routers/agent.py:39-168](file://backend/routers/agent.py#L39-L168)

### Router Details and Endpoint Coverage
- Items Router
  - Provides CRUD endpoints for items with in-memory storage.
  - Reference: [backend/routers/items.py:1-72](file://backend/routers/items.py#L1-L72)

- Auth Router
  - Provides demo login and user info endpoints.
  - Reference: [backend/routers/auth.py:1-39](file://backend/routers/auth.py#L1-L39)

- Portfolio Router
  - Manages portfolio records with validation and database persistence.
  - Reference: [backend/routers/portfolio.py:1-124](file://backend/routers/portfolio.py#L1-L124)

- Alerts Router
  - Provides read-only endpoints for alert history and statistics.
  - Reference: [backend/routers/alerts.py:1-84](file://backend/routers/alerts.py#L1-L84)

- Agent Router
  - Exposes SSE streaming and synchronous execution endpoints for agent runs.
  - Reference: [backend/routers/agent.py:1-243](file://backend/routers/agent.py#L1-L243)

**Section sources**
- [backend/routers/items.py:1-72](file://backend/routers/items.py#L1-L72)
- [backend/routers/auth.py:1-39](file://backend/routers/auth.py#L1-L39)
- [backend/routers/portfolio.py:1-124](file://backend/routers/portfolio.py#L1-L124)
- [backend/routers/alerts.py:1-84](file://backend/routers/alerts.py#L1-L84)
- [backend/routers/agent.py:1-243](file://backend/routers/agent.py#L1-L243)

## Dependency Analysis
The application depends on FastAPI, SQLAlchemy, and environment variables for configuration. The dependency chain is straightforward and avoids circular imports.

```mermaid
graph TB
FastAPI["fastapi==0.136.1"]
DotEnv["python-dotenv==1.2.2"]
Uvicorn["uvicorn==0.46.0"]
SQLAlchemy["sqlalchemy"]
Requests["requests"]
Pydantic["pydantic"]
Main["backend/main.py"] --> FastAPI
Main --> DotEnv
Main --> Uvicorn
Main --> SQLAlchemy
Main --> Requests
Main --> Pydantic
```

**Diagram sources**
- [backend/requirements.txt:1-20](file://backend/requirements.txt#L1-L20)
- [backend/main.py:1-8](file://backend/main.py#L1-L8)

**Section sources**
- [backend/requirements.txt:1-20](file://backend/requirements.txt#L1-L20)
- [backend/main.py:1-8](file://backend/main.py#L1-L8)

## Performance Considerations
- SSE Streaming
  - The agent streaming endpoint emits events incrementally and includes a small delay for visual pacing. This improves readability but may increase latency slightly.
  - Consider tuning the delay and batching messages for high-throughput scenarios.
  - Reference: [backend/routers/agent.py:99-101](file://backend/routers/agent.py#L99-L101)

- Database Operations
  - Database writes during SSE are executed in a thread pool to avoid blocking the async event loop, improving responsiveness.
  - Reference: [backend/routers/agent.py:149-151](file://backend/routers/agent.py#L149-L151)

- CORS Overhead
  - Broad CORS settings simplify integration but can introduce overhead in request processing. Consider narrowing allowed origins in production for better performance and security.
  - Reference: [backend/main.py:18-30](file://backend/main.py#L18-L30)

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- CORS Issues with SSE
  - Symptom: Browser blocks SSE or fails to receive events.
  - Resolution: Ensure CORS allows all origins and that the SSE endpoint sets appropriate headers.
  - References:
    - [backend/main.py:18-30](file://backend/main.py#L18-L30)
    - [backend/routers/agent.py:160-168](file://backend/routers/agent.py#L160-L168)

- Database Initialization Failures
  - Symptom: Tables not created on startup.
  - Resolution: Verify database URL environment variable and permissions; confirm the startup event handler is registered.
  - References:
    - [backend/models/database.py:15](file://backend/models/database.py#L15)
    - [backend/models/database.py:38-42](file://backend/models/database.py#L38-L42)
    - [backend/main.py:32-35](file://backend/main.py#L32-L35)

- Health Check Failures
  - Symptom: Health endpoint returns unhealthy status.
  - Resolution: Confirm the health endpoint is reachable and that dependencies (database, external services) are available.
  - Reference: [backend/main.py:55-58](file://backend/main.py#L55-L58)

**Section sources**
- [backend/main.py:18-30](file://backend/main.py#L18-L30)
- [backend/main.py:32-35](file://backend/main.py#L32-L35)
- [backend/main.py:55-58](file://backend/main.py#L55-L58)
- [backend/models/database.py:15](file://backend/models/database.py#L15)
- [backend/models/database.py:38-42](file://backend/models/database.py#L38-L42)
- [backend/routers/agent.py:160-168](file://backend/routers/agent.py#L160-L168)

## Conclusion
The FastAPI application entry point establishes a robust foundation for a real-time financial portfolio agent with streaming capabilities. It centralizes configuration via environment variables, configures CORS for SSE compatibility, initializes the database on startup, organizes endpoints by functional domains, and exposes essential health checks. For production deployments, tighten CORS policies, manage secrets securely, and validate environment configurations to ensure reliability and security.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Customizing Application Settings Across Environments
- Development
  - Use local origins and SQLite for zero-configuration development.
  - Example environment variables:
    - ALLOWED_ORIGINS=http://localhost:5173
    - DATABASE_URL=sqlite:///./portfolio.db
  - Reference: [backend/models/database.py:15](file://backend/models/database.py#L15)

- Staging
  - Align origins with staging domains and use a managed database.
  - Example environment variables:
    - ALLOWED_ORIGINS=https://staging.ishwarambare.online
    - DATABASE_URL=postgresql://user:pass@host/db
  - Reference: [README.md:88-92](file://README.md#L88-L92)

- Production
  - Restrict CORS origins to known domains, enable HTTPS, and rotate secrets regularly.
  - Example environment variables:
    - ALLOWED_ORIGINS=https://ishwarambare.online,https://www.ishwarambare.online
    - DATABASE_URL=postgresql://user:pass@host/db
    - SECRET_KEY=<securely generated>
  - Reference: [render.yaml:15-21](file://render.yaml#L15-L21)

### Security Considerations and Best Practices
- CORS Configuration
  - Broad origin allowances simplify SSE but expose the API to cross-origin requests. Limit origins to trusted domains in production.
  - Reference: [backend/main.py:18-30](file://backend/main.py#L18-L30)

- Secrets Management
  - Store sensitive keys (e.g., SECRET_KEY) in environment variables and never commit them to version control.
  - Reference: [README.md:88-92](file://README.md#L88-L92)

- Database Security
  - Use strong credentials and network-level access controls for production databases.
  - Reference: [backend/models/database.py:15](file://backend/models/database.py#L15)

- Monitoring and Health Checks
  - Ensure health endpoints are accessible and monitored to detect outages promptly.
  - Reference: [backend/main.py:55-58](file://backend/main.py#L55-L58)

**Section sources**
- [backend/main.py:18-30](file://backend/main.py#L18-L30)
- [backend/models/database.py:15](file://backend/models/database.py#L15)
- [README.md:88-92](file://README.md#L88-L92)
- [backend/main.py:55-58](file://backend/main.py#L55-L58)