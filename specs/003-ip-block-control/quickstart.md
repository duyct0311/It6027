# Quickstart Guide: IP Blocking & Unblocking Command Dispatch

## Testing Implementation

### 1. Launch Backend Server
```powershell
cd backend
uvicorn app.main:app --reload --port 8000
```

### 2. Launch Agent Simulator
```powershell
cd backend
python scripts/agent_simulator.py --agents 3
```

### 3. Submit IP Block Command via REST API
```powershell
curl -X POST http://localhost:8000/api/v1/ip-block `
  -H "Authorization: Bearer <ADMIN_TOKEN>" `
  -H "Content-Type: application/json" `
  -d '{
    "ip_address": "185.220.101.5",
    "action": "BLOCK",
    "target_agents": "ALL",
    "reason": "Malicious Feodo C2 Server IP"
  }'
```

### 4. Verify Agent Reception
Observe the console output of `agent_simulator.py`:
```text
  🚫🚫 [AGENT-3a4f8e12] RECEIVED IP BLOCK COMMAND! Target IP: 185.220.101.5 | Reason: Malicious Feodo C2 Server IP. Enforcing netfilter firewall rule...
```
