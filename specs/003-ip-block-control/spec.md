# Feature Specification: IP Blocking & Unblocking Command Dispatch

**Feature Branch**: `003-ip-block-control`

**Created**: 2026-09-30

**Status**: Draft

**Input**: User description: "hãy tiếp tục với tính năng cuối cùng Gửi lệnh chặn/bỏ chặn IP xuống agent. Agent chuyển lệnh này thành các IOCTL sẵn có của netfilter. Nhưng không quan tâm đến phần agent do chúng ta không làm agent, hãy tập trung vào phần liên quan đến server"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Dispatches IP Blocking Directive to Endpoint Agents (Priority: P1)

As a Security Administrator, I want to submit an IP blocking command from the Web Admin Dashboard specifying the target IP address, target agents (all connected agents or a specific agent), and reason context, so that the server immediately dispatches an IP block command payload down to the targeted endpoint agents via WebSockets.

**Why this priority**: Core network barrier capability enabling immediate containment of active network threats, C2 botnet servers, or malicious external connections.

**Independent Test**: Can be tested by entering a malicious IP address (e.g. `185.220.101.5`) and target agent choice in the Web UI, clicking "Block IP Address", and verifying over WebSocket that targeted connected agents receive the matching `COMMAND_IP_BLOCK` JSON payload.

**Acceptance Scenarios**:

1. **Given** an authenticated Admin on the IP Firewall Control tab, **When** the Admin submits an IP address with action `BLOCK` and target `ALL` agents, **Then** the server persists the IP firewall rule in the database (`ip_rules`) and broadcasts the `COMMAND_IP_BLOCK` JSON command payload to all active agent WebSocket connections.
2. **Given** connected agents receiving the `COMMAND_IP_BLOCK` payload, **When** the agent processes the command, **Then** the agent sends back an acknowledgment JSON (`ACK_IP_BLOCK`) updating the rule status to `APPLIED`.

---

### User Story 2 - Admin Issues IP Unblocking Directive (Priority: P2)

As a Security Administrator, I want to issue an IP unblocking directive for a previously blocked IP address from the Web Admin Dashboard, so that the server dispatches a release command to endpoints to restore normal network communication for false positives or remediated hosts.

**Why this priority**: Crucial for incident remediation and undoing network isolation when IPs are verified safe.

**Independent Test**: Can be tested by clicking "Unblock IP" next to an existing active rule in the Web UI table, and verifying over WebSocket that targeted connected agents receive the `COMMAND_IP_UNBLOCK` JSON payload.

**Acceptance Scenarios**:

1. **Given** an active blocked IP rule in the database, **When** the Admin clicks "Unblock IP", **Then** the server updates the rule action to `UNBLOCK`, persists the update, and transmits `COMMAND_IP_UNBLOCK` via WebSocket to targeted agents.

---

### User Story 3 - Automatic Rule Sync on Agent Connection Handshake (Priority: P3)

As an Endpoint Scan Agent, when I register or reconnect to the Server via WebSocket, I want to automatically receive all active IP blocking rules intended for my agent ID, so that my local netfilter/firewall rules remain in sync with server policy even after network disconnection.

**Why this priority**: Ensures network barrier policy compliance across endpoint reconnections.

**Independent Test**: Can be tested by starting a new agent simulator instance while active IP block rules exist in the database, and checking that the server immediately pushes active `COMMAND_IP_BLOCK` rules during the WebSocket handshake.

**Acceptance Scenarios**:

1. **Given** active IP blocking rules stored on the server, **When** a new agent connects to `/ws/agent`, **Then** the server immediately pushes all active IP block rules to the agent during the WebSocket handshake.

---

### Edge Cases

- What happens if an invalid IP address format (e.g. `999.999.999.999` or arbitrary text) is submitted? The server validates IP address syntax (using Python `ipaddress` library) and rejects invalid formats with HTTP 400.
- How does the system handle duplicate blocking requests for an already blocked IP? The server updates the existing rule record, refreshes its timestamp, and re-broadcasts the command payload to ensure agents enforce the policy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide REST API endpoints (`GET /api/v1/ip-block`, `POST /api/v1/ip-block`, `POST /api/v1/ip-block/unblock`) for managing IP firewall rules.
- **FR-002**: System MUST validate IP address syntax (supporting both IPv4 and IPv6) before persisting.
- **FR-003**: System MUST persist IP firewall rules in SQLite database table (`ip_rules`).
- **FR-004**: System MUST push IP block commands (`COMMAND_IP_BLOCK`) and unblock commands (`COMMAND_IP_UNBLOCK`) via WebSockets to targeted agents (`ALL` or specific `agent_id`).
- **FR-005**: System MUST automatically push all active IP block rules to newly connected agents during WebSocket handshake.
- **FR-006**: System MUST handle agent ACK messages (`ACK_IP_BLOCK` / `ACK_IP_UNBLOCK`) and update rule status in the database.

### Key Entities *(include if feature involves data)*

- **IpRule** (Database Model: `ip_rules`):
  - `id`: Integer Primary Key.
  - `ip_address`: String(45) Not Null.
  - `action`: String(20) Not Null (`BLOCK` / `UNBLOCK`).
  - `target_agents`: String(255) Default `"ALL"`.
  - `reason`: String(255) Nullable.
  - `status`: String(20) Default `"APPLIED"` (`PENDING`, `APPLIED`, `FAILED`).
  - `created_at`: DateTime(UTC).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Administrators can issue an IP block command in under 2 seconds from the Web UI.
- **SC-002**: 100% of targeted connected agents receive the IP block/unblock WebSocket command payload within 1 second of submission.
- **SC-003**: Newly connected agents receive all active IP barrier rules within 500ms of WebSocket connection handshake.

## Assumptions

- Agent software handles translating received WebSocket JSON IP block/unblock payloads into OS netfilter/firewall IOCTL commands.
- Server focuses on command validation, persistence, WebSocket dispatch, handshake sync, and administrative UI management.
