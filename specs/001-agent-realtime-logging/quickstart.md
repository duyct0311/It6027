# Quickstart Guide: Running Server & Agent Simulator

## 1. Backend Setup & Run

### Prerequisites
- Python 3.10+
- Dependencies: `fastapi`, `uvicorn`, `sqlalchemy`, `pydantic`, `python-jose`, `passlib`, `pytest`, `anyio`

### Steps
1. Navigate to backend directory:
   ```bash
   cd backend
   ```
2. Run database initialization script:
   ```bash
   python -m app.db.init_db
   ```
3. Start FastAPI dev server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   API Docs available at: `http://localhost:8000/docs`

---

## 2. Frontend React Admin Console Setup & Run

### Prerequisites
- Node.js 18+ & npm

### Steps
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies & launch Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
3. Open browser at: `http://localhost:5173`
   Login with default admin credentials:
   - Username: `admin`
   - Password: `admin123`

---

## 3. Agent Simulator Run

Simulate multiple client agents sending real-time WebSocket telemetry scan logs:

```bash
python backend/scripts/agent_simulator.py
```

This simulator spawns 3 virtual agents (`Agent-AI-Alpha`, `Agent-YARA-Beta`, `Agent-Heuristic-Gamma`) that connect to `ws://localhost:8000/ws/agent` and stream detection events directly onto the Web Admin Dashboard.
