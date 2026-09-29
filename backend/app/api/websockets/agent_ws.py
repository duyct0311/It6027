import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.services.broadcast import broadcast_manager
from app.services.log_service import log_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/agent")
async def agent_websocket_endpoint(
    websocket: WebSocket,
    agent_id: str = Query(..., alias="agent_id")
):
    """
    WebSocket endpoint for connected Malware Scanning Agents.
    Agents send real-time JSON scan log payloads continuously.
    """
    client_ip = websocket.client.host if websocket.client else "127.0.0.1"
    await broadcast_manager.connect_agent(agent_id, websocket)
    
    try:
        while True:
            # Wait for incoming text messages from Agent
            data = await websocket.receive_text()
            async with AsyncSessionLocal() as db:
                await log_service.process_incoming_log(
                    db=db,
                    raw_text=data,
                    client_ip=client_ip
                )
    except WebSocketDisconnect:
        logger.info(f"Agent WebSocket disconnected: {agent_id}")
        broadcast_manager.disconnect_agent(agent_id)
    except Exception as e:
        logger.error(f"Error in Agent WebSocket stream [{agent_id}]: {e}")
        broadcast_manager.disconnect_agent(agent_id)
