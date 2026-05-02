# Execution Control

<cite>
**Referenced Files in This Document**
- [graph.py](file://backend/agent/graph.py)
- [state.py](file://backend/agent/state.py)
- [run_agent.py](file://backend/agent/run_agent.py)
- [calc_risk.py](file://backend/agent/tools/calc_risk.py)
- [send_alert.py](file://backend/agent/tools/send_alert.py)
- [fetch_news.py](file://backend/agent/tools/fetch_news.py)
- [get_prices.py](file://backend/agent/tools/get_prices.py)
- [agent.py](file://backend/routers/agent.py)
- [main.py](file://backend/main.py)
- [alert.py](file://backend/models/alert.py)
- [portfolio.py](file://backend/models/portfolio.py)
- [database.py](file://backend/models/database.py)
- [sse.js](file://frontend/src/services/sse.js)
- [AgentFeed.jsx](file://frontend/src/components/AgentFeed.jsx)
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
This document explains agent execution control and workflow orchestration for a LangGraph-based portfolio risk analysis agent. It covers the StateGraph assembly process, node registration, edge definitions, and conditional routing logic. It details the four-node workflow architecture with linear processing and conditional branching, the conditional edge implementation using a deterministic risk threshold, and the graph compilation process supporting synchronous invocation and asynchronous streaming. It also documents the standalone agent runner for testing and development, including command-line interface and debugging capabilities, and provides examples of agent execution, state delta streaming for SSE, and error handling strategies. Finally, it addresses performance optimization, memory management, and scalability considerations for concurrent agent executions.

## Project Structure
The execution control system spans backend orchestration, tooling, API endpoints, and frontend streaming. The backend is organized into:
- Agent runtime: StateGraph assembly, state typing, and standalone runner
- Tools: Data ingestion and analytics (news, prices, risk calculation, alert dispatch)
- API: SSE streaming and synchronous execution endpoints
- Models: Database schema for portfolios and alerts
- Frontend: SSE client and UI feed component

```mermaid
graph TB
subgraph "Backend"
AG["Agent Runtime<br/>graph.py, state.py, run_agent.py"]
TOOLS["Tools<br/>fetch_news.py, get_prices.py, calc_risk.py, send_alert.py"]
API["API Router<br/>routers/agent.py"]
MODELS["Models<br/>portfolio.py, alert.py, database.py"]
MAIN["App Entry<br/>main.py"]
end
subgraph "Frontend"
SSE["SSE Client<br/>frontend/src/services/sse.js"]
FEED["Agent Feed UI<br/>frontend/src/components/AgentFeed.jsx"]
end
MAIN --> API
API --> AG
AG --> TOOLS
API --> MODELS
FEED --> SSE
SSE --> API
```

**Diagram sources**
- [graph.py:162-203](file://backend/agent/graph.py#L162-L203)
- [agent.py:39-168](file://backend/routers/agent.py#L39-L168)
- [main.py:38-44](file://backend/main.py#L38-L44)
- [sse.js:21-62](file://frontend/src/services/sse.js#L21-L62)
- [AgentFeed.jsx:28-77](file://frontend/src/components/AgentFeed.jsx#L28-L77)

**Section sources**
- [main.py:12-59](file://backend/main.py#L12-L59)
- [agent.py:1-243](file://backend/routers/agent.py#L1-243)
- [graph.py:162-203](file://backend/agent/graph.py#L162-L203)

## Core Components
- StateGraph assembly and compilation: Defines nodes, edges, and conditional routing; exposes compiled graph for synchronous and streaming execution.
- Typed state: AgentState defines the shared state structure flowing through nodes.
- Toolset: Four tools implement the four-node workflow and alert dispatch.
- API endpoints: SSE streaming and synchronous execution with persistence.
- Standalone runner: CLI-driven execution for testing and development.
- Frontend SSE client: Real-time rendering of agent reasoning and risk metrics.

**Section sources**
- [graph.py:162-203](file://backend/agent/graph.py#L162-L203)
- [state.py:28-58](file://backend/agent/state.py#L28-L58)
- [agent.py:39-168](file://backend/routers/agent.py#L39-L168)
- [run_agent.py:46-93](file://backend/agent/run_agent.py#L46-L93)

## Architecture Overview
The agent follows a deterministic, four-node linear workflow with a conditional branch after risk computation:
- fetch_news → get_prices → calc_risk → [conditional edge] → send_alert → log_and_end
- Conditional edge: if risk_score ≥ threshold, route to send_alert; otherwise route to log_and_end
- Both paths converge to log_and_end and terminate

```mermaid
graph LR
START["START"] --> FN["fetch_news"]
FN --> GP["get_prices"]
GP --> CR["calc_risk"]
CR --> DEC["Decision Edge"]
DEC --> |risk_score ≥ 0.70| SA["send_alert"]
DEC --> |risk_score < 0.70| LE["log_and_end"]
SA --> LE
LE --> END["END"]
```

**Diagram sources**
- [graph.py:173-199](file://backend/agent/graph.py#L173-L199)
- [graph.py:146-155](file://backend/agent/graph.py#L146-L155)

**Section sources**
- [graph.py:6-20](file://backend/agent/graph.py#L6-L20)
- [graph.py:146-155](file://backend/agent/graph.py#L146-L155)

## Detailed Component Analysis

### StateGraph Assembly and Compilation
- Nodes registered: fetch_news, get_prices, calc_risk, send_alert, log_and_end
- Edges:
  - Linear: fetch_news → get_prices → calc_risk
  - Conditional: calc_risk → send_alert or log_and_end based on risk threshold
  - Terminal: send_alert → log_and_end → END
- Compilation: Returns a compiled StateGraph supporting synchronous invoke and streaming astream
- Initial state factory: make_initial_state constructs a clean AgentState with defaults

```mermaid
sequenceDiagram
participant Runner as "Caller"
participant Graph as "StateGraph"
participant Node1 as "node_fetch_news"
participant Node2 as "node_get_prices"
participant Node3 as "node_calc_risk"
participant Cond as "should_send_alert"
participant Node4 as "node_send_alert"
participant Term as "node_log_and_end"
Runner->>Graph : invoke(initial_state)
Graph->>Node1 : run
Node1-->>Graph : partial update
Graph->>Node2 : run
Node2-->>Graph : partial update
Graph->>Node3 : run
Node3-->>Graph : partial update
Graph->>Cond : evaluate risk_score
alt risk_score >= 0.70
Cond-->>Graph : "send_alert"
Graph->>Node4 : run
Node4-->>Graph : partial update
else risk_score < 0.70
Cond-->>Graph : "log_and_end"
end
Graph->>Term : run
Term-->>Runner : final state
```

**Diagram sources**
- [graph.py:162-203](file://backend/agent/graph.py#L162-L203)
- [graph.py:45-140](file://backend/agent/graph.py#L45-L140)
- [graph.py:146-155](file://backend/agent/graph.py#L146-L155)

**Section sources**
- [graph.py:162-203](file://backend/agent/graph.py#L162-L203)
- [graph.py:210-242](file://backend/agent/graph.py#L210-L242)

### Conditional Routing Logic
- Deterministic decision: should_send_alert compares risk_score against a fixed threshold
- Threshold: HIGH_RISK_THRESHOLD = 0.70
- Routes:
  - Yes: send_alert
  - No: log_and_end
- Risk computation integrates sentiment into composite risk score, enabling the decision

```mermaid
flowchart TD
Start(["Enter should_send_alert"]) --> GetScore["Get risk_score from state"]
GetScore --> Check{"risk_score >= 0.70?"}
Check --> |Yes| RouteSA["Return 'send_alert'"]
Check --> |No| RouteLE["Return 'log_and_end'"]
RouteSA --> End(["Exit"])
RouteLE --> End
```

**Diagram sources**
- [graph.py:146-155](file://backend/agent/graph.py#L146-L155)
- [calc_risk.py:222-229](file://backend/agent/tools/calc_risk.py#L222-L229)

**Section sources**
- [graph.py:146-155](file://backend/agent/graph.py#L146-L155)
- [calc_risk.py:50-53](file://backend/agent/tools/calc_risk.py#L50-L53)

### Node Functions and State Updates
- fetch_news: Retrieves headlines, computes average sentiment, appends reasoning steps and errors
- get_prices: Downloads 1-year price history, computes daily returns, appends reasoning steps and errors
- calc_risk: Computes Sharpe, Sortino, volatility, max drawdown, builds composite risk_score, sets risk_level and should_alert, and prepares alert_message
- send_alert: Sends email/SMS when risk level is HIGH, logs steps and errors; operates in mock mode when credentials are missing
- log_and_end: Summarizes run and appends final reasoning steps

```mermaid
classDiagram
class AgentState {
+dict portfolio
+Optional~int~ portfolio_id
+Optional~str~ user_email
+Optional~str~ user_phone
+NewsItem[] news_items
+float avg_sentiment
+dict price_data
+dict daily_returns
+dict risk_metrics
+float risk_score
+str risk_level
+bool should_alert
+str alert_message
+str[] reasoning_steps
+str[] errors
}
class NewsItem {
+str headline
+str source
+str url
+float polarity
+float subjectivity
}
class RiskMetrics {
+float sharpe_ratio
+float sortino_ratio
+float annualised_volatility
+float max_drawdown
+float mean_daily_return
}
AgentState --> NewsItem : "contains"
AgentState --> RiskMetrics : "contains"
```

**Diagram sources**
- [state.py:28-58](file://backend/agent/state.py#L28-L58)

**Section sources**
- [graph.py:45-140](file://backend/agent/graph.py#L45-L140)
- [state.py:28-58](file://backend/agent/state.py#L28-L58)

### Tool Implementations
- fetch_news: Uses NewsAPI or mock headlines; computes avg_sentiment; logs reasoning and errors
- get_prices: Uses yfinance or synthetic data; computes daily_returns; logs reasoning and errors
- calc_risk: Computes portfolio returns, ratios, and composite risk score; determines risk_level and should_alert; integrates avg_sentiment
- send_alert: Builds rich HTML email and SMS body; sends via SendGrid/Twilio or logs in mock mode; records steps and errors

```mermaid
sequenceDiagram
participant Client as "Client"
participant API as "Agent Router"
participant Graph as "StateGraph"
participant Tools as "Tools"
Client->>API : GET /api/agent/stream/{portfolio_id}
API->>Graph : astream(initial_state)
Graph->>Tools : fetch_news()
Tools-->>Graph : partial update
Graph->>Tools : get_prices()
Tools-->>Graph : partial update
Graph->>Tools : calc_risk()
Tools-->>Graph : partial update
Graph->>Tools : send_alert() (conditional)
Tools-->>Graph : partial update
Graph->>Tools : log_and_end()
Tools-->>API : final state
API-->>Client : SSE events
```

**Diagram sources**
- [agent.py:39-168](file://backend/routers/agent.py#L39-L168)
- [graph.py:162-203](file://backend/agent/graph.py#L162-L203)
- [fetch_news.py:98-164](file://backend/agent/tools/fetch_news.py#L98-L164)
- [get_prices.py:84-139](file://backend/agent/tools/get_prices.py#L84-L139)
- [calc_risk.py:149-255](file://backend/agent/tools/calc_risk.py#L149-L255)
- [send_alert.py:157-231](file://backend/agent/tools/send_alert.py#L157-L231)

**Section sources**
- [fetch_news.py:98-164](file://backend/agent/tools/fetch_news.py#L98-L164)
- [get_prices.py:84-139](file://backend/agent/tools/get_prices.py#L84-L139)
- [calc_risk.py:149-255](file://backend/agent/tools/calc_risk.py#L149-L255)
- [send_alert.py:157-231](file://backend/agent/tools/send_alert.py#L157-L231)

### API Endpoints and SSE Streaming
- GET /api/agent/stream/{portfolio_id}: Streams agent reasoning steps, risk metrics, alert trigger, and errors via SSE; persists results to DB
- POST /api/agent/run/{portfolio_id}: Synchronous run returning JSON summary
- GET /api/agent/status: Health check
- SSE event types: start, step, risk, alert, done, error
- DB persistence: Alert ORM model captures risk metrics, delivery status, reasoning steps, and errors

```mermaid
sequenceDiagram
participant FE as "Frontend"
participant SSE as "EventSource"
participant API as "Agent Router"
participant DB as "Database"
FE->>SSE : connect to /api/agent/stream/{id}
SSE->>API : GET /api/agent/stream/{id}
API->>API : load portfolio and user contact
API->>API : make_initial_state()
API->>API : astream(initial_state)
loop for each state delta
API-->>SSE : SSE event (step/risk/alert/error)
SSE-->>FE : render live updates
end
API->>DB : persist Alert with risk metrics and logs
API-->>SSE : SSE event (done)
SSE-->>FE : close connection
```

**Diagram sources**
- [agent.py:39-168](file://backend/routers/agent.py#L39-L168)
- [agent.py:171-182](file://backend/routers/agent.py#L171-L182)
- [alert.py:14-77](file://backend/models/alert.py#L14-L77)

**Section sources**
- [agent.py:39-168](file://backend/routers/agent.py#L39-L168)
- [agent.py:171-182](file://backend/routers/agent.py#L171-L182)
- [alert.py:14-77](file://backend/models/alert.py#L14-L77)

### Standalone Agent Runner
- Purpose: Test and develop agent execution without API dependencies
- CLI: python -m agent.run_agent [portfolio_name]
- Behavior: Creates initial state, streams deltas via astream, prints reasoning steps and errors, and summarizes risk results
- Portfolios: conservative, aggressive, balanced

```mermaid
flowchart TD
Start(["CLI: run_agent"]) --> Parse["Parse portfolio name"]
Parse --> MakeState["make_initial_state()"]
MakeState --> Stream["portfolio_agent.astream(initial_state)"]
Stream --> Loop{"Iterate events"}
Loop --> |new reasoning steps| PrintSteps["Print new reasoning steps"]
Loop --> |risk_score present| PrintRisk["Print risk summary"]
Loop --> |errors present| PrintErr["Print errors"]
Loop --> Next["Next event"]
Next --> Loop
Loop --> Done(["Run complete"])
```

**Diagram sources**
- [run_agent.py:46-93](file://backend/agent/run_agent.py#L46-L93)
- [graph.py:210-242](file://backend/agent/graph.py#L210-L242)

**Section sources**
- [run_agent.py:46-93](file://backend/agent/run_agent.py#L46-L93)

### Frontend SSE Integration
- SSE client: connectAgentStream wraps EventSource, dispatches events to handlers
- UI feed: AgentFeed renders live reasoning steps, risk metrics, alert triggers, and errors; supports start/stop/reset controls

```mermaid
sequenceDiagram
participant FE as "AgentFeed.jsx"
participant SSE as "sse.js"
participant API as "Agent Router"
FE->>SSE : connectAgentStream(portfolioId, handlers)
SSE->>API : new EventSource(url)
API-->>SSE : SSE events (start/step/risk/alert/done/error)
SSE-->>FE : handler callbacks
FE->>FE : update UI state (lines, status, step count)
FE->>SSE : stop() on user action
```

**Diagram sources**
- [AgentFeed.jsx:28-77](file://frontend/src/components/AgentFeed.jsx#L28-L77)
- [sse.js:21-62](file://frontend/src/services/sse.js#L21-L62)

**Section sources**
- [AgentFeed.jsx:28-77](file://frontend/src/components/AgentFeed.jsx#L28-L77)
- [sse.js:21-62](file://frontend/src/services/sse.js#L21-L62)

## Dependency Analysis
- Backend dependencies:
  - FastAPI app includes agent router and initializes DB
  - Agent router depends on StateGraph and models
  - StateGraph depends on tools and state
  - Tools depend on external libraries (yfinance, newsapi, textblob, sendgrid, twilio)
- Frontend depends on SSE client and UI components
- No circular dependencies observed among major modules

```mermaid
graph TB
MAIN["main.py"] --> ROUTER["routers/agent.py"]
ROUTER --> GRAPH["agent/graph.py"]
GRAPH --> STATE["agent/state.py"]
GRAPH --> TOOLS["agent/tools/*"]
ROUTER --> MODELS["models/*"]
FE["frontend/src/services/sse.js"] --> ROUTER
FE2["frontend/src/components/AgentFeed.jsx"] --> FE
```

**Diagram sources**
- [main.py:38-44](file://backend/main.py#L38-L44)
- [agent.py:24-24](file://backend/routers/agent.py#L24-L24)
- [graph.py:28-32](file://backend/agent/graph.py#L28-L32)

**Section sources**
- [main.py:38-44](file://backend/main.py#L38-L44)
- [agent.py:24-24](file://backend/routers/agent.py#L24-L24)
- [graph.py:28-32](file://backend/agent/graph.py#L28-L32)

## Performance Considerations
- Concurrency and scalability:
  - Use separate processes or containers for high concurrency to avoid Python GIL contention
  - Offload DB writes to thread pool executors to keep async loops responsive
  - Limit SSE broadcast fan-out; consider a lightweight pub/sub layer for multiple clients
- Memory management:
  - Keep state deltas minimal; avoid storing large intermediate artifacts unless needed
  - Prefer streaming deltas over buffering entire state in memory
- Network I/O:
  - Batch external API calls where possible (e.g., combine ticker requests)
  - Implement retries with exponential backoff for NewsAPI/yfinance
- CPU-bound tasks:
  - Use vectorized NumPy operations for returns and risk metrics
  - Cache expensive computations (e.g., static risk thresholds) in constants
- Database:
  - Use connection pooling and batch inserts for alert persistence
  - Index frequently queried columns (portfolio_id, created_at)

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- Missing credentials:
  - SendGrid/Twilio: Alerts fall back to logging; verify environment variables and packages
  - NewsAPI/yfinance: Falls back to mock data; verify keys and network connectivity
- SSE disconnects:
  - Client-side: EventSource reconnects automatically; ensure CORS and Nginx buffering headers are set
  - Server-side: Check request.is_disconnected() and handle gracefully
- Risk threshold tuning:
  - Adjust HIGH_RISK_THRESHOLD in graph and tool logic consistently
- Error propagation:
  - Tools append errors to state; SSE emits error events; ensure UI surfaces errors clearly
- DB persistence failures:
  - Save in executor; log exceptions and still emit done event with alert_id=None

**Section sources**
- [send_alert.py:125-155](file://backend/agent/tools/send_alert.py#L125-L155)
- [agent.py:86-89](file://backend/routers/agent.py#L86-L89)
- [agent.py:155-158](file://backend/routers/agent.py#L155-L158)

## Conclusion
The agent execution control system combines a deterministic StateGraph with a modular toolset to deliver a robust, observable, and scalable portfolio risk analysis pipeline. The four-node workflow with conditional routing ensures clear decision logic, while streaming SSE enables real-time UI feedback. The standalone runner and API endpoints support both development and production scenarios. With careful attention to concurrency, memory, and I/O bottlenecks, the system scales to concurrent agent executions and multiple clients.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### API Definitions
- GET /api/agent/stream/{portfolio_id}
  - Description: Server-Sent Events stream of agent reasoning, risk metrics, alert trigger, and errors
  - Response: SSE events (start, step, risk, alert, done, error)
- POST /api/agent/run/{portfolio_id}
  - Description: Synchronous run; returns JSON summary with alert_id, risk_score, risk_level, should_alert, risk_metrics
- GET /api/agent/status
  - Description: Health check

**Section sources**
- [agent.py:39-168](file://backend/routers/agent.py#L39-L168)
- [agent.py:186-232](file://backend/routers/agent.py#L186-L232)
- [agent.py:235-242](file://backend/routers/agent.py#L235-L242)

### Data Models
```mermaid
erDiagram
PORTFOLIO {
int id PK
string name
string user_id
text tickers_json
string user_email
string user_phone
float risk_threshold
boolean is_active
timestamp created_at
timestamp updated_at
}
ALERT {
int id PK
int portfolio_id FK
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
timestamp created_at
}
PORTFOLIO ||--o{ ALERT : "has"
```

**Diagram sources**
- [portfolio.py:16-63](file://backend/models/portfolio.py#L16-L63)
- [alert.py:14-77](file://backend/models/alert.py#L14-L77)

**Section sources**
- [portfolio.py:16-63](file://backend/models/portfolio.py#L16-L63)
- [alert.py:14-77](file://backend/models/alert.py#L14-L77)