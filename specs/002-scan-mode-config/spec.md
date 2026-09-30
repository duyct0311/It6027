# Feature Specification: Scan Mode Configuration Distribution

**Feature Branch**: `002-scan-mode-config`

**Created**: 2026-09-30

**Status**: Draft

**Input**: User description: "hãy tiếp tục với tính năng chế độ quét, lần này sẽ chỉ là admin lựa chọn chế độ quét và server đẩy cấu hình json đó về agent thôi"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Selects and Pushes Scan Mode Config to Connected Agents (Priority: P1)

As a Security Administrator, I want to select a malware scan mode (Quick Scan, Full System Scan, or Custom/Deep Scan) from the Web Admin Dashboard and push that configuration as a JSON payload down to connected agents in real time, so that all active endpoint agents instantly adjust their scanning scope, thread concurrency, file size limits, and heuristics engine parameters.

**Why this priority**: Core functional requirement allowing centralized control over endpoint scanning behavior across all managed agents without requiring manual endpoint reconfiguration.

**Independent Test**: Can be tested by selecting a scan mode in the Web Admin UI, clicking "Save & Push Configuration", and verifying over WebSocket that connected agents receive the matching `SYNC_SCAN_MODE` JSON configuration payload.

**Acceptance Scenarios**:

1. **Given** an authenticated Admin on the Scan Mode Configuration tab, **When** the Admin selects a preset mode (e.g. "Quick Scan" or "Full System Scan") and clicks "Deploy Config to Agents", **Then** the server persists the settings in the database and broadcasts the JSON configuration payload to all active agent WebSocket connections.
2. **Given** connected agents receiving the `SYNC_SCAN_MODE` payload, **When** the payload is parsed by the agent, **Then** the agent updates its internal scan engine rules and sends back an acknowledgment JSON (`ACK_SCAN_MODE_SYNC`) to the server.

---

### User Story 2 - Automatic Scan Mode Sync on Agent Connection (Priority: P2)

As an Endpoint Scan Agent, when I register or reconnect to the Server via WebSocket, I want to automatically receive the latest active Scan Mode JSON configuration from the server, so that I always execute scans using the most up-to-date administrator policies.

**Why this priority**: Guarantees endpoint policy compliance even when agents temporarily lose network connection or reboot.

**Independent Test**: Can be tested by starting a new agent simulator instance while the server is running, and checking that the server immediately pushes the active scan mode configuration payload to the newly connected agent during the WebSocket handshake.

**Acceptance Scenarios**:

1. **Given** a server with an established active scan mode, **When** a new agent connects to `/ws/agent`, **Then** the server immediately transmits the current scan mode JSON configuration frame to the agent upon successful WebSocket connection.

---

### User Story 3 - Admin Dashboard Real-Time Status & Config Preview (Priority: P3)

As a Security Administrator, I want to view a real-time status card on the Web Admin UI showing the currently deployed Scan Mode, parameter summary (target paths, concurrency, max file size, YARA enable state), and last distribution timestamp.

**Why this priority**: Provides clear operational visibility and verification to administrators that configuration policies have been deployed.

**Independent Test**: Can be tested by changing scan mode settings on the UI and verifying that the summary cards and active mode badge update instantly without page reloads.

**Acceptance Scenarios**:

1. **Given** an Admin viewing the Scan Mode tab, **When** a new configuration is deployed, **Then** the UI displays a success banner and updates the active mode summary badge and configuration JSON preview.

---

### Edge Cases

- What happens if an agent disconnects during JSON transmission? The server cleans up the connection gracefully and pushes the latest configuration upon agent reconnection.
- How does the system handle invalid custom configuration values (e.g. negative file size limit or empty scan paths)? The backend API validates schema constraints (Pydantic model) and rejects invalid configuration requests with HTTP 400.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide predefined scan mode profiles: "Quick Scan" (System paths & memory), "Full System Scan" (All local drives), and "Custom / Deep Scan" (User-specified paths & heuristic parameters).
- **FR-002**: System MUST allow Administrators to customize scan configuration fields: `mode_name`, `target_paths`, `max_file_size_mb`, `enable_yara`, `enable_ai_heuristics`, `scan_priority`, and `file_extensions_exclude`.
- **FR-003**: System MUST persist the active scan mode configuration in SQLite database table (`scan_mode_settings`).
- **FR-004**: System MUST push the active Scan Mode JSON payload via WebSocket to all connected agents when updated (`event: "SYNC_SCAN_MODE"`).
- **FR-005**: System MUST transmit the active Scan Mode JSON payload automatically upon new Agent WebSocket handshake.
- **FR-006**: Agent simulator and Agent endpoints MUST handle receiving `SYNC_SCAN_MODE` JSON messages and reply with `ACK_SCAN_MODE_SYNC`.

### Key Entities *(include if feature involves data)*

- **ScanModeSetting**: Represents the centralized scan configuration profile.
  - `id`: Integer Primary Key.
  - `mode_name`: String (Quick, Full, Custom).
  - `target_paths`: String / JSON list (e.g. `["C:\\Windows\\Temp", "C:\\Users"]`).
  - `max_file_size_mb`: Integer (e.g. 50 MB).
  - `enable_yara`: Boolean.
  - `enable_ai_heuristics`: Boolean.
  - `scan_priority`: String (LOW, NORMAL, HIGH).
  - `file_extensions_exclude`: String (e.g. `.iso,.vhd,.tmp`).
  - `is_active`: Boolean.
  - `updated_at`: DateTime.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrators can change and deploy a scan mode configuration in under 3 seconds from the Web UI.
- **SC-002**: 100% of active connected agents receive the JSON configuration broadcast within 1 second of deployment.
- **SC-003**: Newly connected agents receive the active scan mode JSON payload during WebSocket connection handshake within 500ms.

## Assumptions

- Agents consume scan mode configuration as JSON over WebSocket and update internal scan parameters.
- Standard REST endpoint (`POST /api/v1/scan-mode`) and WebSocket broadcast infrastructure (`broadcast_manager`) are utilized.
- UI components use existing React components and design tokens.
