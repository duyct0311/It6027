from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_admin
from app.schemas.base import PaginatedResponse
from app.schemas.scan_log import ScanLogResponse
from app.services.log_service import log_service
from app.models.admin_user import AdminUser

router = APIRouter()

@router.get("", response_model=PaginatedResponse[ScanLogResponse])
async def get_scan_logs(
    agent_id: Optional[str] = Query(None, description="Filter by specific Agent ID"),
    severity: Optional[str] = Query(None, description="Filter by Severity level (Low, Medium, High, Critical)"),
    status: Optional[str] = Query(None, description="Filter by Action Status (DETECTED_ONLY, QUARANTINED, DELETED)"),
    scan_type: Optional[str] = Query(None, description="Filter by Scan Type"),
    module: Optional[str] = Query(None, description="Filter by Engine Module"),
    search: Optional[str] = Query(None, description="Search term for threat name or file path"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=200, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    """
    Retrieve paginated malware scan logs with multi-criterion filtering.
    Requires Admin JWT authentication.
    """
    items, total = await log_service.get_logs_filtered(
        db=db,
        agent_id=agent_id,
        severity=severity,
        status=status,
        scan_type=scan_type,
        module=module,
        search=search,
        page=page,
        limit=limit
    )

    response_items = [
        ScanLogResponse(
            id=log.id,
            agent_id=log.agent_id,
            module=log.module,
            name=log.name,
            path=log.path,
            scan_type=log.scan_type,
            severity=log.severity,
            status=log.status,
            time=log.event_time,
            created_at=log.created_at
        )
        for log in items
    ]

    return PaginatedResponse(
        total=total,
        page=page,
        limit=limit,
        items=response_items
    )
