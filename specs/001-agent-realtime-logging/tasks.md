# Tasks: Multi-Agent Realtime Scan Logging & Automated Scan Scheduler

**Input**: Design documents from `/specs/001-agent-realtime-logging/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `- [x] [ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Includes exact file paths for every task

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create backend and frontend folder structure per plan.md in backend/ and frontend/
- [x] T002 [P] Configure environment variables and app config in backend/app/core/config.py
- [x] T003 [P] Setup Vite React dashboard base project in frontend/package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Setup SQLAlchemy async database engine and session factory in backend/app/db/session.py
- [x] T005 [P] Setup Pydantic base configuration and response schemas in backend/app/schemas/scan_log.py
- [x] T006 [P] Initialize SQLite database and seed Admin user account in backend/app/db/init_db.py
- [x] T007 Configure FastAPI main router and CORS middleware in backend/app/main.py

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Multi-Agent Real-time Log Ingestion via WebSocket (Priority: P1) 🎯 MVP

**Goal**: Enable distributed client agents to establish persistent WebSocket connections and stream scan logs in real time.

**Independent Test**: Connect Agent Simulator via `ws://localhost:8000/ws/agent`, stream scan log JSON payloads, and verify DB persistence and real-time WebSocket broadcast.

### Implementation for User Story 1

- [x] T008 [P] [US1] Define Agent entity model in backend/app/models/agent.py
- [x] T009 [P] [US1] Define ScanLog entity model in backend/app/models/scan_log.py
- [x] T010 [US1] Implement Agent WebSocket endpoint `/ws/agent` with Pydantic validation in backend/app/main.py
- [x] T011 [US1] Implement WebSocket broadcast manager for dashboard subscribers in backend/app/main.py
- [x] T012 [P] [US1] Implement Agent simulator script for streaming logs in backend/scripts/agent_simulator.py
- [x] T013 [US1] Write integration test for WebSocket log ingestion in backend/tests/integration/test_agent_ws.py

**Checkpoint**: User Story 1 is fully functional and testable independently (MVP ready!)

---

## Phase 4: User Story 2 - Dedicated Single Admin Web Authentication (Priority: P1)

**Goal**: Protect Web Admin dashboard and REST APIs with single Admin JWT bearer authentication.

**Independent Test**: Post credentials to `/api/v1/auth/login`, verify JWT token issuance, and test rejection of unauthenticated API requests with 401 Unauthorized.

### Implementation for User Story 2

- [x] T014 [P] [US2] Define AdminUser entity model in backend/app/models/admin_user.py
- [x] T015 [P] [US2] Implement JWT token helper and password hashing utilities in backend/app/core/security.py
- [x] T016 [US2] Implement Admin dependency `get_current_admin` in backend/app/api/deps.py
- [x] T017 [US2] Implement Auth login endpoint `/api/v1/auth/login` in backend/app/api/v1/auth.py
- [x] T018 [P] [US2] Implement React Auth hook and Context provider in frontend/src/hooks/useAuth.jsx
- [x] T019 [US2] Create Admin login page component in frontend/src/pages/LoginPage.jsx
- [x] T020 [US2] Write integration test for Auth API in backend/tests/integration/test_auth.py

**Checkpoint**: User Story 2 authentication is complete and protects all API channels.

---

## Phase 5: User Story 3 - Multi-Agent Log Management & Granular Filtering (Priority: P2)

**Goal**: Provide Admin with interactive log list, multi-criterion filtering, search, and detail modal.

**Independent Test**: Query `/api/v1/logs` with combinations of `agent_id`, `severity`, `status`, `scan_type`, and search keywords to verify filtered log responses.

### Implementation for User Story 3

- [x] T021 [P] [US3] Implement Log query API `/api/v1/logs` with filter parameters in backend/app/api/v1/logs.py
- [x] T022 [P] [US3] Implement React custom hook for scan log fetching and filtering in frontend/src/hooks/useScanLogs.js
- [x] T023 [US3] Create Log Filter Bar component in frontend/src/components/logs/LogFilterBar.jsx
- [x] T024 [US3] Create Log Table component with status badges in frontend/src/components/logs/LogTable.jsx
- [x] T025 [US3] Create Log Detail Inspector modal component in frontend/src/components/logs/LogDetailModal.jsx
- [x] T026 [US3] Create Scan Logs Tab container component in frontend/src/components/tabs/ScanLogsTab.jsx
- [x] T027 [US3] Write integration test for Log Filter API in backend/tests/integration/test_logs_api.py

**Checkpoint**: User Story 3 log management and filtering is fully testable.

---

## Phase 6: User Story 4 - Agent Connection Monitoring & Dashboard Summary (Priority: P3)

**Goal**: Track agent connection health (Online/Offline) and display summary threat metric cards.

**Independent Test**: Connect/disconnect agents and verify real-time status updates on summary cards and agent list.

### Implementation for User Story 4

- [x] T028 [P] [US4] Implement Agent summary metrics endpoint `/api/v1/agents/summary` in backend/app/api/v1/agents.py
- [x] T029 [P] [US4] Create Summary Stat Cards component in frontend/src/components/common/StatCards.jsx
- [x] T030 [US4] Create Agent List Sidebar card component in frontend/src/components/agents/AgentListCard.jsx
- [x] T031 [US4] Integrate Top Status Header bar with WebSocket connection indicator in frontend/src/pages/DashboardPage.jsx

**Checkpoint**: User Story 4 provides real-time situational awareness of all endpoints.

---

## Phase 7: User Story 5 - Automated Scan Scheduler & Interactive Visual Widgets (Priority: P2)

**Goal**: Allow Admin to configure periodic scan schedules via interactive frequency tiles, time/date pickers, scope presets, target agents, and scan action modes.

**Independent Test**: Create scan schedule via `/api/v1/schedules`, verify cron generation, DB persistence, and interactive UI widget state changes.

### Implementation for User Story 5

- [x] T032 [P] [US5] Define ScanSchedule entity model in backend/app/models/scan_schedule.py
- [x] T033 [P] [US5] Implement Scan Schedule CRUD endpoints `/api/v1/schedules` in backend/app/api/v1/schedules.py
- [x] T034 [US5] Add Schedule widget CSS rules for frequency tiles, time pickers, and banners in frontend/src/assets/index.css
- [x] T035 [US5] Implement interactive Schedule Scan Tab component with widgets in frontend/src/components/tabs/ScheduleScanTab.jsx
- [x] T036 [US5] Integrate Schedule Scan Tab into 5-tab Left Sidebar Dashboard in frontend/src/pages/DashboardPage.jsx

**Checkpoint**: User Story 5 allows zero-error automated scan scheduling via visual widgets.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Responsive UI fixes, English translations, and production build verification

- [x] T037 Convert navigation to fixed 270px Left Sidebar layout with full English translation in frontend/src/pages/DashboardPage.jsx
- [x] T038 Fix right-edge layout overflow and responsive grid clipping in frontend/src/assets/index.css
- [x] T039 Verify production build with Vite in frontend/ (npm run build)
- [x] T040 Run full backend test suite with Pytest in backend/ (python -m pytest)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (P1 - MVP)**: Starts after Phase 2 completion
- **User Story 2 (P1)**: Starts after Phase 2 completion
- **User Story 3 (P2)**: Starts after US1 + US2 completion
- **User Story 4 (P3)**: Starts after US1 completion
- **User Story 5 (P2)**: Starts after US1 + US2 completion
- **Polish (Phase 8)**: Depends on all user stories complete

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (DB + Base Schemas)
3. Complete Phase 3: User Story 1 (WebSocket Log Ingestion + Agent Simulator)
4. **STOP and VALIDATE**: Test log ingestion via WebSocket independently.

### Incremental Delivery
1. Add User Story 2 (Admin Auth) → Secure Dashboard
2. Add User Story 3 (Log Filtering) → Granular Telemetry View
3. Add User Story 4 (Agent Connection & Summary Stats) → Live Monitoring
4. Add User Story 5 (Automated Scan Scheduler Widgets) → Recurring Threat Audit
5. Final Polish & Build Verification
