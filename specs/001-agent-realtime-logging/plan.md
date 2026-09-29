# Implementation Plan: Multi-Agent Realtime Scan Logging & Automated Scan Scheduler

**Branch**: `001-agent-realtime-logging` | **Date**: 2026-09-29 | **Spec**: [specs/001-agent-realtime-logging/spec.md](spec.md)

**Input**: Feature specification from `/specs/001-agent-realtime-logging/spec.md`

## Summary

Implement a centralized Malware Scan Agent Web Server capable of real-time multi-agent WebSocket telemetry log ingestion, dedicated single Admin web authentication, multi-criterion log filtering, and automated periodic scan scheduling via interactive visual UI widgets.

## Technical Context

**Language/Version**: Python 3.10+ (Backend) & JavaScript/JSX React (Frontend)

**Primary Dependencies**: 
- Backend: FastAPI, Uvicorn, SQLAlchemy, Pydantic, Python-JOSE (JWT), Passlib (Bcrypt), Pytest
- Frontend: React 18, Vite, Lucide-React, Axio

**Storage**: SQLite (`malware_scan.db`) with SQLAlchemy Async Sessions

**Testing**: Pytest for backend API & WebSocket integration tests; Vite build verification for frontend

**Target Platform**: Cross-platform Web Application (Windows/Linux server backend, web browser frontend)

**Project Type**: Decoupled Web Application (FastAPI Backend + React Frontend)

**Performance Goals**: Sub-500ms WebSocket log ingestion & broadcast to Web UI; <1.5s Admin authentication; <2s filtering across 100k records

**Constraints**: Single Admin account security enforcement; Strict Pydantic log validation schema; Fixed left sidebar navigation layout in English

**Scale/Scope**: Support 100+ concurrent WebSocket Agent streams & 5 main Admin feature tabs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **Principle I (Security-First Architecture & Zero-Trust Agent Communication)**: ✅ PASSED. Single Admin JWT authentication enforced on all protected APIs; WebSocket handshake tokens & Pydantic schema validation enabled.
2. **Principle II (Safe Action Modes & Command Dispatch Integrity)**: ✅ PASSED. Scan Action Modes (`DETECTED_ONLY`, `QUARANTINE`, `DELETE`) defined and verified in scan scheduler & mode tabs.
3. **Principle III (Auditability & Immutable Log Management)**: ✅ PASSED. All incoming agent logs and schedule events saved immutably in SQLite database.
4. **Principle IV (Technology Stack & Architectural Separation)**: ✅ PASSED. Clean separation between FastAPI backend REST/WebSocket endpoints and React Web frontend.
5. **Principle V (Test-Driven Security & Automated Verification)**: ✅ PASSED. Backend integration tests (Pytest) & Vite build verification passing 100%.

## Project Structure

### Documentation (this feature)

```text
specs/001-agent-realtime-logging/
├── plan.md              # Implementation Plan (/speckit-plan)
├── research.md          # Technical Research (/speckit-plan Phase 0)
├── data-model.md        # Data Models & Schemas (/speckit-plan Phase 1)
├── quickstart.md        # Developer Quickstart (/speckit-plan Phase 1)
├── contracts/           # API & WebSocket Protocol Contracts (/speckit-plan Phase 1)
│   ├── agent_ws_protocol.json
│   └── rest_api_schemas.json
└── checklists/          # Requirements Quality Checklists
    └── requirements.md
```

### Source Code Structure

```text
backend/
├── app/
│   ├── api/
│   │   ├── deps.py
│   │   └── v1/
│   │       ├── auth.py
│   │       ├── logs.py
│   │       ├── agents.py
│   │       ├── schedules.py
│   │       ├── ioc.py
│   │       ├── scan_mode.py
│   │       └── ip_block.py
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   ├── db/
│   │   ├── session.py
│   │   └── init_db.py
│   ├── models/
│   │   ├── admin_user.py
│   │   ├── agent.py
│   │   ├── scan_log.py
│   │   └── scan_schedule.py
│   ├── schemas/
│   └── main.py
├── scripts/
│   └── agent_simulator.py
└── tests/
    └── integration/

frontend/
├── src/
│   ├── assets/
│   │   └── index.css
│   ├── components/
│   │   ├── common/
│   │   ├── logs/
│   │   └── tabs/
│   │       ├── ScanLogsTab.jsx
│   │       ├── ScheduleScanTab.jsx
│   │       ├── IocUpdateTab.jsx
│   │       ├── ScanModeTab.jsx
│   │       └── IpBlockTab.jsx
│   ├── hooks/
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   └── DashboardPage.jsx
│   └── services/
│       └── api.js
└── package.json
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | Fully compliant with constitution guidelines |
