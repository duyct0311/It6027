from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.schemas.ip_rule import IpRuleCreateRequest, IpUnblockRequest, IpRuleResponse
from app.services.ip_block_service import ip_block_service
from app.services.broadcast import broadcast_manager
from app.models.admin_user import AdminUser

router = APIRouter()

@router.get("", response_model=List[IpRuleResponse])
async def get_ip_rules(
    action: Optional[str] = Query(None, description="Filter by action: BLOCK or UNBLOCK"),
    search: Optional[str] = Query(None, description="Search term for IP address or reason"),
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Retrieve listing of IP firewall barrier rules.
    """
    return await ip_block_service.get_ip_rules(db, action=action, search=search)

@router.post("", response_model=Dict[str, Any])
async def create_and_dispatch_ip_rule(
    payload: IpRuleCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Submit IP block or unblock rule, persist in database, and dispatch WebSocket command to target agents.
    """
    rule_data = await ip_block_service.create_block_rule(db, payload)
    now_iso = datetime.now(timezone.utc).isoformat()

    event_type = "COMMAND_IP_BLOCK" if rule_data["action"] == "BLOCK" else "COMMAND_IP_UNBLOCK"
    target_list = None if rule_data["target_agents"] == "ALL" else [rule_data["target_agents"]]

    cmd_str = (
        f'netsh advfirewall firewall add rule name="MalwareMgr_Block_{rule_data["ip_address"]}" dir=in action=block remoteip={rule_data["ip_address"]}'
        if rule_data["action"] == "BLOCK"
        else f'netsh advfirewall firewall delete rule name="MalwareMgr_Block_{rule_data["ip_address"]}"'
    )

    ws_command = {
        "action": rule_data["action"],
        "ip_address": rule_data["ip_address"],
        "command": cmd_str,
        "target_agents": rule_data["target_agents"],
        "reason": rule_data["reason"],
        "dispatched_at": now_iso
    }

    # Broadcast command to targeted agents over WebSocket
    await broadcast_manager.broadcast_to_agents(event_type, ws_command, target_agents=target_list)

    connected_count = len(broadcast_manager.agent_connections)

    # Notify Dashboard UI
    await broadcast_manager.broadcast_to_dashboard("UPDATE_IP_RULE_STATUS", {
        "rule": rule_data,
        "connected_agents": connected_count,
        "dispatched_at": now_iso
    })

    return {
        "status": "success",
        "rule": rule_data,
        "dispatched_count": connected_count,
        "message": f"Command '{rule_data['action']}' for IP '{rule_data['ip_address']}' dispatched down to {connected_count} connected agent(s)."
    }

@router.post("/unblock", response_model=Dict[str, Any])
async def unblock_ip_directive(
    payload: IpUnblockRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Submit an IP unblock directive for a target IP address.
    """
    rule_data = await ip_block_service.unblock_ip_rule(db, payload)
    now_iso = datetime.now(timezone.utc).isoformat()

    target_list = None if rule_data["target_agents"] == "ALL" else [rule_data["target_agents"]]

    cmd_str = f'netsh advfirewall firewall delete rule name="MalwareMgr_Block_{rule_data["ip_address"]}"'

    ws_command = {
        "action": "UNBLOCK",
        "ip_address": rule_data["ip_address"],
        "command": cmd_str,
        "target_agents": rule_data["target_agents"],
        "reason": rule_data["reason"],
        "dispatched_at": now_iso
    }

    # Broadcast UNBLOCK command to targeted agents over WebSocket
    await broadcast_manager.broadcast_to_agents("COMMAND_IP_UNBLOCK", ws_command, target_agents=target_list)

    connected_count = len(broadcast_manager.agent_connections)

    # Notify Dashboard UI
    await broadcast_manager.broadcast_to_dashboard("UPDATE_IP_RULE_STATUS", {
        "rule": rule_data,
        "connected_agents": connected_count,
        "dispatched_at": now_iso
    })

    return {
        "status": "success",
        "rule": rule_data,
        "dispatched_count": connected_count,
        "message": f"Unblock command for IP '{rule_data['ip_address']}' dispatched down to {connected_count} connected agent(s)."
    }
