# Quickstart Guide: Multi-Agent Realtime Scan Logging & Admin Auth

**Feature Branch**: `001-agent-realtime-logging`
**Date**: 2026-09-29

## Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: v18 or higher (with `npm` or `pnpm`)
- **Git**

---

## 1. Backend Setup (Python / FastAPI)

1. Navigate to backend directory:
   ```bash
   cd backend
   ```
2. Create and activate Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Initialize database and seed initial Admin user:
   ```bash
   python -m app.db.init_db
   ```
5. Start FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Backend REST API: `http://localhost:8000`  
   Agent WebSocket Endpoint: `ws://localhost:8000/ws/agent`  
   Dashboard WebSocket Feed: `ws://localhost:8000/ws/dashboard`

---

## 2. Frontend Setup (React)

1. Open a new terminal and navigate to frontend directory:
   ```bash
   cd frontend
   ```
2. Install node packages:
   ```bash
   npm install
   ```
3. Start React development server:
   ```bash
   npm run dev
   ```
4. Open browser at `http://localhost:5173`.

---

## 3. Simulated Agent Execution

To test multi-agent real-time log ingestion:

1. Run the agent simulator script from backend directory:
   ```bash
   python scripts/agent_simulator.py --agents 3 --interval 2
   ```
2. Log into Web Dashboard with initial Admin credentials (`admin` / `admin123`).
3. Observe real-time log entries arriving live on the React dashboard feeds via WebSocket!
