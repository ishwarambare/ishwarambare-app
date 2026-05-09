# Database Layer

<cite>
**Referenced Files in This Document**
- [database.py](file://backend/models/database.py)
- [portfolio.py](file://backend/models/portfolio.py)
- [alert.py](file://backend/models/alert.py)
- [article.py](file://backend/models/article.py)
- [main.py](file://backend/main.py)
- [portfolio.py](file://backend/routers/portfolio.py)
- [alerts.py](file://backend/routers/alerts.py)
- [articles.py](file://backend/routers/articles.py)
- [agent.py](file://backend/routers/agent.py)
- [graph.py](file://backend/agent/graph.py)
- [README.md](file://README.md)
</cite>

## Update Summary
**Changes Made**
- Added comprehensive documentation for the new Article model with complete field definitions
- Updated database configuration to include Article model registration
- Enhanced architecture overview to include article management workflow
- Added Article CRUD operations and routing documentation
- Updated frontend integration details for article management
- Expanded query patterns to include article filtering and search capabilities

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
This document describes the database layer built with SQLAlchemy ORM in the backend. It covers engine and session configuration, table creation on startup, models and relationships, indexes, and operational aspects such as transactions, bulk operations, security, and monitoring. The system now includes comprehensive article management capabilities alongside the existing portfolio and alert systems. It also documents how the agent writes alert records, how the frontend consumes alert history, and how technical articles are managed through the integrated CRUD operations.

## Project Structure
The database layer is organized around a small set of modules with expanded functionality for article management:
- Engine and session factory are defined centrally.
- Three ORM models represent portfolios, alerts, and articles.
- Application startup triggers table creation for all models.
- Routers orchestrate CRUD and read operations against the models.
- The agent writes alert records after computing risk.
- Article management includes full CRUD operations with publishing workflow.

```mermaid
graph TB
subgraph "Backend"
M["main.py<br/>Startup hooks"]
D["models/database.py<br/>Engine, Session, Base, get_db(), create_tables()"]
P["models/portfolio.py<br/>Portfolio model"]
A["models/alert.py<br/>Alert model"]
ART["models/article.py<br/>Article model"]
RP["routers/portfolio.py<br/>Portfolio CRUD"]
RA["routers/alerts.py<br/>Alert queries"]
RART["routers/articles.py<br/>Article CRUD + Publishing"]
RG["routers/agent.py<br/>Agent run + SSE"]
G["agent/graph.py<br/>Agent workflow"]
end
M --> D
M --> RP
M --> RA
M --> RART
M --> RG
RP --> D
RA --> D
RART --> D
RG --> D
RG --> G
D --> P
D --> A
D --> ART
```

**Diagram sources**
- [main.py:32-35](file://backend/main.py#L32-L35)
- [database.py:25-41](file://backend/models/database.py#L25-L41)
- [portfolio.py:16-63](file://backend/models/portfolio.py#L16-L63)
- [alert.py:14-77](file://backend/models/alert.py#L14-L77)
- [article.py:15-63](file://backend/models/article.py#L15-L63)
- [portfolio.py:50-123](file://backend/routers/portfolio.py#L50-L123)
- [alerts.py:22-83](file://backend/routers/alerts.py#L22-L83)
- [articles.py:78-185](file://backend/routers/articles.py#L78-L185)
- [agent.py:39-242](file://backend/routers/agent.py#L39-L242)
- [graph.py:162-203](file://backend/agent/graph.py#L162-L203)

**Section sources**
- [main.py:32-35](file://backend/main.py#L32-L35)
- [database.py:25-41](file://backend/models/database.py#L25-L41)

## Core Components
- Engine and sessions
  - Centralized engine creation with DATABASE_URL environment variable defaults to a local SQLite file.
  - Session factory configured for autocommit and autoflush disabled.
  - FastAPI dependency provides per-request sessions and ensures closure.
- Table creation
  - Startup hook invokes metadata creation to ensure all tables exist before serving requests.
- Models
  - Portfolio: stores user portfolio configuration with JSON-based ticker weights and user contact info.
  - Alert: stores risk metrics, delivery flags, reasoning logs, and timestamps.
  - **Article**: stores technical articles/blog posts with comprehensive metadata, content management, and publishing workflow.

**Section sources**
- [database.py:15-22](file://backend/models/database.py#L15-L22)
- [database.py:29-35](file://backend/models/database.py#L29-L35)
- [database.py:38-41](file://backend/models/database.py#L38-L41)
- [portfolio.py:16-63](file://backend/models/portfolio.py#L16-L63)
- [alert.py:14-77](file://backend/models/alert.py#L14-L77)
- [article.py:15-63](file://backend/models/article.py#L15-L63)

## Architecture Overview
The runtime flow for creating tables and managing articles is as follows:

```mermaid
sequenceDiagram
participant App as "FastAPI App"
participant DB as "Database Engine"
participant Base as "SQLAlchemy DeclarativeBase"
participant Port as "Portfolio Model"
participant Al as "Alert Model"
participant Art as "Article Model"
App->>DB : "create_engine(DATABASE_URL)"
App->>Base : "create_all()"
Base->>Port : "metadata.create_all()"
Base->>Al : "metadata.create_all()"
Base->>Art : "metadata.create_all()"
Note over App,DB : "All tables created on startup"
App->>Art : "INSERT Article record"
Art-->>App : "Persisted Article id"
```

**Diagram sources**
- [main.py:32-35](file://backend/main.py#L32-L35)
- [database.py:38-41](file://backend/models/database.py#L38-L41)
- [article.py:15-63](file://backend/models/article.py#L15-L63)

## Detailed Component Analysis

### Database Configuration and Session Management
- Engine setup
  - Reads DATABASE_URL from environment; defaults to SQLite for zero-config development.
  - For SQLite, passes a connection argument to disable thread checks for multi-threaded environments.
- Session factory
  - Autocommit disabled; autoflush disabled; bound to engine.
- Dependency provider
  - Yields a session per request and closes it in a finally block.
- Table creation
  - Called at startup to ensure all models are represented in the database.

```mermaid
flowchart TD
Start(["Startup"]) --> Env["Read DATABASE_URL"]
Env --> IsSQLite{"URL starts with sqlite?"}
IsSQLite --> |Yes| MakeEngine["create_engine(..., connect_args={'check_same_thread': False})"]
IsSQLite --> |No| MakeEngine
MakeEngine --> CreateAll["Base.metadata.create_all()"]
CreateAll --> End(["Ready"])
```

**Diagram sources**
- [database.py:15-22](file://backend/models/database.py#L15-L22)
- [database.py:38-41](file://backend/models/database.py#L38-L41)

**Section sources**
- [database.py:15-22](file://backend/models/database.py#L15-L22)
- [database.py:29-35](file://backend/models/database.py#L29-L35)
- [database.py:38-41](file://backend/models/database.py#L38-L41)
- [main.py:32-35](file://backend/main.py#L32-L35)

### Portfolio Model
- Purpose
  - Stores user-defined portfolios with a human-friendly name, associated user identifier, and JSON-encoded ticker weights.
- Key fields
  - Identifier, name, user_id, tickers stored as JSON, optional user contact, risk threshold, activation flag, timestamps.
- JSON handling
  - Property converts JSON string to dict and setter serializes dict to JSON.
- Indexes
  - Primary key index on id; secondary index on user_id for filtering by user.

```mermaid
erDiagram
PORTFOLIOS {
int id PK
string name
string user_id IK
text tickers_json
string user_email
string user_phone
float risk_threshold
boolean is_active
timestamp created_at
timestamp updated_at
}
```

**Diagram sources**
- [portfolio.py:19-34](file://backend/models/portfolio.py#L19-L34)

**Section sources**
- [portfolio.py:16-63](file://backend/models/portfolio.py#L16-L63)

### Alert Model
- Purpose
  - Persists every alert run with risk metrics, delivery flags, and full reasoning/log for UI.
- Key fields
  - Foreign key to Portfolio, risk metrics, alert delivery flags, recipient addresses, reasoning log, errors log, timestamps.
- JSON handling
  - Property exposes reasoning steps as a list; setter serializes list to JSON.
- Indexes
  - Primary key index on id; secondary index on portfolio_id; secondary index on created_at for chronological queries.

```mermaid
erDiagram
ALERTS {
int id PK
int portfolio_id IK
float risk_score
string risk_level
float sharpe_ratio
float sortino_ratio
float ann_volatility
float max_drawdown
float avg_sentiment
text alert_message
boolean email_sent
boolean sms_sent
string sent_to_email
string sent_to_phone
text reasoning_log
text errors_log
timestamp created_at IK
}
PORTFOLIOS ||--o{ ALERTS : "has many"
```

**Diagram sources**
- [alert.py:17-42](file://backend/models/alert.py#L17-L42)
- [portfolio.py:19-21](file://backend/models/portfolio.py#L19-L21)

**Section sources**
- [alert.py:14-77](file://backend/models/alert.py#L14-L77)

### Article Model
- Purpose
  - Stores technical articles/blog posts with comprehensive metadata, content management, and publishing workflow.
- Key fields
  - Unique identifier, title (up to 300 chars), URL-safe slug (unique), brief summary, raw Markdown content, comma-separated tags, optional cover image URL, author name, publication status flag, estimated read time, timestamps.
- Content management
  - Raw Markdown content stored for rendering with react-markdown.
  - Automatic read time calculation (~200 words per minute).
  - Slug generation and uniqueness enforcement.
- Indexes
  - Primary key index on id; unique index on slug; secondary index on created_at for chronological ordering.

```mermaid
erDiagram
ARTICLES {
int id PK
string title
string slug UK
string summary
text content
string tags
string cover_url
string author
boolean is_published
int read_time
timestamp created_at IK
timestamp updated_at
}
```

**Diagram sources**
- [article.py:18-30](file://backend/models/article.py#L18-L30)

**Section sources**
- [article.py:15-63](file://backend/models/article.py#L15-L63)

### Relationships, Constraints, and Indexing
- Relationship
  - Alerts belong to a Portfolio via portfolio_id foreign key.
  - Articles are independent entities with no foreign key relationships.
- Constraints
  - Primary keys are implicit via SQLAlchemy ORM Column definitions.
  - Not-null constraints are applied on risk_score, risk_level, article title, and content fields.
  - Unique constraint on article slug for URL safety.
- Indexes
  - Primary key indices are implicit.
  - Additional indices declared on user_id (Portfolio), portfolio_id (Alert), created_at (Alert), and slug (Article).

**Section sources**
- [portfolio.py:21](file://backend/models/portfolio.py#L21)
- [alert.py:18](file://backend/models/alert.py#L18)
- [alert.py:42](file://backend/models/alert.py#L42)
- [article.py:18](file://backend/models/article.py#L18)

### Table Creation and Application Startup
- On startup, the application creates all tables defined by the declarative Base.
- The routers import models to ensure their metadata participates in table creation.
- Article model registration ensures proper table creation during startup.

```mermaid
sequenceDiagram
participant Uvicorn as "Uvicorn"
participant App as "FastAPI App"
participant DB as "Database Engine"
participant Base as "SQLAlchemy DeclarativeBase"
Uvicorn->>App : "Load main.py"
App->>DB : "create_engine(...)"
App->>Base : "create_all()"
Note over App,DB : "All tables created including Articles"
```

**Diagram sources**
- [main.py:32-35](file://backend/main.py#L32-L35)
- [database.py:38-41](file://backend/models/database.py#L38-L41)

**Section sources**
- [main.py:32-35](file://backend/main.py#L32-L35)
- [database.py:38-41](file://backend/models/database.py#L38-L41)

### Query Patterns and Transactions
- Portfolio CRUD
  - Listing: orders by created_at descending.
  - Creation: validates weights approximately sum to 1.0; persists and refreshes.
  - Updates: selective field updates; commits and refreshes.
  - Deletion: removes by id.
- Alerts queries
  - Listing: supports portfolio-scoped filtering and pagination via limit.
  - Detail retrieval: returns full reasoning log and errors.
  - Stats aggregation: counts by risk level, delivery flags, average risk score, and latest run.
- Article CRUD
  - Listing: supports published-only filtering with optional draft inclusion via query parameter.
  - Filtering: tag-based filtering and search across title, summary, and tags.
  - Creation: automatic slug generation with uniqueness enforcement, read time calculation.
  - Updates: selective field updates with slug regeneration when title changes.
  - Publishing: toggle endpoint for draft/published status management.
  - Deletion: permanent deletion of articles.
- Transactions
  - Per-request sessions commit or rollback via explicit commit and refresh.
  - Agent writes use a dedicated executor-backed session to avoid blocking async loops.

```mermaid
flowchart TD
A["Portfolio CRUD"] --> L["List: order by created_at desc"]
A --> C["Create: validate weights ≈ 1.0, persist, commit, refresh"]
A --> U["Update: selective fields, commit, refresh"]
A --> D["Delete: remove by id"]
B["Alerts queries"] --> BL["List: filter by portfolio_id, limit"]
B --> BD["Detail: fetch by id"]
B --> BS["Stats: counts, avg, latest"]
C --> T["Transaction: commit/refresh"]
BS --> T
BD --> T
E["Article CRUD"] --> EL["List: filter by published/all, tag, search"]
E --> EC["Create: slugify, unique, calc read time, persist"]
E --> EU["Update: selective fields, regenerate slug if title changes"]
E --> EP["Publish toggle: draft ↔ published"]
E --> ED["Delete: permanent removal"]
EC --> T
EU --> T
EP --> T
ED --> T
```

**Diagram sources**
- [portfolio.py:50-123](file://backend/routers/portfolio.py#L50-L123)
- [alerts.py:22-83](file://backend/routers/alerts.py#L22-L83)
- [articles.py:78-185](file://backend/routers/articles.py#L78-L185)
- [agent.py:171-181](file://backend/routers/agent.py#L171-L181)

**Section sources**
- [portfolio.py:50-123](file://backend/routers/portfolio.py#L50-L123)
- [alerts.py:22-83](file://backend/routers/alerts.py#L22-L83)
- [articles.py:78-185](file://backend/routers/articles.py#L78-L185)
- [agent.py:171-181](file://backend/routers/agent.py#L171-L181)

### Agent Writes Alerts
- The agent computes risk and optionally sends alerts.
- After computation, it constructs an Alert record and persists it.
- For SSE streaming, persistence runs in a thread pool executor to keep the async loop responsive.

```mermaid
sequenceDiagram
participant Client as "Client"
participant Agent as "Agent Router"
participant Graph as "LangGraph"
participant DB as "Database Session"
participant Alert as "Alert Model"
Client->>Agent : "GET /api/agent/stream/{portfolio_id}"
Agent->>Graph : "astream(initial_state)"
Graph-->>Agent : "state deltas (reasoning, metrics)"
Agent->>Alert : "construct Alert record"
Agent->>DB : "add + commit in executor"
DB-->>Agent : "Alert id"
Agent-->>Client : "SSE events + final alert_id"
```

**Diagram sources**
- [agent.py:39-168](file://backend/routers/agent.py#L39-L168)
- [agent.py:171-181](file://backend/routers/agent.py#L171-L181)
- [alert.py:14-77](file://backend/models/alert.py#L14-L77)

**Section sources**
- [agent.py:39-168](file://backend/routers/agent.py#L39-L168)
- [agent.py:171-181](file://backend/routers/agent.py#L171-L181)
- [graph.py:162-203](file://backend/agent/graph.py#L162-L203)

## Dependency Analysis
- Coupling
  - Routers depend on models and the session dependency provider.
  - Agent router depends on the compiled graph and writes to Alert.
  - Article router depends on Article model and provides comprehensive CRUD operations.
- Cohesion
  - Models encapsulate persistence and helper methods.
  - Database module centralizes engine/session concerns.
  - Article model includes content processing utilities.
- External dependencies
  - SQLAlchemy ORM and engine creation.
  - Environment-driven DATABASE_URL.
  - Frontend dependencies for article rendering (react-markdown, remark-gfm).

```mermaid
graph LR
DB["models/database.py"] --> P["models/portfolio.py"]
DB --> A["models/alert.py"]
DB --> ART["models/article.py"]
RP["routers/portfolio.py"] --> DB
RA["routers/alerts.py"] --> DB
RART["routers/articles.py"] --> DB
RG["routers/agent.py"] --> DB
RG --> G["agent/graph.py"]
M["main.py"] --> DB
```

**Diagram sources**
- [database.py:25-41](file://backend/models/database.py#L25-L41)
- [portfolio.py:16-63](file://backend/models/portfolio.py#L16-L63)
- [alert.py:14-77](file://backend/models/alert.py#L14-L77)
- [article.py:15-63](file://backend/models/article.py#L15-L63)
- [portfolio.py:50-123](file://backend/routers/portfolio.py#L50-L123)
- [alerts.py:22-83](file://backend/routers/alerts.py#L22-L83)
- [articles.py:78-185](file://backend/routers/articles.py#L78-L185)
- [agent.py:39-242](file://backend/routers/agent.py#L39-L242)
- [graph.py:162-203](file://backend/agent/graph.py#L162-L203)
- [main.py:32-35](file://backend/main.py#L32-L35)

**Section sources**
- [database.py:25-41](file://backend/models/database.py#L25-L41)
- [portfolio.py:50-123](file://backend/routers/portfolio.py#L50-L123)
- [alerts.py:22-83](file://backend/routers/alerts.py#L22-L83)
- [articles.py:78-185](file://backend/routers/articles.py#L78-L185)
- [agent.py:39-242](file://backend/routers/agent.py#L39-L242)
- [graph.py:162-203](file://backend/agent/graph.py#L162-L203)
- [main.py:32-35](file://backend/main.py#L32-L35)

## Performance Considerations
- Indexing
  - Secondary indexes on user_id (Portfolio), portfolio_id (Alert), created_at (Alert), and slug (Article) support filtering and chronological ordering.
- Query patterns
  - Prefer filtered queries with limits for alert listing and article listing to avoid scanning entire histories.
  - Use selectivity-aware filters (portfolio_id, tags) to reduce result sets.
  - Article search uses contains operations for tag filtering.
- Bulk operations
  - No explicit bulk inserts observed; consider bulk operations for high-volume ingestion scenarios.
- Transaction management
  - Keep transactions short; commit immediately after writes to reduce lock contention.
- Asynchronous writes
  - Executor-based persistence for SSE prevents blocking the async event loop.
- Content processing
  - Article read time calculation is computed on-the-fly; consider caching for frequently accessed articles.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Database URL misconfiguration
  - Ensure DATABASE_URL is set appropriately; defaults to a local SQLite file.
- Table creation failures
  - Verify startup hook executes and that models are imported before metadata creation.
- Session lifecycle
  - Sessions are closed after each request; ensure no long-lived references are kept outside request scope.
- SQLite threading
  - For SQLite, the engine is configured to allow multi-threaded access; avoid sharing sessions across threads.
- Alert persistence errors
  - When streaming, persistence occurs in an executor; errors are surfaced via SSE error events.
- Article slug conflicts
  - Slug generation automatically appends counters to ensure uniqueness; verify slug uniqueness constraints.
- Content rendering issues
  - Article content is stored as raw Markdown; ensure proper rendering with react-markdown and remark-gfm.

**Section sources**
- [database.py:15-22](file://backend/models/database.py#L15-L22)
- [database.py:29-35](file://backend/models/database.py#L29-L35)
- [database.py:38-41](file://backend/models/database.py#L38-L41)
- [agent.py:171-181](file://backend/routers/agent.py#L171-L181)
- [article.py:62-63](file://backend/models/article.py#L62-L63)

## Conclusion
The database layer uses a minimal, pragmatic SQLAlchemy setup with centralized engine/session configuration, declarative models, and startup-driven table creation. The Portfolio, Alert, and Article models capture the essential domain data, with JSON fields enabling flexible ticker storage and reasoning logs, and comprehensive article management capabilities. The Article model provides full CRUD operations with publishing workflow, tag filtering, and content management. Queries leverage indexes and filters to remain efficient, and asynchronous persistence avoids blocking the event stream. Security and migration practices are outlined in the appendices.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Database Security Considerations
- Connection encryption
  - For production PostgreSQL deployments, transport encryption is handled by the database provider; configure DATABASE_URL accordingly.
- Credential management
  - Store credentials in environment variables; avoid committing secrets to version control.
- Access control
  - Restrict database permissions to least privilege; separate read-only accounts for reporting endpoints if needed.

**Section sources**
- [database.py:15-22](file://backend/models/database.py#L15-L22)
- [README.md:86-93](file://README.md#L86-L93)

### Migration Procedures
- Current state
  - Tables are created on startup via metadata creation; no explicit Alembic migrations are present.
- Recommended approach
  - Initialize a migration environment and generate initial revision after confirming schema stability.
  - Use versioned migrations for subsequent schema changes; apply upgrades in deployment pipelines.

**Section sources**
- [database.py:38-41](file://backend/models/database.py#L38-L41)

### Backup and Recovery
- SQLite
  - Back up the SQLite file regularly; restore by replacing the file atomically.
- PostgreSQL
  - Use logical backups (e.g., SQL dumps) and test restores periodically.
- Monitoring
  - Track database connection counts, slow queries, and alert volume; integrate with platform monitoring.

**Section sources**
- [database.py:15-22](file://backend/models/database.py#L15-L22)

### Query Optimization Techniques
- Use indexes on frequently filtered columns (portfolio_id, user_id, created_at, slug).
- Limit result sets for paginated lists; prefer offset-free designs if possible.
- Avoid N+1 selects by eager-loading related data when needed.
- Batch writes for high-throughput ingestion.
- Use contains operations for tag-based filtering in articles.

**Section sources**
- [portfolio.py:21](file://backend/models/portfolio.py#L21)
- [alert.py:18](file://backend/models/alert.py#L18)
- [alert.py:42](file://backend/models/alert.py#L42)
- [article.py:18](file://backend/models/article.py#L18)

### Examples of Complex Queries and Aggregations
- Alerts statistics
  - Count by risk level and delivery flags; compute average risk score across all alerts; retrieve latest run timestamp.
- Portfolio-scoped alert history
  - Filter alerts by portfolio_id and limit results to recent entries.
- Article analytics
  - Filter articles by tag and search criteria; count published vs draft articles; calculate average read time by tag.
- Content management
  - Retrieve articles with content for editing; exclude content for listing views to improve performance.

**Section sources**
- [alerts.py:59-83](file://backend/routers/alerts.py#L59-L83)
- [alerts.py:43-56](file://backend/routers/alerts.py#L43-L56)
- [articles.py:78-185](file://backend/routers/articles.py#L78-L185)