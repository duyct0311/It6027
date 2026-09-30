# Implementation Plan: Scan Mode Configuration Distribution

**Branch**: `002-scan-mode-config` | **Date**: 2026-09-30 | **Spec**: [specs/002-scan-mode-config/spec.md](file:///d:/Th%E1%BA%A1c%20s%C4%A9/IT6027/server/specs/002-scan-mode-config/spec.md)

**Input**: Feature specification from `/specs/002-scan-mode-config/spec.md`

## Summary

Implement centralized Scan Mode Configuration Selection and Real-Time WebSocket JSON Distribution to connected Agents. Administrators select predefined or custom scan parameters (Quick, Full, Custom/Deep Scan) on the Web Admin UI, which persists to SQLite (`scan_mode_settings`) and broadcasts `SYNC_SCAN_MODE` JSON frames to connected Agents via WebSockets. Connected agents auto-sync active configurations upon connection handshake.

## Technical Context

**Language/Version**: Python 3.14 (FastAPI backend), JavaScript / React (Vite frontend)

**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2, Lucide React icons, Axios

**Storage**: SQLite database (`malware_scan.db`), table `scan_mode_settings`

**Testing**: Pytest (Async integration tests), Vitest / React build check

**Target Platform**: Windows / Web Server, WebSocket Clients (Agents)

**Project Type**: Web Application (FastAPI Backend + React Frontend + Distributed Agent Simulator)

**Performance Goals**: Sub-second ( < 1000ms ) broadcast delivery to all active WebSocket agents upon admin save

**Constraints**: Non-blocking WebSocket I/O, zero-downtime policy deployment

**Scale/Scope**: Managed Agents (100+ endpoints)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principle I: Security-First Architecture & Zero-Trust Agent Communication**: REST API enforced with JWT RBAC and Pydantic input validation. WebSocket connections validated with Agent IDs.
- [x] **Principle II: Safe Action Modes & Command Dispatch Integrity**: Scan modes cleanly isolated (Detection, Quarantine, Delete). Commands broadcast with explicit event schemas (`SYNC_SCAN_MODE`).
- [x] **Principle III: Auditability & Immutable Log Management**: Configuration updates logged with timestamp and Admin operator ID.
- [x] **Principle IV: Technology Stack & Architectural Separation**: Clean separation between FastAPI REST/WS backend and React frontend.
- [x] **Principle V: Test-Driven Security & Automated Verification**: Integration tests verify API endpoints, database persistence, and WebSocket broadcasting.

## Project Structure

### Documentation (this feature)

```text
specs/002-scan-mode-config/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
    └── scan_mode_api.md
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   └── scan_mode.py        # REST API endpoints GET/POST /api/v1/scan-mode
│   │   └── websockets/
│   │       └── agent_ws.py         # Connection handshake auto-sync & ACK processing
│   ├── models/
│   │   └── scan_mode.py            # SQLAlchemy ScanModeSetting model
│   ├── schemas/
│   │   └── scan_mode.py            # Pydantic request/response schemas
│   └── services/
│       ├── broadcast.py            # WebSocket broadcast_to_agents
│       └── scan_mode_service.py    # Database persistence & active config loader
├── scripts/
│   └── agent_simulator.py          # Simulated agent SYNC_SCAN_MODE listener & ACK reply
└── tests/
    └── integration/
        └── test_scan_mode_api.py   # Integration tests for scan mode API & sync

frontend/
└── src/
    └── components/
        └── tabs/
            └── ScanModeTab.jsx     # Admin UI tab for preset selection & live status
```

## Structure Decision

Using Web application structure (`backend/` + `frontend/`) aligned with existing codebase layout.
