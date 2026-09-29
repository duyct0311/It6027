# Technical Research & Architecture Decisions

## Research Item 1: Real-time Multi-Agent WebSocket Log Ingestion Architecture
- **Decision**: Implement a FastAPI WebSocket handler at `/ws/agent` utilizing an asynchronous `asyncio.Queue` memory buffer and Pydantic schema validation.
- **Rationale**: 
  - Direct database writes per WebSocket packet can cause SQLite write lock contention during log bursts (e.g. 1,000 logs/sec).
  - An async memory queue flushes logs to SQLite in batch transactions every 100ms or 50 items, keeping response time under 50ms and ensuring realtime Web UI streaming via `/ws/dashboard` broadcast.
- **Alternatives Considered**:
  - *Direct synchronous DB insert per packet*: Rejected due to high risk of DB lock contention and event loop blocking.
  - *External Redis/RabbitMQ queue*: Rejected to keep single-server deployment lightweight and self-contained per technology stack requirements.

## Research Item 2: Admin Authentication & Access Control Security
- **Decision**: OAuth2 Password bearer token authentication using JWT (JSON Web Tokens) with HS256/RS256 signature and bcrypt password hashing.
- **Rationale**:
  - Enforces Principle I (Security-First Architecture) and Principle IV (Architectural Separation between React UI and FastAPI REST APIs).
  - Single Admin account initialized securely on DB bootstrap (`admin` / default hashed password or environment variable override).
  - All protected REST routes and dashboard WebSocket subscriptions enforce JWT verification via FastAPI dependencies.
- **Alternatives Considered**:
  - *Session cookies*: Rejected to maintain stateless REST API design suitable for decoupled React Web UI.

## Research Item 3: Asynchronous Scan Scheduler Engine
- **Decision**: Use an in-memory/DB-backed scheduler loop using `croniter` parsing and SQLite `ScanSchedule` records to evaluate active cron rules every 10 seconds.
- **Rationale**:
  - When a schedule triggers (e.g. `0 2 * * 1`), the server looks up targeted connected WebSocket agents (`target_agents = ALL` or specific `AgentID`) and sends an active JSON command payload: `{"command": "START_SCAN", "scope": s.scan_scope, "mode": s.scan_mode, "schedule_id": s.id}`.
  - Agent receives command, executes background thread scan, and streams results back over WebSocket.
- **Alternatives Considered**:
  - *Celery with Redis*: Rejected for unnecessary infrastructural overhead when SQLite + FastAPI async loop handles scheduled dispatches efficiently.

## Research Item 4: Interactive React Scan Scheduling Widgets
- **Decision**: Render interactive visual tile widgets (Frequency: Hourly/Daily/Weekly/Monthly/Custom), Hour/Minute time pickers, Day-of-Week chip buttons, Day-of-Month selector, Scope presets (`C:\Program Files`, `C:\Users`, `C:\Windows\Temp`, `C:\`, Custom), and Scan Action Mode tiles.
- **Rationale**:
  - Dynamically calculates valid 5-part Cron expressions (e.g. `30 14 * * 1`) and renders an instant human-readable preview banner (e.g., *"Runs Every Monday at 02:30 PM"*).
  - Prevents human syntax errors while preserving full backend cron flexibility.
