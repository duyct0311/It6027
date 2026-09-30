# Phase 0 Research: IP Blocking & Unblocking Command Dispatch

## Technical Choices & Rationale

### 1. WebSocket Command Dispatch Architecture
- **Decision**: Extend `broadcast_manager` in `app/services/broadcast.py` to support targeted command dispatching (`COMMAND_IP_BLOCK`, `COMMAND_IP_UNBLOCK`) to connected Agent WebSockets (`/ws/agent`) and real-time status notifications (`UPDATE_IP_RULE_STATUS`) to Admin Dashboard WebSockets (`/ws/dashboard`).
- **Rationale**: Reuses the established bi-directional WebSocket infrastructure. Supports sending firewall directives either to all agents (`target_agents = "ALL"`) or specific agent IDs.
- **Alternatives Considered**: HTTP Polling (High latency and unfit for emergency network isolation).

### 2. Database Model & Persistence Strategy
- **Decision**: Persist firewall rule commands in SQLite database table `ip_rules` using SQLAlchemy 2.0 Async ORM (`IpRule` model in `app/models/ip_rule.py`).
- **Rationale**: Keeps a complete, immutable audit trail of network barrier history, target IPs, requesting operator, execution timestamps, and agent acknowledgment status.
- **Fields**:
  - `id`: Integer Primary Key
  - `ip_address`: String(45) Indexed (supports IPv4 & IPv6)
  - `action`: String(20) ("BLOCK" or "UNBLOCK")
  - `target_agents`: String(255) ("ALL" or specific agent_id)
  - `reason`: String(255) Nullable context text
  - `status`: String(20) ("APPLIED", "PENDING", "FAILED")
  - `created_at`: DateTime (UTC)

### 3. Connection Handshake Auto-Sync
- **Decision**: Upon new Agent WebSocket registration/reconnect (`/ws/agent`), the server queries all active rules (`action == "BLOCK"`) matching that agent ID or `"ALL"`, and pushes `COMMAND_IP_BLOCK` JSON payloads.
- **Rationale**: Guarantees endpoints re-establishing connectivity immediately inherit active server firewall rules.

### 4. Agent Simulator ACK & Netfilter Simulation
- **Decision**: Update `scripts/agent_simulator.py` to listen for `COMMAND_IP_BLOCK` and `COMMAND_IP_UNBLOCK` payloads and respond with `ACK_IP_BLOCK` / `ACK_IP_UNBLOCK` frames.
- **Rationale**: Simulates endpoint agent receiving commands and translating them into local netfilter IOCTL firewall rules.
