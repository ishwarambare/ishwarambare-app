# React Application Structure

<cite>
**Referenced Files in This Document**
- [main.jsx](file://frontend/src/main.jsx)
- [App.jsx](file://frontend/src/App.jsx)
- [index.html](file://frontend/index.html)
- [vite.config.js](file://frontend/vite.config.js)
- [package.json](file://frontend/package.json)
- [Navbar.jsx](file://frontend/src/components/Navbar.jsx)
- [Dashboard.jsx](file://frontend/src/pages/Dashboard.jsx)
- [Portfolio.jsx](file://frontend/src/pages/Portfolio.jsx)
- [LiveAgent.jsx](file://frontend/src/pages/LiveAgent.jsx)
- [AlertHistory.jsx](file://frontend/src/pages/AlertHistory.jsx)
- [AgentFeed.jsx](file://frontend/src/components/AgentFeed.jsx)
- [RiskGauge.jsx](file://frontend/src/components/RiskGauge.jsx)
- [PortfolioChart.jsx](file://frontend/src/components/PortfolioChart.jsx)
- [AlertCard.jsx](file://frontend/src/components/AlertCard.jsx)
- [api.js](file://frontend/src/services/api.js)
- [sse.js](file://frontend/src/services/sse.js)
- [index.css](file://frontend/src/index.css)
- [Home.css](file://frontend/src/styles/Home.css)
</cite>

## Update Summary
**Changes Made**
- Updated dependency analysis to reflect enhanced frontend dependencies (axios, date-fns, lucide-react, recharts)
- Added new sections documenting the usage of date-fns for time formatting and lucide-react for iconography
- Enhanced component analysis to include recharts integration for data visualization
- Updated architecture overview to show how new dependencies support alert management and real-time features

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Enhanced Dependency Analysis](#enhanced-dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document explains the React application structure of ishwarambare-app with a focus on the frontend architecture. It covers the root component setup, routing configuration, entry point and Vite build configuration, component composition patterns, and integration with the service layer. The application has been enhanced with modern frontend dependencies including axios for HTTP requests, date-fns for time formatting, lucide-react for consistent iconography, and recharts for sophisticated data visualization. These additions support the alert management system and real-time features that drive the application's core functionality.

## Project Structure
The frontend is organized around a small but cohesive React application with clear separation of concerns and enhanced dependency management:
- Entry point and root component: main.jsx and App.jsx
- Routing: React Router with BrowserRouter and route definitions
- Pages: Dashboard, Portfolio, AlertHistory, LiveAgent
- Shared components: Navbar, AgentFeed, RiskGauge, PortfolioChart, AlertCard
- Services: API client and SSE event stream connector built with axios
- Data visualization: Recharts for charts and gauges
- Time formatting: date-fns for human-readable timestamps
- Iconography: lucide-react for consistent UI icons
- Build tooling: Vite with development server and production optimizations

```mermaid
graph TB
subgraph "Entry Point"
HTML["index.html"]
MAIN["main.jsx"]
end
subgraph "Routing Layer"
APP["App.jsx"]
NAV["Navbar.jsx"]
end
subgraph "Pages"
DASH["Dashboard.jsx"]
PORT["Portfolio.jsx"]
ALERTS["AlertHistory.jsx"]
LIVE["LiveAgent.jsx"]
end
subgraph "Components"
FEED["AgentFeed.jsx"]
GAUGE["RiskGauge.jsx"]
PCHART["PortfolioChart.jsx"]
ACARD["AlertCard.jsx"]
end
subgraph "Services"
API["api.js"]
SSE["sse.js"]
end
subgraph "Enhanced Dependencies"
AXIOS["axios"]
DATEFNS["date-fns"]
LUCIDE["lucide-react"]
RECHARTS["recharts"]
end
HTML --> MAIN
MAIN --> APP
APP --> NAV
APP --> DASH
APP --> PORT
APP --> ALERTS
APP --> LIVE
DASH --> FEED
DASH --> GAUGE
DASH --> PCHART
DASH --> ACARD
PORT --> PCHART
FEED --> SSE
FEED --> API
DASH --> API
PORT --> API
LIVE --> API
API --> AXIOS
ACARD --> DATEFNS
FEED --> LUCIDE
GAUGE --> RECHARTS
PCHART --> RECHARTS
```

**Diagram sources**
- [index.html](file://frontend/index.html)
- [main.jsx](file://frontend/src/main.jsx)
- [App.jsx](file://frontend/src/App.jsx)
- [Navbar.jsx](file://frontend/src/components/Navbar.jsx)
- [Dashboard.jsx](file://frontend/src/pages/Dashboard.jsx)
- [Portfolio.jsx](file://frontend/src/pages/Portfolio.jsx)
- [LiveAgent.jsx](file://frontend/src/pages/LiveAgent.jsx)
- [AlertHistory.jsx](file://frontend/src/pages/AlertHistory.jsx)
- [AgentFeed.jsx](file://frontend/src/components/AgentFeed.jsx)
- [RiskGauge.jsx](file://frontend/src/components/RiskGauge.jsx)
- [PortfolioChart.jsx](file://frontend/src/components/PortfolioChart.jsx)
- [AlertCard.jsx](file://frontend/src/components/AlertCard.jsx)
- [api.js](file://frontend/src/services/api.js)
- [sse.js](file://frontend/src/services/sse.js)
- [package.json](file://frontend/package.json)

**Section sources**
- [index.html](file://frontend/index.html)
- [main.jsx](file://frontend/src/main.jsx)
- [App.jsx](file://frontend/src/App.jsx)
- [package.json](file://frontend/package.json)

## Core Components
This section outlines the primary building blocks of the application and their responsibilities, highlighting the enhanced functionality provided by new dependencies.

- **Root and entry point**
  - main.jsx mounts the root React element and renders the App component inside StrictMode.
  - index.html defines the DOM container and loads the module script.
- **App.jsx**
  - Wraps the app with BrowserRouter and renders Navbar and Routes.
  - Defines routes for Dashboard, Portfolio, AlertHistory, and LiveAgent.
- **Services**
  - api.js creates an Axios client with a base URL derived from environment variables and exposes typed API endpoints for portfolios, agent runs, and alerts.
  - sse.js wraps EventSource to connect to the backend SSE stream for live agent updates.
- **Enhanced Components**
  - AlertCard.jsx uses date-fns for human-readable timestamps and lucide-react for visual indicators.
  - AgentFeed.jsx utilizes lucide-react icons for control buttons and status indicators.
  - RiskGauge.jsx and PortfolioChart.jsx leverage recharts for sophisticated data visualization.

Key implementation references:
- [main.jsx](file://frontend/src/main.jsx)
- [index.html](file://frontend/index.html)
- [App.jsx](file://frontend/src/App.jsx)
- [api.js](file://frontend/src/services/api.js)
- [sse.js](file://frontend/src/services/sse.js)
- [AlertCard.jsx](file://frontend/src/components/AlertCard.jsx)
- [AgentFeed.jsx](file://frontend/src/components/AgentFeed.jsx)
- [RiskGauge.jsx](file://frontend/src/components/RiskGauge.jsx)
- [PortfolioChart.jsx](file://frontend/src/components/PortfolioChart.jsx)

**Section sources**
- [main.jsx](file://frontend/src/main.jsx)
- [index.html](file://frontend/index.html)
- [App.jsx](file://frontend/src/App.jsx)
- [api.js](file://frontend/src/services/api.js)
- [sse.js](file://frontend/src/services/sse.js)
- [AlertCard.jsx](file://frontend/src/components/AlertCard.jsx)
- [AgentFeed.jsx](file://frontend/src/components/AgentFeed.jsx)
- [RiskGauge.jsx](file://frontend/src/components/RiskGauge.jsx)
- [PortfolioChart.jsx](file://frontend/src/components/PortfolioChart.jsx)

## Architecture Overview
The application follows a layered architecture enhanced with modern frontend dependencies:
- **Presentation layer**: React components and pages with enhanced UI using lucide-react icons and recharts visualizations
- **Routing layer**: React Router managing navigation and route rendering
- **Service layer**: Axios client and SSE connector for backend communication
- **Data processing**: date-fns for time formatting and manipulation
- **Visualization layer**: Recharts for complex data displays
- **Backend**: FastAPI endpoints proxied during development via Vite

```mermaid
graph TB
CLIENT["Browser"]
ROUTER["React Router"]
LAYOUT["App.jsx + Navbar.jsx"]
PAGES["Pages<br/>Dashboard.jsx, Portfolio.jsx, LiveAgent.jsx, AlertHistory.jsx"]
COMPONENTS["Enhanced Components<br/>AgentFeed.jsx, RiskGauge.jsx, PortfolioChart.jsx, AlertCard.jsx"]
SERVICES["Services<br/>api.js, sse.js"]
DEPS["Enhanced Dependencies<br/>axios, date-fns, lucide-react, recharts"]
BACKEND["FastAPI Backend"]
CLIENT --> ROUTER
ROUTER --> LAYOUT
LAYOUT --> PAGES
PAGES --> COMPONENTS
COMPONENTS --> SERVICES
COMPONENTS --> DEPS
SERVICES --> BACKEND
DEPS --> SERVICES
```

**Diagram sources**
- [App.jsx](file://frontend/src/App.jsx)
- [Navbar.jsx](file://frontend/src/components/Navbar.jsx)
- [Dashboard.jsx](file://frontend/src/pages/Dashboard.jsx)
- [Portfolio.jsx](file://frontend/src/pages/Portfolio.jsx)
- [LiveAgent.jsx](file://frontend/src/pages/LiveAgent.jsx)
- [AlertHistory.jsx](file://frontend/src/pages/AlertHistory.jsx)
- [AgentFeed.jsx](file://frontend/src/components/AgentFeed.jsx)
- [RiskGauge.jsx](file://frontend/src/components/RiskGauge.jsx)
- [PortfolioChart.jsx](file://frontend/src/components/PortfolioChart.jsx)
- [AlertCard.jsx](file://frontend/src/components/AlertCard.jsx)
- [api.js](file://frontend/src/services/api.js)
- [sse.js](file://frontend/src/services/sse.js)
- [package.json](file://frontend/package.json)

## Detailed Component Analysis

### Routing Configuration
The routing is centralized in App.jsx with BrowserRouter wrapping the entire application. Navbar.jsx provides navigation links that integrate with React Router's NavLink to highlight active routes. The route definitions include:
- "/" -> Dashboard
- "/portfolio" -> Portfolio
- "/alerts" -> AlertHistory
- "/live" -> LiveAgent

```mermaid
sequenceDiagram
participant Browser as "Browser"
participant Router as "BrowserRouter"
participant Routes as "Routes"
participant Nav as "Navbar.jsx"
participant Page as "Selected Page"
Browser->>Router : Load "/"
Router->>Nav : Render Navbar
Router->>Routes : Match path "/"
Routes->>Page : Render Dashboard
Note over Nav,Page : Navigation updates active state via NavLink
```

**Diagram sources**
- [App.jsx](file://frontend/src/App.jsx)
- [Navbar.jsx](file://frontend/src/components/Navbar.jsx)
- [Dashboard.jsx](file://frontend/src/pages/Dashboard.jsx)
- [Portfolio.jsx](file://frontend/src/pages/Portfolio.jsx)
- [LiveAgent.jsx](file://frontend/src/pages/LiveAgent.jsx)
- [AlertHistory.jsx](file://frontend/src/pages/AlertHistory.jsx)

**Section sources**
- [App.jsx](file://frontend/src/App.jsx)
- [Navbar.jsx](file://frontend/src/components/Navbar.jsx)

### Application Initialization and Mounting
The application initializes from index.html, which declares the #root container and loads /src/main.jsx as a module. main.jsx imports React, ReactDOM, the root App component, and global styles, then mounts the app using createRoot inside React.StrictMode.

```mermaid
sequenceDiagram
participant HTML as "index.html"
participant Main as "main.jsx"
participant ReactDOM as "ReactDOM"
participant App as "App.jsx"
HTML->>Main : Load module script
Main->>ReactDOM : createRoot(root)
ReactDOM->>App : render(<App />)
App-->>ReactDOM : Tree rendered
```

**Diagram sources**
- [index.html](file://frontend/index.html)
- [main.jsx](file://frontend/src/main.jsx)
- [App.jsx](file://frontend/src/App.jsx)

**Section sources**
- [index.html](file://frontend/index.html)
- [main.jsx](file://frontend/src/main.jsx)

### Service Layer Integration
The service layer abstracts backend communication with enhanced HTTP capabilities:
- api.js constructs an Axios instance with a configurable base URL, timeout settings, and JSON headers, exposing convenience methods for portfolios, agent runs, and alerts.
- sse.js connects to the SSE endpoint for live agent updates and dispatches events to handlers.

```mermaid
sequenceDiagram
participant Page as "Dashboard.jsx"
participant API as "api.js"
participant Backend as "FastAPI"
Page->>API : portfolioApi.list()
API->>Backend : GET /api/portfolio
Backend-->>API : JSON response
API-->>Page : { data : [...] }
Note over Page,Backend : Similar pattern for alertsApi and agentApi with axios enhancements
```

**Diagram sources**
- [Dashboard.jsx](file://frontend/src/pages/Dashboard.jsx)
- [api.js](file://frontend/src/services/api.js)

**Section sources**
- [api.js](file://frontend/src/services/api.js)
- [Dashboard.jsx](file://frontend/src/pages/Dashboard.jsx)

### Live Agent Streaming
AgentFeed.jsx orchestrates live agent runs with enhanced visual feedback:
- It starts/stops an SSE stream for a selected portfolio using the SSE connector.
- It forwards incoming messages to parent components via callbacks for risk updates and completion.
- It maintains internal state for logs, status, and step count.
- Uses lucide-react icons for intuitive controls and status indicators.

```mermaid
sequenceDiagram
participant Feed as "AgentFeed.jsx"
participant SSE as "sse.js"
participant Backend as "FastAPI SSE"
Feed->>SSE : connectAgentStream(portfolioId, handlers)
SSE->>Backend : EventSource /api/agent/stream/{id}
Backend-->>SSE : onmessage(type : step/risk/alert/done/error)
SSE-->>Feed : Dispatch handler(type, data)
Feed-->>Feed : Update logs, status, risk with enhanced UI
Feed-->>Parent : onRiskUpdate/onDone callbacks
Feed->>SSE : stop() on user action
```

**Diagram sources**
- [AgentFeed.jsx](file://frontend/src/components/AgentFeed.jsx)
- [sse.js](file://frontend/src/services/sse.js)

**Section sources**
- [AgentFeed.jsx](file://frontend/src/components/AgentFeed.jsx)
- [sse.js](file://frontend/src/services/sse.js)

### Dashboard Composition Patterns
Dashboard.jsx demonstrates composition of multiple specialized components with enhanced data visualization:
- Loads portfolios, stats, and recent alerts concurrently using the axios-powered API client.
- Renders a portfolio selector, risk gauge with recharts visualization, agent feed with lucide-react icons, allocation charts, and recent alerts with date-fns formatting.
- Uses shared components like AgentFeed, RiskGauge, PortfolioChart, and AlertCard with enhanced visual feedback.

```mermaid
flowchart TD
Start(["Dashboard mount"]) --> Load["Load portfolios, stats, alerts with axios"]
Load --> HasPortfolios{"Portfolios available?"}
HasPortfolios --> |No| EmptyState["Show empty state"]
HasPortfolios --> |Yes| Render["Render layout grid with enhanced visuals"]
Render --> Selector["Portfolio selector"]
Render --> Feed["AgentFeed (SSE) with lucide-react icons"]
Render --> Gauge["RiskGauge with recharts"]
Render --> Charts["AllocationPie + RiskHistory with recharts"]
Render --> Alerts["Recent AlertCard list with date-fns timestamps"]
Feed --> OnRisk["onRiskUpdate callback"]
Feed --> OnDone["onDone callback"]
OnRisk --> Gauge
OnDone --> Reload["Reload alert history"]
Reload --> Load
```

**Diagram sources**
- [Dashboard.jsx](file://frontend/src/pages/Dashboard.jsx)
- [AgentFeed.jsx](file://frontend/src/components/AgentFeed.jsx)
- [RiskGauge.jsx](file://frontend/src/components/RiskGauge.jsx)
- [PortfolioChart.jsx](file://frontend/src/components/PortfolioChart.jsx)
- [AlertCard.jsx](file://frontend/src/components/AlertCard.jsx)
- [api.js](file://frontend/src/services/api.js)

**Section sources**
- [Dashboard.jsx](file://frontend/src/pages/Dashboard.jsx)

### Portfolio Management
Portfolio.jsx provides CRUD operations for portfolios with enhanced user experience:
- Inline ticker/weight editor with live validation ensuring weights sum to 100%.
- Preset templates for quick creation.
- Toast notifications for user feedback.
- Integration with portfolioApi for list, create, update, and delete using axios.

```mermaid
flowchart TD
Init(["Portfolio page mount"]) --> Load["Load portfolios with axios"]
Load --> Editing{"Editing state?"}
Editing --> |No| List["Display portfolio cards"]
Editing --> |Yes| Form["PortfolioForm with TickerEditor"]
Form --> Submit{"Submit?"}
Submit --> |Create| Create["portfolioApi.create with axios"]
Submit --> |Update| Update["portfolioApi.update with axios"]
Create --> Toast["Show success toast"]
Update --> Toast
Toast --> Reload["Reload list"]
Reload --> Load
```

**Diagram sources**
- [Portfolio.jsx](file://frontend/src/pages/Portfolio.jsx)
- [api.js](file://frontend/src/services/api.js)

**Section sources**
- [Portfolio.jsx](file://frontend/src/pages/Portfolio.jsx)

### Live Agent Page
LiveAgent.jsx offers a dedicated full-screen experience with enhanced real-time visualization:
- Selects a portfolio and streams agent reasoning in real time with lucide-react icons.
- Displays a live risk gauge synchronized with SSE events using recharts for sophisticated visualization.

```mermaid
sequenceDiagram
participant Live as "LiveAgent.jsx"
participant API as "api.js"
participant Feed as "AgentFeed.jsx"
participant Gauge as "RiskGauge.jsx"
Live->>API : portfolioApi.list()
API-->>Live : Portfolios with axios
Live->>Feed : Start stream with portfolioId
Feed-->>Live : onRiskUpdate(data) with lucide-react icons
Live->>Gauge : Update riskScore/riskLevel/metrics with recharts
Feed-->>Live : onDone()
Live-->>API : Optional reload (not used here)
```

**Diagram sources**
- [LiveAgent.jsx](file://frontend/src/pages/LiveAgent.jsx)
- [AgentFeed.jsx](file://frontend/src/components/AgentFeed.jsx)
- [RiskGauge.jsx](file://frontend/src/components/RiskGauge.jsx)
- [api.js](file://frontend/src/services/api.js)

**Section sources**
- [LiveAgent.jsx](file://frontend/src/pages/LiveAgent.jsx)

## Enhanced Dependency Analysis
The application relies on a carefully selected set of modern frontend dependencies that enhance functionality and user experience:

### Core Libraries
- **React and ReactDOM**: Foundation for component-based UI
- **react-router-dom**: Declarative routing with navigation support
- **axios**: HTTP client with request/response interceptors and timeout handling
- **date-fns**: Modern date utility library for human-readable time formatting
- **lucide-react**: Consistent icon set for UI elements and status indicators
- **recharts**: Advanced charting library for financial data visualization

### Build and Development Tooling
- **Vite**: Lightning-fast development server with hot module replacement
- **@vitejs/plugin-react**: Optimized React development experience
- **@types/react**: TypeScript definitions for React ecosystem

### Dependency Usage Patterns
- **axios**: Centralized HTTP client with environment-based base URL configuration
- **date-fns**: Human-readable timestamp formatting in AlertCard component
- **lucide-react**: Consistent iconography across AgentFeed, AlertCard, and other components
- **recharts**: Sophisticated data visualization in RiskGauge and PortfolioChart components

```mermaid
graph LR
React["react"] --> App["App.jsx"]
ReactDOM["react-dom"] --> Main["main.jsx"]
Router["react-router-dom"] --> App
Axios["axios"] --> API["api.js"]
DateFns["date-fns"] --> AlertCard["AlertCard.jsx"]
Lucide["lucide-react"] --> AgentFeed["AgentFeed.jsx"]
Lucide --> AlertCard
Lucide --> RiskGauge["RiskGauge.jsx"]
Recharts["recharts"] --> RiskGauge
Recharts --> PortfolioChart["PortfolioChart.jsx"]
Vite["vite"] --> Config["vite.config.js"]
DevDeps["@vitejs/plugin-react"] --> Config
```

**Diagram sources**
- [package.json](file://frontend/package.json)
- [vite.config.js](file://frontend/vite.config.js)
- [App.jsx](file://frontend/src/App.jsx)
- [main.jsx](file://frontend/src/main.jsx)
- [api.js](file://frontend/src/services/api.js)
- [AlertCard.jsx](file://frontend/src/components/AlertCard.jsx)
- [AgentFeed.jsx](file://frontend/src/components/AgentFeed.jsx)
- [RiskGauge.jsx](file://frontend/src/components/RiskGauge.jsx)
- [PortfolioChart.jsx](file://frontend/src/components/PortfolioChart.jsx)

**Section sources**
- [package.json](file://frontend/package.json)
- [vite.config.js](file://frontend/vite.config.js)

## Performance Considerations
- **Concurrent data loading**: Dashboard.jsx uses Promise.all to fetch portfolios, stats, and recent alerts, reducing total load time with axios optimization.
- **Efficient rendering**: Components use minimal state and rely on props/events to communicate, keeping re-renders predictable.
- **Advanced charting**: Recharts is used selectively to avoid heavy computations in render paths, with sophisticated data visualization only when needed.
- **Icon performance**: lucide-react icons are tree-shaken and only imported as needed, minimizing bundle size.
- **Time formatting**: date-fns provides efficient time calculations without heavy moment.js dependencies.
- **Build optimizations**: Vite config disables source maps in production and sets a production output directory.

## Troubleshooting Guide
Common issues and resolutions:
- **API proxy not working in development**
  - Ensure the Vite server proxy targets the correct backend host and port.
  - Verify that the backend is running and reachable at the configured target.
  - Reference: [vite.config.js](file://frontend/vite.config.js)
- **Environment variables not applied**
  - Confirm VITE_API_URL is set in the development environment or defaults are acceptable.
  - Reference: [api.js](file://frontend/src/services/api.js)
- **SSE connection errors**
  - The SSE connector handles errors and closes the stream; check backend SSE endpoint availability.
  - Reference: [sse.js](file://frontend/src/services/sse.js)
- **Missing root container**
  - Ensure index.html contains a div with id="root".
  - Reference: [index.html](file://frontend/index.html)
- **Chart rendering issues**
  - Ensure recharts dependencies are properly installed and compatible with React version.
  - Reference: [RiskGauge.jsx](file://frontend/src/components/RiskGauge.jsx), [PortfolioChart.jsx](file://frontend/src/components/PortfolioChart.jsx)
- **Icon display problems**
  - Verify lucide-react is properly imported and the specific icon names match the component usage.
  - Reference: [AgentFeed.jsx](file://frontend/src/components/AgentFeed.jsx), [AlertCard.jsx](file://frontend/src/components/AlertCard.jsx)
- **Date formatting errors**
  - Check that date-fns is properly imported and the date format matches the expected input.
  - Reference: [AlertCard.jsx](file://frontend/src/components/AlertCard.jsx)

**Section sources**
- [vite.config.js](file://frontend/vite.config.js)
- [api.js](file://frontend/src/services/api.js)
- [sse.js](file://frontend/src/services/sse.js)
- [index.html](file://frontend/index.html)
- [RiskGauge.jsx](file://frontend/src/components/RiskGauge.jsx)
- [PortfolioChart.jsx](file://frontend/src/components/PortfolioChart.jsx)
- [AgentFeed.jsx](file://frontend/src/components/AgentFeed.jsx)
- [AlertCard.jsx](file://frontend/src/components/AlertCard.jsx)

## Conclusion
The frontend architecture of ishwarambare-app has been significantly enhanced with modern dependencies that improve functionality, user experience, and maintainability. The integration of axios provides robust HTTP communication, date-fns enables human-readable time formatting, lucide-react ensures consistent iconography, and recharts delivers sophisticated data visualization. React Router continues to provide clean navigation, while the enhanced component composition patterns emphasize reusable UI elements and clear data flow. Vite streamlines development with hot module replacement and convenient proxy setup, supporting the overall architecture's focus on real-time features and alert management systems.

## Appendices

### Build and Development Workflow
- **Development server**
  - Starts Vite dev server on the configured port with proxy rules for API traffic.
  - Enables hot module replacement for fast iteration.
- **Production build**
  - Generates optimized bundles under the dist directory with source maps disabled.
- **Environment variables**
  - Base API URL is read from VITE_API_URL; defaults to localhost when undefined.
- **Dependency management**
  - All enhanced dependencies are managed through npm/yarn with specific version constraints.
  - Development dependencies include TypeScript definitions and React plugin for optimal DX.

**Section sources**
- [vite.config.js](file://frontend/vite.config.js)
- [package.json](file://frontend/package.json)
- [api.js](file://frontend/src/services/api.js)