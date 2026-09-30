# Interface Contracts: IP Blocking & Unblocking Command Dispatch

## 1. REST API Endpoints

### `GET /api/v1/ip-block`
- **Description**: Retrieve active and historic IP firewall rules.
- **Auth**: Bearer JWT (Admin).
- **Query Params**: `action` (BLOCK/UNBLOCK), `search` (IP address or reason).
- **Response 200 OK**:
```json
[
  {
    "id": 1,
    "ip_address": "185.220.101.5",
    "action": "BLOCK",
    "target_agents": "ALL",
    "reason": "Malicious Feodo C2 Botnet IP",
    "status": "APPLIED",
    "created_at": "2026-09-30T10:40:00+00:00"
  }
]
```

---

### `POST /api/v1/ip-block`
- **Description**: Submit a new IP block command, persist in database, and push WebSocket payload to agents.
- **Auth**: Bearer JWT (Admin).
- **Request Body**:
```json
{
  "ip_address": "185.220.101.5",
  "action": "BLOCK",
  "target_agents": "ALL",
  "reason": "Malicious C2 Botnet Server IP"
}
```
- **Response 200 OK**:
```json
{
  "status": "success",
  "rule": {
    "id": 1,
    "ip_address": "185.220.101.5",
    "action": "BLOCK",
    "target_agents": "ALL",
    "reason": "Malicious C2 Botnet Server IP",
    "status": "APPLIED",
    "created_at": "2026-09-30T10:45:00+00:00"
  },
  "dispatched_count": 3,
  "message": "Block command for IP '185.220.101.5' dispatched down to 3 connected agent(s)."
}
```

---

### `POST /api/v1/ip-block/unblock`
- **Description**: Submit an IP unblock directive for a target IP address.
- **Auth**: Bearer JWT (Admin).
- **Request Body**:
```json
{
  "ip_address": "185.220.101.5",
  "target_agents": "ALL",
  "reason": "Verified safe false positive"
}
```
- **Response 200 OK**:
```json
{
  "status": "success",
  "dispatched_count": 3,
  "message": "Unblock command for IP '185.220.101.5' dispatched down to 3 connected agent(s)."
}
```

---

## 2. WebSocket Protocol (`/ws/agent`)

### Server Command Dispatch to Windows Agent (`COMMAND_IP_BLOCK` / `COMMAND_IP_UNBLOCK`)
```json
{
  "event": "COMMAND_IP_BLOCK",
  "timestamp": "2026-09-30T10:45:00.000000+00:00",
  "data": {
    "action": "BLOCK",
    "ip_address": "185.220.101.5",
    "command": "netsh advfirewall firewall add rule name=\"MalwareMgr_Block_185.220.101.5\" dir=in action=block remoteip=185.220.101.5",
    "target_agents": "ALL",
    "reason": "Malicious C2 Botnet Server IP",
    "dispatched_at": "2026-09-30T10:45:00.000000+00:00"
  }
}
```

### Agent Acknowledgment to Server (`ACK_IP_BLOCK`)
```json
{
  "event": "ACK_IP_BLOCK",
  "agent_id": "3a4f8e12-b91c-4d56-a123-ef8901234567",
  "ip_address": "185.220.101.5",
  "status": "APPLIED",
  "timestamp": "2026-09-30T10:45:00.250000+00:00"
}
```
