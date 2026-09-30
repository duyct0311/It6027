import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from datetime import datetime, timezone
from app.db.session import AsyncSessionLocal
from app.services.broadcast import broadcast_manager
from app.services.log_service import log_service
from app.services.scan_mode_service import scan_mode_service
from app.services.ip_block_service import ip_block_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/ws/agent")
async def agent_websocket_endpoint(
    websocket: WebSocket,
    agent_id: str = Query(..., alias="agent_id")
):
    """
    WebSocket endpoint for connected Malware Scanning Agents.
    Agents send real-time JSON scan log payloads continuously and receive IOC rules / Scan Mode / IP Firewall updates.
    """
    client_ip = websocket.client.host if websocket.client else "127.0.0.1"
    await broadcast_manager.connect_agent(agent_id, websocket)

    # 1. Connection Handshake Auto-Sync: Push active scan mode and IP firewall rules to newly connected agent
    try:
        async with AsyncSessionLocal() as db:
            active_mode = await scan_mode_service.get_active_scan_mode(db)
            ws_payload = {
                "event": "SYNC_SCAN_MODE",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": {
                    "action": "SYNC_SCAN_MODE",
                    "mode_name": active_mode["mode_name"],
                    "action_mode": active_mode["action_mode"],
                    "target_paths": active_mode["target_paths"],
                    "max_file_size_mb": active_mode["max_file_size_mb"],
                    "enable_yara": active_mode["enable_yara"],
                    "enable_ai_heuristics": active_mode["enable_ai_heuristics"],
                    "scan_priority": active_mode["scan_priority"],
                    "file_extensions_exclude": active_mode["file_extensions_exclude"],
                    "pushed_at": active_mode["updated_at"]
                }
            }
            await websocket.send_json(ws_payload)

            active_ip_rules = await ip_block_service.get_active_block_rules(db, agent_id)
            for rule in active_ip_rules:
                ws_ip_payload = {
                    "event": "COMMAND_IP_BLOCK",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "data": {
                        "action": "BLOCK",
                        "ip_address": rule["ip_address"],
                        "command": f'netsh advfirewall firewall add rule name="MalwareMgr_Block_{rule["ip_address"]}" dir=in action=block remoteip={rule["ip_address"]}',
                        "target_agents": rule["target_agents"],
                        "reason": rule["reason"],
                        "dispatched_at": rule["created_at"]
                    }
                }
                await websocket.send_json(ws_ip_payload)
            logger.info(f"Pushed active Scan Mode ('{active_mode['mode_name']}') and {len(active_ip_rules)} IP rules to agent: {agent_id}")
    except Exception as e:
        logger.warning(f"Failed to send initial handshake payloads to agent [{agent_id}]: {e}")
    
    try:
        while True:
            # Wait for incoming text messages from Agent
            data = await websocket.receive_text()
            
            # Check for control ACK messages
            try:
                msg_json = json.loads(data)
                if isinstance(msg_json, dict):
                    event = msg_json.get("event")
                    if event == "ACK_IOC_SYNC":
                        logger.info(f"Agent [{agent_id}] acknowledged IOC rules sync.")
                        await broadcast_manager.broadcast_to_dashboard("AGENT_IOC_SYNC_ACK", {
                            "agent_id": agent_id,
                            "rules_count": msg_json.get("rules_count", 0),
                            "status": "SUCCESS"
                        })
                        continue
                    elif event == "ACK_SCAN_MODE_SYNC":
                        logger.info(f"Agent [{agent_id}] acknowledged Scan Mode sync: '{msg_json.get('mode_name')}'")
                        await broadcast_manager.broadcast_to_dashboard("AGENT_SCAN_MODE_ACK", {
                            "agent_id": agent_id,
                            "mode_name": msg_json.get("mode_name"),
                            "status": "SUCCESS"
                        })
                        continue
                    elif event in ("ACK_IP_BLOCK", "ACK_IP_UNBLOCK"):
                        logger.info(f"Agent [{agent_id}] acknowledged IP rule {event}: {msg_json.get('ip_address')}")
                        await broadcast_manager.broadcast_to_dashboard("AGENT_IP_RULE_ACK", {
                            "agent_id": agent_id,
                            "ip_address": msg_json.get("ip_address"),
                            "event": event,
                            "status": "SUCCESS"
                        })
                        continue
            except Exception:
                pass

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



