# Technical Research & Architecture Decisions

## Research Item 1: Real-time Multi-Agent WebSocket Log Ingestion Architecture
- **Decision**: Implement a FastAPI WebSocket handler at `/ws/agent` utilizing an asynchronous `asyncio.Queue` memory buffer and Pydantic schema validation.
- **Rationale**: 
  - Direct database writes per WebSocket packet can cause SQLite write lock contention during log bursts (e.g. 1,000 logs/sec).
  - An async memory queue flushes logs to SQLite in batch transactions every 100ms or 50 items, keeping response time under 50ms and ensuring realtime Web UI streaming via `/ws/dashboard` broadcast.
- **Alternatives Considered**:
  - *Direct synchronous DB insert per packet*: Rejected due to high risk of DB lock contention and event loop blocking.

## Research Item 2: Admin Authentication & Access Control Security
- **Decision**: OAuth2 Password bearer token authentication using JWT (JSON Web Tokens) with HS256/RS256 signature and bcrypt password hashing.
- **Rationale**:
  - Enforces Principle I (Security-First Architecture) and Principle IV (Architectural Separation between React UI and FastAPI REST APIs).
  - Single Admin account initialized securely on DB bootstrap (`admin` / default hashed password or environment variable override).

## Research Item 3: Asynchronous Scan Scheduler Engine
- **Decision**: Use an in-memory/DB-backed scheduler loop using `croniter` parsing and SQLite `ScanSchedule` records to evaluate active cron rules every 10 seconds.
- **Rationale**: When a schedule triggers (e.g. `0 2 * * 1`), the server looks up targeted connected WebSocket agents (`target_agents = ALL` or specific `AgentID`) and sends an active JSON command payload: `{"command": "START_SCAN", "scope": s.scan_scope, "mode": s.scan_mode, "schedule_id": s.id}`.

## Research Item 4: Interactive React Scan Scheduling Widgets
- **Decision**: Render interactive visual tile widgets (Frequency: Hourly/Daily/Weekly/Monthly/Custom), Hour/Minute time pickers, Day-of-Week chip buttons, Day-of-Month selector, Scope presets (`C:\Program Files`, `C:\Users`, `C:\Windows\Temp`, `C:\`, Custom), and Scan Action Mode tiles.

## Research Item 5: Hybrid Threat Intelligence (TI) IOC Collector & Manual Entry Engine
- **Decision**: 
  - Implement an asynchronous TI Feed Collector Service using `httpx.AsyncClient` that periodically fetches public IOC dumps from **MalwareBazaar** (Hashes), **ThreatFox** (C2 IPs/Hashes), **Feodo Tracker** (Botnet IPs), and **URLhaus** (Malware URLs).
  - Provide a REST API (`POST /api/v1/ioc`) allowing Admin to manually submit custom IOCs with `source = "Manual Admin"`.
  - Enforce automated deduplication on `(value, category)` before persistence.
  - Broadcast new/updated IOC signatures to all connected Agents via WebSocket (`event = UPDATE_IOC`).
- **Rationale**:
  - Leverages 100% free, reliable open-source Threat Intelligence feeds without subscription costs.
  - Combines automated global threat feeds with local custom indicators added manually by security operators.
