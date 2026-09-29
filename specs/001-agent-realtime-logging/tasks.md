# Tasks: Multi-Agent Realtime Scan Logging & Admin Auth

**Input**: Design documents from `/specs/001-agent-realtime-logging/`

**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/, research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Exact file paths are included in all descriptions.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and directory layout setup

- [ ] T001 Create backend & frontend folder structure per implementation plan (`backend/app`, `frontend/src`)
- [ ] T002 Initialize Python backend dependencies in `backend/requirements.txt`
- [ ] T003 [P] Initialize React frontend project with Vite & dependencies in `frontend/package.json`
- [ ] T004 [P] Configure environment settings module in `backend/app/core/config.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database, security, and broadcast infrastructure required before user stories

**⚠️ CRITICAL**: Must complete before user story implementation

- [ ] T005 Setup async SQLAlchemy database session factory in `backend/app/db/session.py` and base in `backend/app/db/base.py`
- [ ] T006 [P] Implement password hashing and JWT utilities in `backend/app/core/security.py`
- [ ] T007 [P] Create base Pydantic response schemas in `backend/app/schemas/base.py`
- [ ] T008 Implement in-memory WebSocket ConnectionManager & Broadcast Hub in `backend/app/services/broadcast.py`
- [ ] T009 Setup FastAPI application entry point, CORS, and route mounting in `backend/app/main.py`
- [ ] T010 Setup Axios API client with Bearer Auth interceptor in `frontend/src/services/api.js`

**Checkpoint**: Foundation ready - user story implementation can begin in parallel.

---

## Phase 3: User Story 1 - Multi-Agent Real-time Log Ingestion via WebSocket (Priority: P1) 🎯 MVP

**Goal**: Ingest malware scan logs streamed from multiple agents over `/ws/agent`, validate schema, persist to DB, and broadcast live to connected subscribers.

**Independent Test**: Run `python scripts/agent_simulator.py` to stream sample logs via WebSocket, and verify DB insertion & broadcast payload in real time.

- [ ] T011 [P] [US1] Create Agent SQLAlchemy model in `backend/app/models/agent.py`
- [ ] T012 [P] [US1] Create ScanLog and LogQuarantine SQLAlchemy models in `backend/app/models/scan_log.py` and `backend/app/models/log_quarantine.py`
- [ ] T013 [US1] Implement Pydantic Agent log payload validation schema matching `agent-ws-schema.json` in `backend/app/schemas/scan_log.py`
- [ ] T014 [US1] Implement log ingestion business service in `backend/app/services/log_service.py`
- [ ] T015 [US1] Implement Agent WebSocket endpoint `/ws/agent` with stream listener in `backend/app/api/websockets/agent_ws.py`
- [ ] T016 [US1] Create agent simulator script for sending real-time log streams in `backend/scripts/agent_simulator.py`
- [ ] T017 [US1] Write integration test for agent WebSocket log ingestion in `backend/tests/integration/test_agent_ws.py`

**Checkpoint**: At this point, User Story 1 is fully functional and testable as an MVP increment!

---

## Phase 4: User Story 2 - Single Admin Web Authentication (Priority: P1)

**Goal**: Authenticate single Admin user, issue JWT token, and enforce route protection across Web APIs and UI routes.

**Independent Test**: Post credentials to `/api/v1/auth/login`, verify JWT issuance, and confirm HTTP 401 on unauthenticated requests.

- [ ] T018 [P] [US2] Create AdminUser SQLAlchemy model in `backend/app/models/admin_user.py`
- [ ] T019 [P] [US2] Implement Auth request/response Pydantic schemas in `backend/app/schemas/auth.py`
- [ ] T020 [US2] Implement initial DB setup and Admin seed script in `backend/app/db/init_db.py`
- [ ] T021 [US2] Implement JWT auth dependency verifier in `backend/app/api/deps.py`
- [ ] T022 [US2] Implement Admin login REST API endpoint `/api/v1/auth/login` in `backend/app/api/v1/auth.py`
- [ ] T023 [P] [US2] Implement frontend auth state hook in `frontend/src/hooks/useAuth.js` and service in `frontend/src/services/authService.js`
- [ ] T024 [US2] Build Admin Login UI Page component in `frontend/src/pages/LoginPage.jsx`
- [ ] T025 [US2] Implement protected route wrapper in `frontend/src/App.jsx`
- [ ] T026 [US2] Write integration test for Admin Auth flow in `backend/tests/integration/test_auth.py`

**Checkpoint**: At this point, User Stories 1 AND 2 work together with protected Admin access!

---

## Phase 5: User Story 3 - Multi-Agent Log Management & Granular Filtering (Priority: P2)

**Goal**: Web UI and REST APIs for viewing historical scan logs, grouping by AgentID, and multi-criterion filtering.

**Independent Test**: Query `/api/v1/logs` with combinations of `agent_id`, `severity`, `status`, `scan_type`, and `search` keyword to verify dataset filtering.

- [ ] T027 [P] [US3] Implement paginated log query & search logic in `backend/app/services/log_service.py`
- [ ] T028 [US3] Implement log query REST API endpoint `/api/v1/logs` in `backend/app/api/v1/logs.py`
- [ ] T029 [P] [US3] Implement log fetch & filter data hook in `frontend/src/hooks/useScanLogs.js`
- [ ] T030 [P] [US3] Build Log Filter Bar component with dropdowns and search in `frontend/src/components/logs/LogFilterBar.jsx`
- [ ] T031 [US3] Build Log Data Table component with severity badges in `frontend/src/components/logs/LogTable.jsx`
- [ ] T032 [US3] Build Log Detail Modal component in `frontend/src/components/logs/LogDetailModal.jsx`
- [ ] T033 [US3] Write integration test for log query filtering API in `backend/tests/integration/test_logs_api.py`

**Checkpoint**: User Stories 1, 2, and 3 are fully integrated with powerful log exploration capabilities!

---

## Phase 6: User Story 4 - Agent Connection Monitoring & Dashboard Summary (Priority: P3)

**Goal**: Live agent status monitoring, dashboard metrics summary, and Dashboard WebSocket feed.

**Independent Test**: Connect/disconnect agent script and verify real-time Agent Online/Offline status badge updates and summary counts.

- [ ] T034 [P] [US4] Implement Agent status tracking service in `backend/app/services/agent_service.py`
- [ ] T035 [US4] Implement Agent listing REST API endpoint `/api/v1/agents` in `backend/app/api/v1/agents.py`
- [ ] T036 [US4] Implement Admin Dashboard WebSocket endpoint `/ws/dashboard` in `backend/app/api/websockets/dashboard_ws.py`
- [ ] T037 [P] [US4] Implement real-time WebSocket connection hook in `frontend/src/hooks/useWebSocket.js`
- [ ] T038 [P] [US4] Build Dashboard Stat Cards component in `frontend/src/components/common/StatCards.jsx`
- [ ] T039 [P] [US4] Build Agent List Card component in `frontend/src/components/agents/AgentListCard.jsx`
- [ ] T040 [US4] Assemble main Admin Dashboard View page in `frontend/src/pages/DashboardPage.jsx`

**Checkpoint**: All user stories complete with live telemetry streaming and monitoring!

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Security hardening, styling polish, and end-to-end quickstart validation

- [ ] T041 [P] Apply dark mode / glassmorphism modern CSS styling in `frontend/src/assets/index.css`
- [ ] T042 Security hardening: rate limiting on login routes & payload sanitization in `backend/app/main.py`
- [ ] T043 Validate end-to-end quickstart execution following `specs/001-agent-realtime-logging/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion (Phase 2).
- **Polish (Phase 7)**: Depends on all user story phases being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational phase - No dependency on other stories.
- **User Story 2 (P1)**: Can start after Foundational phase - Independent authentication flow.
- **User Story 3 (P2)**: Can start after Foundational phase - Uses log records populated by US1.
- **User Story 4 (P3)**: Can start after Foundational phase - Uses Agent statuses & WS broadcast.

### Parallel Opportunities

- `T003`, `T004` (Setup phase) can run in parallel.
- `T006`, `T007` (Foundational phase) can run in parallel.
- `T011`, `T012` (User Story 1 models) can run in parallel.
- `T018`, `T019`, `T023` (User Story 2 models & frontend hooks) can run in parallel.
- `T029`, `T030` (User Story 3 UI components) can run in parallel.
- `T037`, `T038`, `T039` (User Story 4 components & hooks) can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test agent log ingestion over WebSocket independently using simulator script.

### Incremental Delivery

1. Complete Setup + Foundational -> Core app ready.
2. Complete User Story 1 -> Real-time log ingestion active (MVP!).
3. Complete User Story 2 -> Admin authentication & route security active.
4. Complete User Story 3 -> Historical log management & filtering UI active.
5. Complete User Story 4 -> Live connection dashboard & metric summary active.
