# Quickstart Guide: Scan Mode Configuration Distribution

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

### 3. Deploy Scan Mode via API
```powershell
curl -X POST http://localhost:8000/api/v1/scan-mode `
  -H "Authorization: Bearer <ADMIN_TOKEN>" `
  -H "Content-Type: application/json" `
  -d '{
    "mode_name": "Quick Scan",
    "target_paths": ["C:\\Windows\\Temp"],
    "max_file_size_mb": 50,
    "enable_yara": true,
    "enable_ai_heuristics": true,
    "scan_priority": "HIGH",
    "file_extensions_exclude": ".tmp"
  }'
```

### 4. Verify Agent Reception
Observe the console output of `agent_simulator.py`:
```text
⚡⚡ [AGENT-3a4f8e12] RECEIVED SCAN MODE CONFIG PUSH! Mode: Quick Scan (Paths: ['C:\\Windows\\Temp']). Updating scan parameters...
```
