# Interface Contracts: Scan Mode Configuration Distribution

## 1. REST API Endpoints

### `GET /api/v1/scan-mode`
- **Description**: Retrieve the current active scan mode configuration profile.
- **Auth**: Bearer JWT (Admin).
- **Response 200 OK**:
```json
{
  "id": 1,
  "mode_name": "Quick Scan",
  "target_paths": ["C:\\Windows\\Temp", "C:\\Users\\Public\\Downloads"],
  "max_file_size_mb": 100,
  "enable_yara": true,
  "enable_ai_heuristics": true,
  "scan_priority": "NORMAL",
  "file_extensions_exclude": ".iso,.vhd,.tmp",
  "is_active": true,
  "updated_at": "2026-09-30T10:15:00+00:00"
}
```

---

### `POST /api/v1/scan-mode`
- **Description**: Update and persist active scan mode configuration, and push JSON configuration to connected agents.
- **Auth**: Bearer JWT (Admin).
- **Request Body**:
```json
{
  "mode_name": "Full System Scan",
  "target_paths": ["C:\\", "D:\\"],
  "max_file_size_mb": 250,
  "enable_yara": true,
  "enable_ai_heuristics": true,
  "scan_priority": "HIGH",
  "file_extensions_exclude": ".iso,.vhd"
}
```
- **Response 200 OK**:
```json
{
  "status": "success",
  "config": {
    "id": 2,
    "mode_name": "Full System Scan",
    "target_paths": ["C:\\", "D:\\"],
    "max_file_size_mb": 250,
    "enable_yara": true,
    "enable_ai_heuristics": true,
    "scan_priority": "HIGH",
    "file_extensions_exclude": ".iso,.vhd",
    "is_active": true,
    "updated_at": "2026-09-30T10:18:00+00:00"
  },
  "connected_agents_count": 3,
  "message": "Scan mode updated and pushed to 3 connected agents."
}
```

---

## 2. WebSocket Protocol (`/ws/agent`)

### Server Broadcast to Agent (`SYNC_SCAN_MODE`)
```json
{
  "event": "SYNC_SCAN_MODE",
  "timestamp": "2026-09-30T10:18:00.000000+00:00",
  "data": {
    "action": "SYNC_SCAN_MODE",
    "mode_name": "Full System Scan",
    "target_paths": ["C:\\", "D:\\"],
    "max_file_size_mb": 250,
    "enable_yara": true,
    "enable_ai_heuristics": true,
    "scan_priority": "HIGH",
    "file_extensions_exclude": ".iso,.vhd",
    "pushed_at": "2026-09-30T10:18:00.000000+00:00"
  }
}
```

### Agent Acknowledgment to Server (`ACK_SCAN_MODE_SYNC`)
```json
{
  "event": "ACK_SCAN_MODE_SYNC",
  "agent_id": "3a4f8e12-b91c-4d56-a123-ef8901234567",
  "mode_name": "Full System Scan",
  "status": "SUCCESS",
  "timestamp": "2026-09-30T10:18:00.250000+00:00"
}
```
