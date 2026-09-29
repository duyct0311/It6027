# Data Model: Multi-Agent Realtime Scan Logging & Admin Auth

**Feature Branch**: `001-agent-realtime-logging`
**Date**: 2026-09-29

## Entity Definitions & Schemas

### 1. `AdminUser` Entity

Represents administrative user accounts authorized to access the Web Server.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer / UUID | Primary Key, Auto-increment | Internal unique user ID |
| `username` | String(50) | Unique, Not Null, Index | Admin username for login |
| `password_hash` | String(255) | Not Null | Bcrypt / Argon2 hashed password |
| `role` | String(20) | Default: `"Admin"`, Not Null | User role (`"Admin"`) |
| `last_login_at` | DateTime(UTC) | Nullable | Timestamp of last successful login |
| `created_at` | DateTime(UTC) | Default: UTC Now | Account creation timestamp |

---

### 2. `Agent` Entity

Represents connected or registered malware scanning endpoints.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `agent_id` | String(36) | Primary Key, Index | Unique Agent UUID (e.g. `"0a9582fe-ddbe-1d4b2e1d-1aa8-877458e6"`) |
| `hostname` | String(100) | Nullable | Host computer name |
| `ip_address` | String(45) | Nullable | Agent IP address |
| `status` | String(20) | Default: `"OFFLINE"`, Index | `"ONLINE"` or `"OFFLINE"` |
| `version` | String(20) | Default: `"1.0"` | Agent software version |
| `last_seen_at` | DateTime(UTC) | Not Null, Index | Timestamp of last heartbeat/log activity |
| `created_at` | DateTime(UTC) | Default: UTC Now | Date agent first registered with server |

---

### 3. `ScanLog` Entity

Stores individual malware detection and scan event logs sent by agents.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer / BigInt | Primary Key, Auto-increment | Unique log entry ID |
| `agent_id` | String(36) | Foreign Key (`agents.agent_id`), Index, Not Null | Originating Agent UUID |
| `module` | String(50) | Index, Not Null | Detection engine (`"AI"`, `"YARA"`, `"Hash"`, `"Behavior"`) |
| `name` | String(150) | Index, Not Null | Malware name / rule label (`"AI-Detected Malware"`) |
| `path` | String(500) | Index, Not Null | Target file path (`"C:\\Users\\...\\dll_test.exe"`) |
| `scan_type` | String(50) | Index, Not Null | Type of scan (`"Realtime Protection"`, `"Manual Scan"`, `"Scheduled Scan"`) |
| `severity` | String(20) | Index, Not Null | Threat severity (`"Low"`, `"Medium"`, `"High"`, `"Critical"`) |
| `status` | String(30) | Index, Not Null | Action status (`"DETECTED_ONLY"`, `"QUARANTINED"`, `"DELETED"`) |
| `event_time` | DateTime(UTC) | Index, Not Null | Original timestamp from Agent payload |
| `payload_version` | String(10) | Default: `"1.0"` | Protocol payload version |
| `created_at` | DateTime(UTC) | Default: UTC Now, Index | Server ingestion timestamp |

**Indexes**:
- Composite Index: `(agent_id, event_time DESC)`
- Composite Index: `(severity, status, event_time DESC)`
- Full-text or Partial Index on `path` and `name` for log search queries.

---

### 4. `LogQuarantine` Entity

Stores raw malformed payloads rejected during validation for forensic auditing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | Integer | Primary Key, Auto-increment | Quarantine entry ID |
| `agent_id` | String(36) | Nullable, Index | Agent ID if parseable |
| `raw_payload` | Text | Not Null | Original unparsed JSON text |
| `error_reason` | String(255) | Not Null | Validation error explanation |
| `created_at` | DateTime(UTC) | Default: UTC Now | Ingestion timestamp |
