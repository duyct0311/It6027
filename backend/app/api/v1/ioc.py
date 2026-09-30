from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.ioc import IOC
from app.models.admin_user import AdminUser
from app.services.broadcast import broadcast_manager
from app.services.ti_collector import sync_all_public_feeds

router = APIRouter()

class ManualIOCCreate(BaseModel):
    value: str
    category: str = "FileHash" # FileHash | MaliciousIP | YARA | URL
    description: Optional[str] = None

@router.get("", response_model=List[Dict[str, Any]])
async def get_iocs(
    category: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    stmt = select(IOC).order_by(IOC.created_at.desc())

    if category:
        stmt = stmt.where(IOC.category == category)
    if source:
        stmt = stmt.where(IOC.source == source)
    if search:
        stmt = stmt.where(
            or_(
                IOC.value.ilike(f"%{search}%"),
                IOC.description.ilike(f"%{search}%")
            )
        )

    res = await db.execute(stmt)
    iocs = res.scalars().all()
    return [
        {
            "id": i.id,
            "value": i.value,
            "category": getattr(i, "category", getattr(i, "ioc_type", "FileHash")),
            "source": getattr(i, "source", "Manual Admin"),
            "description": i.description or "",
            "is_active": getattr(i, "is_active", True),
            "created_at": i.created_at.isoformat() if i.created_at else "",
            "last_synced_at": i.last_synced_at.isoformat() if hasattr(i, "last_synced_at") and i.last_synced_at else ""
        }
        for i in iocs
    ]

@router.post("", response_model=Dict[str, Any])
async def create_manual_ioc(
    payload: ManualIOCCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    val = payload.value.strip()
    if not val:
        raise HTTPException(status_code=400, detail="IOC value cannot be empty.")

    # Deduplicate against existing (value, category)
    stmt = select(IOC).where(IOC.value == val, IOC.category == payload.category)
    res = await db.execute(stmt)
    existing = res.scalars().first()

    now_utc = datetime.now(timezone.utc)
    if existing:
        existing.description = payload.description or existing.description
        existing.last_synced_at = now_utc
        ioc_rec = existing
    else:
        ioc_rec = IOC(
            value=val,
            category=payload.category,
            source="Manual Admin",
            description=payload.description or "Custom Admin Specified IOC",
            is_active=True,
            created_at=now_utc,
            last_synced_at=now_utc
        )
        db.add(ioc_rec)

    await db.commit()
    await db.refresh(ioc_rec)

    # Broadcast IOC push notification to Dashboard & Agents
    await broadcast_manager.broadcast_to_dashboard("UPDATE_IOC", {
        "id": ioc_rec.id,
        "value": ioc_rec.value,
        "category": ioc_rec.category,
        "source": ioc_rec.source
    })

    return {
        "id": ioc_rec.id,
        "value": ioc_rec.value,
        "category": ioc_rec.category,
        "source": ioc_rec.source,
        "description": ioc_rec.description,
        "is_active": ioc_rec.is_active,
        "created_at": ioc_rec.created_at.isoformat()
    }

@router.post("/sync", response_model=Dict[str, Any])
async def trigger_feed_sync(
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Triggers an instant pull and deduplication of free public Threat Intelligence feeds
    (MalwareBazaar, ThreatFox, FeodoTracker, URLhaus).
    """
    result = await sync_all_public_feeds(db)

    # Notify Web Dashboard
    await broadcast_manager.broadcast_to_dashboard("UPDATE_IOC", {
        "ingested_count": result.get("ingested_count", 0),
        "source": "Public TI Feeds"
    })

    return result

@router.post("/push", response_model=Dict[str, Any])
async def push_iocs_to_agents(
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Pushes active IOC rules from server database down to all connected agent WebSockets.
    """
    stmt = select(IOC).where(IOC.is_active == True).order_by(IOC.created_at.desc())
    res = await db.execute(stmt)
    active_iocs = res.scalars().all()

    ioc_payload = [
        {
            "id": i.id,
            "value": i.value,
            "category": i.category,
            "source": i.source,
            "description": i.description or ""
        }
        for i in active_iocs
    ]

    connected_count = len(broadcast_manager.agent_connections)

    # Broadcast rules to all connected WebSocket Agents
    await broadcast_manager.broadcast_to_agents("SYNC_IOC_RULES", {
        "action": "SYNC_IOC_RULES",
        "total_rules": len(ioc_payload),
        "iocs": ioc_payload[:500], # Send active signatures sample / batch
        "pushed_at": datetime.now(timezone.utc).isoformat()
    })

    # Broadcast notification to Dashboard
    await broadcast_manager.broadcast_to_dashboard("UPDATE_IOC_PUSH_STATUS", {
        "pushed_count": len(ioc_payload),
        "connected_agents": connected_count,
        "pushed_at": datetime.now(timezone.utc).isoformat()
    })

    return {
        "status": "success",
        "pushed_count": len(ioc_payload),
        "connected_agents_count": connected_count,
        "message": f"Successfully pushed {len(ioc_payload):,} IOC rules down to {connected_count} connected agent(s)."
    }

