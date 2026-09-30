import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc

from app.models.ip_rule import IpRule
from app.schemas.ip_rule import IpRuleCreateRequest, IpUnblockRequest

logger = logging.getLogger(__name__)

class IpBlockService:
    @staticmethod
    async def get_ip_rules(
        db: AsyncSession,
        action: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        stmt = select(IpRule).order_by(desc(IpRule.created_at))

        if action:
            stmt = stmt.where(IpRule.action == action.upper())
        if search:
            search_pat = f"%{search}%"
            stmt = stmt.where(
                or_(
                    IpRule.ip_address.ilike(search_pat),
                    IpRule.reason.ilike(search_pat)
                )
            )

        res = await db.execute(stmt)
        rules = res.scalars().all()

        return [
            {
                "id": r.id,
                "ip_address": r.ip_address,
                "action": r.action,
                "target_agents": r.target_agents,
                "reason": r.reason or "",
                "status": r.status,
                "created_at": r.created_at.isoformat() if r.created_at else ""
            }
            for r in rules
        ]

    @staticmethod
    async def get_active_block_rules(db: AsyncSession, agent_id: Optional[str] = None) -> List[Dict[str, Any]]:
        stmt = select(IpRule).where(IpRule.action == "BLOCK").order_by(desc(IpRule.created_at))

        if agent_id:
            stmt = stmt.where(
                or_(
                    IpRule.target_agents == "ALL",
                    IpRule.target_agents == agent_id
                )
            )

        res = await db.execute(stmt)
        rules = res.scalars().all()

        return [
            {
                "id": r.id,
                "ip_address": r.ip_address,
                "action": r.action,
                "target_agents": r.target_agents,
                "reason": r.reason or "",
                "status": r.status,
                "created_at": r.created_at.isoformat() if r.created_at else ""
            }
            for r in rules
        ]

    @staticmethod
    async def create_block_rule(db: AsyncSession, payload: IpRuleCreateRequest) -> Dict[str, Any]:
        now_utc = datetime.now(timezone.utc)

        # Check if rule exists for same IP
        stmt = select(IpRule).where(IpRule.ip_address == payload.ip_address).order_by(desc(IpRule.created_at))
        res = await db.execute(stmt)
        existing = res.scalars().first()

        if existing:
            existing.action = payload.action.upper()
            existing.target_agents = payload.target_agents
            existing.reason = payload.reason or existing.reason
            existing.status = "APPLIED"
            existing.created_at = now_utc
            rule_rec = existing
        else:
            rule_rec = IpRule(
                ip_address=payload.ip_address,
                action=payload.action.upper(),
                target_agents=payload.target_agents,
                reason=payload.reason or "Custom Admin Specified IP Rule",
                status="APPLIED",
                created_at=now_utc
            )
            db.add(rule_rec)

        await db.commit()
        await db.refresh(rule_rec)

        return {
            "id": rule_rec.id,
            "ip_address": rule_rec.ip_address,
            "action": rule_rec.action,
            "target_agents": rule_rec.target_agents,
            "reason": rule_rec.reason or "",
            "status": rule_rec.status,
            "created_at": rule_rec.created_at.isoformat()
        }

    @staticmethod
    async def unblock_ip_rule(db: AsyncSession, payload: IpUnblockRequest) -> Dict[str, Any]:
        now_utc = datetime.now(timezone.utc)

        stmt = select(IpRule).where(IpRule.ip_address == payload.ip_address).order_by(desc(IpRule.created_at))
        res = await db.execute(stmt)
        existing = res.scalars().first()

        if existing:
            existing.action = "UNBLOCK"
            existing.reason = payload.reason or existing.reason
            existing.status = "APPLIED"
            existing.created_at = now_utc
            rule_rec = existing
        else:
            rule_rec = IpRule(
                ip_address=payload.ip_address,
                action="UNBLOCK",
                target_agents=payload.target_agents,
                reason=payload.reason or "Unblocked false positive IP",
                status="APPLIED",
                created_at=now_utc
            )
            db.add(rule_rec)

        await db.commit()
        await db.refresh(rule_rec)

        return {
            "id": rule_rec.id,
            "ip_address": rule_rec.ip_address,
            "action": rule_rec.action,
            "target_agents": rule_rec.target_agents,
            "reason": rule_rec.reason or "",
            "status": rule_rec.status,
            "created_at": rule_rec.created_at.isoformat()
        }

ip_block_service = IpBlockService()
