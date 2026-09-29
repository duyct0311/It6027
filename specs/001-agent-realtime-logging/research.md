# Phase 0 Research: Multi-Agent Realtime Scan Logging & Admin Auth

**Feature Branch**: `001-agent-realtime-logging`
**Date**: 2026-09-29

## Executive Summary & Technical Architecture Decisions

This research resolves key technical choices for implementing multi-agent real-time malware scan log ingestion over WebSockets, single Admin authentication, and log management UI.

---

## 1. Agent Communication & WebSocket Ingestion Protocol

### Decision: FastAPI Native WebSockets (`fastapi.WebSocket`) + In-Memory Event Hub

- **Rationale**: FastAPI provides built-in, low-latency, asynchronous WebSocket handlers backed by Starlette and `anyio`/`uvicorn`. For agent log ingestion:
  - Agent connects to `wss://server/ws/agent?agent_id=<UUID>&token=<AGENT_SECRET>`
  - Incoming JSON payloads are parsed and validated via Pydantic v2 schemas asynchronously without blocking the event loop.
  - Valid logs are persisted via SQLAlchemy Async engine and dispatched to an in-memory `BroadcastManager` which pushes updates immediately to active Admin web clients connected to `wss://server/ws/dashboard`.
- **Alternatives Considered**:
  - *Socket.IO*: Adds extra client dependency overhead and custom protocol headers; raw WebSockets are cleaner for lightweight Python/Go/C++ agent clients.
  - *HTTP REST Polling*: Rejected due to high latency (>1-3s) and network overhead under multi-agent load.

---

## 2. Admin Authentication & Session Management

### Decision: JWT Token (Bearer Auth in HTTP headers / WebSocket Sec-WebSocket-Protocol or Query Auth) + Bcrypt Hashing

- **Rationale**: Single Admin authentication enforced strictly per Constitution Principle I & User Story 2.
  - Admin logs in at `/api/v1/auth/login` with `username` and `password`.
  - Password verified against `AdminUser` hash stored using `passlib` with `bcrypt`.
  - Server issues a signed JWT access token (`HS256`, 8-hour expiration).
  - Web dashboard includes `Authorization: Bearer <JWT>` for all REST API endpoints, and passes JWT token during WebSocket handshake for protected dashboard feeds.
- **Alternatives Considered**:
  - *Stateful Cookie Sessions*: Harder to use securely with decoupled React frontend and WebSocket initial connection handshakes without CSRF tokens.

---

## 3. Database & Persistence Layer

### Decision: Async SQLAlchemy 2.0 ORM + SQLite (Development) / PostgreSQL (Staging/Production) + Alembic

- **Rationale**: 
  - Async DB driver (`aiosqlite` for local dev, `asyncpg` for production) prevents blocking the FastAPI async event loop during high-volume log writes.
  - Schema includes indexed fields: `agent_id`, `severity`, `status`, `scan_type`, `time` (UTC timestamp) for fast multi-criterion filtering across 100,000+ records.
- **Alternatives Considered**:
  - *MongoDB / Document DB*: Relational model with foreign keys linking `ScanLog` to `Agent` is more structured and fits strict audit requirements better.

---

## 4. Frontend Architecture (React Web Dashboard)

### Decision: React 18 + Vite + Tailwind CSS / Vanilla CSS + React Query / Custom `useWebSocket` Hook

- **Rationale**:
  - React 18 provides component-driven UI rendering with high performance.
  - Custom `useWebSocket` hook with auto-reconnection and event queue maintains real-time UI synchronization without page refreshes.
  - Virtuoso / Virtualized list rendering for log feeds ensuring 60 FPS even when displaying thousands of log items.

---

## 5. Security Gates & Payload Validation

### Decision: Pydantic v2 Strict Model Validation & Malformed Log Quarantine

- **Schema Rules**:
  - `AgentID`: UUID string format.
  - `Module`: Enum or string (`AI`, `YARA`, `Hash`, `Behavior`).
  - `Name`: Non-empty string.
  - `Path`: Normalized file path string (prevents injection / malformed byte sequences).
  - `ScanType`: Enum (`Realtime Protection`, `Manual Scan`, `Scheduled Scan`).
  - `Severity`: Enum (`Low`, `Medium`, `High`, `Critical`).
  - `Status`: Enum (`DETECTED_ONLY`, `QUARANTINED`, `DELETED`).
  - `Time`: ISO 8601 string parsed to UTC datetime.
  - `version`: String (e.g. `"1.0"`).
- **Quarantine Safeguard**: Malformed payloads are saved into `log_quarantine` table with raw payload and error reason without terminating the agent's WebSocket session.
