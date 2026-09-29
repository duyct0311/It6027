from typing import Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.api.deps import get_current_admin
from app.models.admin_user import AdminUser
from app.services.broadcast import broadcast_manager

router = APIRouter()

GLOBAL_SCAN_MODE = {"mode": "DETECTED_ONLY", "description": "Detection & Alert Only"}

class ScanModeUpdate(BaseModel):
    mode: str # DETECTED_ONLY, QUARANTINE, DELETE
    agent_id: str = "GLOBAL"

@router.get("", response_model=Dict[str, Any])
async def get_scan_mode(
    current_admin: AdminUser = Depends(get_current_admin)
):
    return GLOBAL_SCAN_MODE

@router.post("", response_model=Dict[str, Any])
async def update_scan_mode(
    payload: ScanModeUpdate,
    current_admin: AdminUser = Depends(get_current_admin)
):
    GLOBAL_SCAN_MODE["mode"] = payload.mode
    if payload.mode == "DETECTED_ONLY":
        GLOBAL_SCAN_MODE["description"] = "Detection Only (Phát hiện & Cảnh báo)"
    elif payload.mode == "QUARANTINE":
        GLOBAL_SCAN_MODE["description"] = "Quarantine (Cách ly file vi phạm)"
    elif payload.mode == "DELETE":
        GLOBAL_SCAN_MODE["description"] = "Delete (Xóa vĩnh viễn file vi phạm)"

    # Broadcast mode update
    await broadcast_manager.broadcast_to_dashboard("SCAN_MODE_UPDATED", GLOBAL_SCAN_MODE)

    return GLOBAL_SCAN_MODE
