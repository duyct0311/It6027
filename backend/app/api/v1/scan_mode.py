from typing import Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.schemas.scan_mode import ScanModeCreateRequest, ScanModeResponse
from app.services.scan_mode_service import scan_mode_service
from app.services.broadcast import broadcast_manager
from app.models.admin_user import AdminUser

router = APIRouter()

@router.get("", response_model=ScanModeResponse)
async def get_active_scan_mode(
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Retrieve current active scan mode configuration.
    """
    return await scan_mode_service.get_active_scan_mode(db)

@router.post("", response_model=Dict[str, Any])
async def update_and_push_scan_mode(
    payload: ScanModeCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Update scan mode profile, persist in database, and push JSON config to connected agents.
    """
    config_data = await scan_mode_service.update_scan_mode(db, payload)

    connected_agents_count = len(broadcast_manager.agent_connections)
    now_iso = datetime.now(timezone.utc).isoformat()

    # Broadcast SYNC_SCAN_MODE event payload to all connected Agents over WebSocket
    ws_payload = {
        "action": "SYNC_SCAN_MODE",
        "mode_name": config_data["mode_name"],
        "action_mode": config_data["action_mode"],
        "target_paths": config_data["target_paths"],
        "max_file_size_mb": config_data["max_file_size_mb"],
        "enable_yara": config_data["enable_yara"],
        "enable_ai_heuristics": config_data["enable_ai_heuristics"],
        "scan_priority": config_data["scan_priority"],
        "file_extensions_exclude": config_data["file_extensions_exclude"],
        "pushed_at": now_iso
    }

    await broadcast_manager.broadcast_to_agents("SYNC_SCAN_MODE", ws_payload)

    # Broadcast notification event to Dashboard UI
    await broadcast_manager.broadcast_to_dashboard("UPDATE_SCAN_MODE", {
        "config": config_data,
        "connected_agents_count": connected_agents_count,
        "pushed_at": now_iso
    })

    return {
        "status": "success",
        "config": config_data,
        "connected_agents_count": connected_agents_count,
        "message": f"Scan Mode '{config_data['mode_name']}' updated and pushed down to {connected_agents_count} connected agent(s)."
    }
