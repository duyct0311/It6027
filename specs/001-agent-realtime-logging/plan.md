# Implementation Plan: Multi-Agent Realtime Scan Logging & Admin Auth

**Branch**: `001-agent-realtime-logging` | **Date**: 2026-09-29 | **Spec**: [spec.md](file:///d:/Th%E1%BA%A1c%20s%C4%A9/IT6027/server/specs/001-agent-realtime-logging/spec.md)

**Input**: Feature specification from `/specs/001-agent-realtime-logging/spec.md`

## Summary

Build a high-performance, secure malware scan log ingestion system and Admin dashboard.
- **Agent Telemetry & Real-Time Logging**: Expose `ws://server/ws/agent` WebSocket endpoint using Python FastAPI to ingest JSON log payloads from multiple concurrent Agents. Validate incoming schema using Pydantic v2 and persist into relational database with indexes on AgentID, Severity, Status, and Timestamp.
- **Real-Time Dashboard Streaming**: Broadcast incoming scan events instantly to active React web dashboard clients connected via `/ws/dashboard`.
- **Single Admin Authentication**: Protect Web Server APIs and web dashboard routes with JWT Bearer authentication, restricting access strictly to a single authenticated Admin user.
- **Log Management & Multi-Criterion Filtering**: Provide React UI for viewing, grouping by AgentID, searching, and filtering scan logs by Severity, ScanType, Status, Module, and Date range.

## Technical Context

**Language/Version**: Python 3.11+ (Backend), Node.js v18+ / React 18 (Frontend)

**Primary Dependencies**:
- Backend: FastAPI, Uvicorn, WebSockets, Pydantic v2, SQLAlchemy 2.0 (Async), Alembic, PyJWT, Passlib (Bcrypt)
- Frontend: React 18, Vite, React Router v6, Lucide React (Icons), Axios, Tailwind CSS / Custom Modern CSS

**Storage**: SQLite (Async driver `aiosqlite` for local dev) / PostgreSQL (`asyncpg` for production)

**Testing**: Pytest & pytest-asyncio (Backend unit & integration testing), Vitest / React Testing Library (Frontend UI testing)

**Target Platform**: Cross-platform Web Server (Windows / Linux Server), Web Browser (Chrome, Firefox, Edge, Safari)

**Project Type**: Web application (Decoupled Python Backend REST + WebSocket API, React Frontend SPA)

**Performance Goals**:
- Ingest up to 1,000 log events/second across multiple concurrent Agent connections.
- Push real-time log updates from Agent WebSocket to Admin Dashboard UI in <500ms.
- Log filtering queries over 100,000 records return in <2 seconds.

**Constraints**:
- Strict input validation via Pydantic to prevent SQL injection, path traversal, or command injection.
- Unauthenticated requests to protected REST/WS endpoints must be rejected with 401 Unauthorized.
- Malformed payloads must be quarantined without dropping WebSocket sessions.

**Scale/Scope**: Multi-agent support (10 to 1,000+ connected agents), single Admin user role.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I: Security-First Architecture & Zero-Trust Agent Communication**: PASSED. FastAPI backend validates all incoming WebSocket payloads via strict Pydantic schemas. Admin routes protected with JWT token authentication.
- **Principle II: Safe Action Modes & Command Dispatch Integrity**: PASSED. Log schema supports `Status` values (`DETECTED_ONLY`, `QUARANTINED`, `DELETED`).
- **Principle III: Auditability & Immutable Log Management**: PASSED. Scan logs record `AgentID`, `event_time`, file `path`, `severity`, `status`, and `module` with immutable database timestamps. Malformed payloads recorded in `log_quarantine`.
- **Principle IV: Technology Stack & Architectural Separation**: PASSED. Decoupled architecture with Python FastAPI backend and React frontend.
- **Principle V: Test-Driven Security & Automated Verification**: PASSED. Test suites planned for JWT auth, WebSocket parsing, quarantine logic, and API route protection.

## Project Structure

### Documentation (this feature)

```text
specs/001-agent-realtime-logging/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── agent-ws-schema.json
│   ├── admin-api-spec.json
│   └── dashboard-ws-schema.json
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   ├── deps.py               # Dependency injection & JWT auth verifiers
│   │   ├── v1/
│   │   │   ├── auth.py           # Admin login endpoints
│   │   │   ├── logs.py           # Scan log query & filter REST endpoints
│   │   │   └── agents.py         # Agent listing & status endpoints
│   │   └── websockets/
│   │       ├── agent_ws.py       # Agent WebSocket endpoint (/ws/agent)
│   │       └── dashboard_ws.py   # Admin Dashboard WebSocket endpoint (/ws/dashboard)
│   ├── core/
│   │   ├── config.py             # Environment config & secrets
│   │   └── security.py           # Password hashing & JWT token creation/verification
│   ├── db/
│   │   ├── base.py               # SQLAlchemy declarative base
│   │   ├── init_db.py            # Initial DB setup & Admin seed
│   │   └── session.py           # Async DB session factory
│   ├── models/
│   │   ├── admin_user.py         # AdminUser SQLAlchemy model
│   │   ├── agent.py              # Agent SQLAlchemy model
│   │   ├── scan_log.py           # ScanLog SQLAlchemy model
│   │   └── log_quarantine.py     # LogQuarantine SQLAlchemy model
│   ├── schemas/
│   │   ├── auth.py               # Pydantic auth request/response schemas
│   │   ├── scan_log.py           # Pydantic agent log ingestion schema
│   │   └── agent.py              # Pydantic agent status schema
│   ├── services/
│   │   ├── broadcast.py          # WebSocket ConnectionManager & broadcast hub
│   │   ├── log_service.py        # Log ingestion & query business logic
│   │   └── auth_service.py       # Authentication business logic
│   └── main.py                   # FastAPI app entry point
├── scripts/
│   └── agent_simulator.py        # Test agent script for sending live logs over WebSocket
└── tests/
    ├── unit/                     # Pydantic schema & password hashing tests
    └── integration/              # WebSocket & Auth integration tests

frontend/
├── src/
│   ├── assets/                   # Static assets & styles
│   ├── components/
│   │   ├── common/               # UI layout, Header, Sidebar, StatCards
│   │   ├── auth/                 # Admin Login Form
│   │   ├── logs/                 # Log Table, Filter Bar, Log Detail Modal
│   │   └── agents/               # Agent List & Status Cards
│   ├── hooks/
│   │   ├── useAuth.js            # Admin authentication state hook
│   │   ├── useWebSocket.js       # Real-time WebSocket connection hook
│   │   └── useScanLogs.js        # Log fetch & filter data hook
│   ├── pages/
│   │   ├── LoginPage.jsx         # Admin Login Screen
│   │   └── DashboardPage.jsx     # Main Admin Operations Dashboard
│   ├── services/
│   │   ├── api.js                # Axios API client with Bearer auth interceptor
│   │   └── authService.js        # Auth API functions
│   ├── App.jsx                   # React App Router & Protected Routes
│   └── main.jsx                  # React DOM root
├── index.html
├── package.json
└── vite.config.js
```

**Structure Decision**: Web application layout (Option 2: `backend/` Python FastAPI server and `frontend/` React Vite application).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| In-memory Broadcast Hub | Enables zero-latency live updates from agent WS to dashboard WS | Polling DB every second causes unnecessary DB load and latency |
| Dual WebSocket Endpoints | Decouples agent log streaming protocol from admin UI feed | Merging agent and dashboard feeds complicates security & protocol schemas |
