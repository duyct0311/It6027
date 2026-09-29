from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.ip_rule import IpRule
from app.models.admin_user import AdminUser
from app.services.broadcast import broadcast_manager

router = APIRouter()

class IpRuleCreate(BaseModel):
    ip_address: str
    action: str = "BLOCK" # BLOCK or UNBLOCK
    target_agents: str = "ALL"
    reason: str = ""

@router.get("", response_model=List[Dict[str, Any]])
async def get_ip_rules(
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    stmt = select(IpRule).order_by(IpRule.created_at.desc())
    res = await db.execute(stmt)
    rules = res.scalars().all()
    return [
        {
            "id": r.id,
            "ip_address": r.ip_address,
            "action": r.action,
            "target_agents": r.target_agents,
            "reason": r.reason,
            "status": r.status,
            "created_at": r.created_at.isoformat()
        }
        for r in rules
    ]

@router.post("", response_model=Dict[str, Any])
async def create_ip_rule(
    payload: IpRuleCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    rule = IpRule(
        ip_address=payload.ip_address,
        action=payload.action.upper(),
        target_agents=payload.target_agents,
        reason=payload.reason,
        status="APPLIED"
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)

    # Broadcast command down to Dashboard/Agents
    await broadcast_manager.broadcast_to_dashboard("IP_RULE_DISPATCHED", {
        "id": rule.id,
        "ip_address": rule.ip_address,
        "action": rule.action,
        "target_agents": rule.target_agents
    })

    return {
        "id": rule.id,
        "ip_address": rule.ip_address,
        "action": rule.action,
        "target_agents": rule.target_agents,
        "reason": rule.reason,
        "status": rule.status,
        "created_at": rule.created_at.isoformat()
    }
