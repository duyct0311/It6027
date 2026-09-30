# Phase 0 Research: Scan Mode Configuration Distribution

## Technical Choices & Rationale

### 1. WebSocket Broadcast Architecture for Scan Mode Config
- **Decision**: Extend `broadcast_manager` in `app/services/broadcast.py` to broadcast event `SYNC_SCAN_MODE` to connected Agent WebSockets (`/ws/agent`) and `UPDATE_SCAN_MODE_STATUS` to Admin Dashboard WebSockets (`/ws/dashboard`).
- **Rationale**: Reuses established WebSocket infrastructure used for real-time log streaming and IOC distribution. Provides real-time config delivery to active endpoints with sub-second latency.
- **Alternatives Considered**: HTTP Polling (High latency and unnecessary load on server).

### 2. Database Model & Persistence Strategy
- **Decision**: Store active and historic scan mode configurations in SQLite database table `scan_mode_settings` using SQLAlchemy 2.0 Async ORM.
- **Rationale**: Maintains persistent record of current active scan mode and admin configuration history across server reboots.
- **Fields**:
  - `id`: Integer Primary Key
  - `mode_name`: String ("Quick Scan", "Full System Scan", "Custom / Deep Scan")
  - `target_paths`: JSON / String list of target directories
  - `max_file_size_mb`: Integer (Default: 100 MB)
  - `enable_yara`: Boolean (Default: True)
  - `enable_ai_heuristics`: Boolean (Default: True)
  - `scan_priority`: String ("LOW", "NORMAL", "HIGH")
  - `file_extensions_exclude`: String (e.g. `".iso,.vhd,.tmp"`)
  - `is_active`: Boolean (Default: True)
  - `updated_at`: DateTime (UTC)

### 3. Agent Connection Handshake Auto-Sync
- **Decision**: When a new Agent connects to `/ws/agent`, `agent_websocket_endpoint` immediately queries the active scan mode setting from DB and transmits `SYNC_SCAN_MODE` JSON payload.
- **Rationale**: Guarantees agents joining or reconnecting after network outages immediately inherit the latest active security policy.

### 4. Agent Simulator & WebSocket Handling
- **Decision**: Update `scripts/agent_simulator.py` to listen for `SYNC_SCAN_MODE` events and reply with `ACK_SCAN_MODE_SYNC`.
- **Rationale**: Validates end-to-end server-to-agent WebSocket push and agent acknowledgment lifecycle.
