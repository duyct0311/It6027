# Implementation Plan: IP Blocking & Unblocking Command Dispatch

**Branch**: `003-ip-block-control` | **Date**: 2026-09-30 | **Spec**: [specs/003-ip-block-control/spec.md](file:///d:/Th%E1%BA%A1c%20s%C4%A9/IT6027/server/specs/003-ip-block-control/spec.md)

**Input**: Feature specification from `/specs/003-ip-block-control/spec.md`

## Summary

Implement centralized IP Blocking & Unblocking Command Dispatch from Web Server down to distributed Agents. Security Administrators issue IP barrier rules on the Web Admin UI, which persists to SQLite (`ip_rules`) and broadcasts `COMMAND_IP_BLOCK` or `COMMAND_IP_UNBLOCK` JSON payloads to targeted Agents via WebSockets. Reconnecting agents auto-sync active IP firewall rules upon WebSocket handshake.

## Technical Context

**Language/Version**: Python 3.14 (FastAPI backend), JavaScript / React (Vite frontend)

**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2, Python `ipaddress` module, Lucide React icons, Axios

**Storage**: SQLite database (`malware_scan.db`), table `ip_rules`

**Testing**: Pytest (Async integration tests), Vitest / React build check

**Target Platform**: Windows / Web Server, WebSocket Clients (Agents)

**Project Type**: Web Application (FastAPI Backend + React Frontend + Distributed Agent Simulator)

**Performance Goals**: Sub-second ( < 1000ms ) command dispatch delivery to all active WebSocket agents upon admin submission

**Constraints**: Strict IP syntax validation, non-blocking WebSocket I/O, zero-downtime policy deployment

**Scale/Scope**: Managed Agents (100+ endpoints)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principle I: Security-First Architecture & Zero-Trust Agent Communication**: REST API enforced with JWT RBAC and Pydantic IP format validation (`ipaddress.ip_address`). WebSocket connections validated with Agent IDs.
- [x] **Principle II: Safe Action Modes & Command Dispatch Integrity**: Firewall commands cleanly isolated (`BLOCK` vs `UNBLOCK`). Commands broadcast with explicit event schemas (`COMMAND_IP_BLOCK`, `COMMAND_IP_UNBLOCK`).
- [x] **Principle III: Auditability & Immutable Log Management**: Network barrier rule additions and deletions logged with timestamp, target IP, reason, and operator ID.
- [x] **Principle IV: Technology Stack & Architectural Separation**: Clean separation between FastAPI REST/WS backend and React frontend.
- [x] **Principle V: Test-Driven Security & Automated Verification**: Integration tests verify API endpoints, database persistence, IP format validation, and WebSocket broadcasting.

## Project Structure

### Documentation (this feature)

```text
specs/003-ip-block-control/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output
    └── ip_block_api.md
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   └── ip_block.py         # REST API endpoints GET/POST /api/v1/ip-block
│   │   └── websockets/
│   │       └── agent_ws.py         # Connection handshake auto-sync & ACK processing
│   ├── models/
│   │   └── ip_rule.py              # SQLAlchemy IpRule model
│   ├── schemas/
│   │   └── ip_rule.py              # Pydantic request/response schemas
│   └── services/
│       ├── broadcast.py            # WebSocket broadcast_to_agents
│       └── ip_block_service.py     # Database persistence & active rule queries
├── scripts/
│   └── agent_simulator.py          # Simulated agent COMMAND_IP_BLOCK listener & ACK reply
└── tests/
    └── integration/
        └── test_ip_block_api.py    # Integration tests for IP block API & sync

frontend/
└── src/
    └── components/
        └── tabs/
            └── IpBlockTab.jsx      # Admin UI tab for IP block/unblock control
```

## Structure Decision

Using Web application structure (`backend/` + `frontend/`) aligned with existing codebase layout.
