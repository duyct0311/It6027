import logging
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class BroadcastManager:
    def __init__(self):
        # Active Admin Dashboard WebSockets
        self.dashboard_connections: List[WebSocket] = []
        # Active Agent WebSockets keyed by AgentID
        self.agent_connections: Dict[str, WebSocket] = {}

    async def connect_dashboard(self, websocket: WebSocket):
        await websocket.accept()
        self.dashboard_connections.append(websocket)
        logger.info("Dashboard WebSocket client connected")

    def disconnect_dashboard(self, websocket: WebSocket):
        if websocket in self.dashboard_connections:
            self.dashboard_connections.remove(websocket)
            logger.info("Dashboard WebSocket client disconnected")

    async def connect_agent(self, agent_id: str, websocket: WebSocket):
        await websocket.accept()
        self.agent_connections[agent_id] = websocket
        logger.info(f"Agent WebSocket connected: {agent_id}")

    def disconnect_agent(self, agent_id: str):
        if agent_id in self.agent_connections:
            del self.agent_connections[agent_id]
            logger.info(f"Agent WebSocket disconnected: {agent_id}")

    async def broadcast_to_dashboard(self, event_type: str, data: Dict[str, Any]):
        payload = {
            "event": event_type,
            "data": data,
            "timestamp": data.get("Time") or data.get("event_time")
        }
        
        disconnected = []
        for connection in self.dashboard_connections:
            try:
                await connection.send_json(payload)
            except Exception as e:
                logger.warning(f"Error sending payload to dashboard client: {e}")
                disconnected.append(connection)
                
        for dead_conn in disconnected:
            self.disconnect_dashboard(dead_conn)

broadcast_manager = BroadcastManager()
