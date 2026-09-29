from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.models.ioc import IOC
from app.models.admin_user import AdminUser
from app.services.broadcast import broadcast_manager

router = APIRouter()

class IOCCreate(BaseModel):
    ioc_type: str # HASH_MD5, HASH_SHA256, YARA_RULE, MALICIOUS_IP, MALICIOUS_DOMAIN
    value: str
    description: str = ""
    severity: str = "High"

@router.get("", response_model=List[Dict[str, Any]])
async def get_iocs(
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    stmt = select(IOC).order_by(IOC.created_at.desc())
    res = await db.execute(stmt)
    iocs = res.scalars().all()
    return [
        {
            "id": i.id,
            "ioc_type": i.ioc_type,
            "value": i.value,
            "description": i.description,
            "severity": i.severity,
            "status": i.status,
            "created_at": i.created_at.isoformat()
        }
        for i in iocs
    ]

@router.post("", response_model=Dict[str, Any])
async def create_and_push_ioc(
    payload: IOCCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    ioc = IOC(
        ioc_type=payload.ioc_type,
        value=payload.value,
        description=payload.description,
        severity=payload.severity,
        status="DEPLOYED"
    )
    db.add(ioc)
    await db.commit()
    await db.refresh(ioc)

    # Broadcast IOC push notification to Dashboard
    await broadcast_manager.broadcast_to_dashboard("IOC_PUSHED", {
        "id": ioc.id,
        "ioc_type": ioc.ioc_type,
        "value": ioc.value
    })

    return {
        "id": ioc.id,
        "ioc_type": ioc.ioc_type,
        "value": ioc.value,
        "description": ioc.description,
        "severity": ioc.severity,
        "status": ioc.status,
        "created_at": ioc.created_at.isoformat()
    }
