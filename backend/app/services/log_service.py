import logging
import json
from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy import select, func, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.scan_log import ScanLog
from app.models.log_quarantine import LogQuarantine
from app.schemas.scan_log import AgentLogPayload
from app.services.broadcast import broadcast_manager

logger = logging.getLogger(__name__)

class LogService:
    @staticmethod
    async def process_incoming_log(
        db: AsyncSession,
        raw_text: str,
        client_ip: Optional[str] = None
    ) -> bool:
        """
        Parses incoming JSON raw payload, validates against Pydantic schema,
        persists into Agent and ScanLog DB, and broadcasts to live Dashboard feeds.
        Quarantines payload if invalid.
        """
        payload_data = None
        try:
            payload_data = json.loads(raw_text)
            log_payload = AgentLogPayload(**payload_data)
        except Exception as e:
            logger.warning(f"Malformed log payload received: {e}")
            agent_id = payload_data.get("AgentID") if isinstance(payload_data, dict) else None
            quarantine = LogQuarantine(
                agent_id=agent_id,
                raw_payload=raw_text,
                error_reason=str(e)
            )
            db.add(quarantine)
            await db.commit()
            return False

        # Ensure Agent record exists & update status + last_seen_at
        stmt = select(Agent).where(Agent.agent_id == log_payload.AgentID)
        result = await db.execute(stmt)
        agent = result.scalar_one_or_none()

        now = datetime.now(timezone.utc)
        if not agent:
            agent = Agent(
                agent_id=log_payload.AgentID,
                hostname=f"Agent-{log_payload.AgentID[:8]}",
                ip_address=client_ip or "127.0.0.1",
                status="ONLINE",
                version=log_payload.version,
                last_seen_at=now
            )
            db.add(agent)
        else:
            agent.status = "ONLINE"
            agent.last_seen_at = now
            if client_ip:
                agent.ip_address = client_ip

        # Create ScanLog record
        scan_log = ScanLog(
            agent_id=log_payload.AgentID,
            module=log_payload.Module,
            name=log_payload.Name,
            path=log_payload.Path,
            scan_type=log_payload.ScanType,
            severity=log_payload.Severity,
            status=log_payload.Status,
            event_time=log_payload.Time,
            payload_version=log_payload.version
        )
        db.add(scan_log)
        await db.commit()
        await db.refresh(scan_log)

        # Broadcast event to live Dashboard subscribers
        broadcast_data = {
            "id": scan_log.id,
            "AgentID": scan_log.agent_id,
            "Module": scan_log.module,
            "Name": scan_log.name,
            "Path": scan_log.path,
            "ScanType": scan_log.scan_type,
            "Severity": scan_log.severity,
            "Status": scan_log.status,
            "Time": scan_log.event_time.isoformat(),
            "version": scan_log.payload_version
        }
        await broadcast_manager.broadcast_to_dashboard("NEW_SCAN_LOG", broadcast_data)
        return True

    @staticmethod
    async def get_logs_filtered(
        db: AsyncSession,
        agent_id: Optional[str] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        scan_type: Optional[str] = None,
        module: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 50
    ) -> Tuple[List[ScanLog], int]:
        """
        Query scan logs with pagination and multi-criterion filters.
        """
        query = select(ScanLog)

        if agent_id:
            query = query.where(ScanLog.agent_id == agent_id)
        if severity:
            query = query.where(ScanLog.severity == severity)
        if status:
            query = query.where(ScanLog.status == status)
        if scan_type:
            query = query.where(ScanLog.scan_type == scan_type)
        if module:
            query = query.where(ScanLog.module == module)
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                or_(
                    ScanLog.name.ilike(search_pattern),
                    ScanLog.path.ilike(search_pattern)
                )
            )

        # Count total matching records
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        # Apply ordering and pagination
        offset = (page - 1) * limit
        query = query.order_by(desc(ScanLog.event_time)).offset(offset).limit(limit)

        result = await db.execute(query)
        items = result.scalars().all()
        return list(items), total

    @staticmethod
    async def clear_all_logs(db: AsyncSession) -> int:
        """
        Delete all scan logs and quarantine logs from database.
        """
        from sqlalchemy import delete
        stmt_logs = delete(ScanLog)
        stmt_quarantine = delete(LogQuarantine)
        
        res1 = await db.execute(stmt_logs)
        res2 = await db.execute(stmt_quarantine)
        await db.commit()
        return res1.rowcount + res2.rowcount

log_service = LogService()

