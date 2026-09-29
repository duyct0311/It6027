from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.scan_schedule import ScanSchedule
from app.models.admin_user import AdminUser

router = APIRouter()

class ScheduleCreate(BaseModel):
    name: str
    cron_expression: str = "0 0 * * *"
    scan_scope: str = "C:\\Program Files"
    target_agents: str = "ALL"
    scan_mode: str = "DETECTED_ONLY"

@router.get("", response_model=List[Dict[str, Any]])
async def get_schedules(
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    stmt = select(ScanSchedule).order_by(ScanSchedule.created_at.desc())
    res = await db.execute(stmt)
    schedules = res.scalars().all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "cron_expression": s.cron_expression,
            "scan_scope": s.scan_scope,
            "target_agents": s.target_agents,
            "scan_mode": s.scan_mode,
            "is_active": s.is_active,
            "created_at": s.created_at.isoformat()
        }
        for s in schedules
    ]

@router.post("", response_model=Dict[str, Any])
async def create_schedule(
    payload: ScheduleCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    schedule = ScanSchedule(
        name=payload.name,
        cron_expression=payload.cron_expression,
        scan_scope=payload.scan_scope,
        target_agents=payload.target_agents,
        scan_mode=payload.scan_mode,
        is_active=True
    )
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    return {
        "id": schedule.id,
        "name": schedule.name,
        "cron_expression": schedule.cron_expression,
        "scan_scope": schedule.scan_scope,
        "target_agents": schedule.target_agents,
        "scan_mode": schedule.scan_mode,
        "is_active": schedule.is_active,
        "created_at": schedule.created_at.isoformat()
    }
