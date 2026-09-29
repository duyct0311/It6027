import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.security import decode_access_token
from app.services.broadcast import broadcast_manager

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/dashboard")
async def dashboard_websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., alias="token")
):
    """
    WebSocket feed for authenticated Admin Web Dashboard clients.
    Pushes real-time scan logs and agent status changes.
    """
    payload = decode_access_token(token)
    if not payload:
        logger.warning("Unauthenticated WebSocket connection attempt on /ws/dashboard rejected")
        await websocket.close(code=4001, reason="Unauthorized JWT Token")
        return

    await broadcast_manager.connect_dashboard(websocket)
    try:
        while True:
            # Keep connection open & receive ping/pong messages from client
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        broadcast_manager.disconnect_dashboard(websocket)
    except Exception as e:
        logger.error(f"Error in Dashboard WebSocket stream: {e}")
        broadcast_manager.disconnect_dashboard(websocket)
