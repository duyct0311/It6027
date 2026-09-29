from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.services.agent_service import agent_service
from app.models.admin_user import AdminUser

router = APIRouter()

@router.get("", response_model=List[Dict[str, Any]])
async def list_agents(
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    List all agents with active connection status.
    Requires Admin JWT authentication.
    """
    agents = await agent_service.get_all_agents(db)
    return [
        {
            "agent_id": agent.agent_id,
            "hostname": agent.hostname,
            "ip_address": agent.ip_address,
            "status": agent.status,
            "version": agent.version,
            "last_seen_at": agent.last_seen_at.isoformat() if agent.last_seen_at else None
        }
        for agent in agents
    ]

@router.get("/summary", response_model=Dict[str, Any])
async def get_summary_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Retrieve system summary metrics for Dashboard Stat Cards.
    """
    summary = await agent_service.get_dashboard_summary(db)
    return summary
