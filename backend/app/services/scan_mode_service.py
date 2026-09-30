import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.models.scan_mode import ScanModeSetting
from app.schemas.scan_mode import ScanModeCreateRequest

logger = logging.getLogger(__name__)

class ScanModeService:
    @staticmethod
    async def get_active_scan_mode(db: AsyncSession) -> Dict[str, Any]:
        """
        Retrieves the currently active scan mode setting from DB.
        Falls back to default 'Quick Scan' profile if none found.
        """
        stmt = select(ScanModeSetting).where(ScanModeSetting.is_active == True).order_by(ScanModeSetting.updated_at.desc())
        res = await db.execute(stmt)
        active = res.scalars().first()

        now_utc = datetime.now(timezone.utc)
        if not active:
            active = ScanModeSetting(
                mode_name="Quick Scan",
                action_mode="DETECTED_ONLY",
                target_paths=json.dumps(["C:\\Windows\\Temp", "C:\\Users\\Public"]),
                max_file_size_mb=50,
                enable_yara=True,
                enable_ai_heuristics=True,
                scan_priority="NORMAL",
                file_extensions_exclude=".iso,.vhd,.tmp",
                is_active=True,
                updated_at=now_utc
            )
            db.add(active)
            await db.commit()
            await db.refresh(active)

        # Parse target_paths from JSON/string
        try:
            paths = json.loads(active.target_paths)
            if not isinstance(paths, list):
                paths = [active.target_paths]
        except Exception:
            paths = [p.strip() for p in active.target_paths.split(",") if p.strip()]

        return {
            "id": active.id,
            "mode_name": active.mode_name,
            "action_mode": getattr(active, "action_mode", "DETECTED_ONLY") or "DETECTED_ONLY",
            "target_paths": paths,
            "max_file_size_mb": active.max_file_size_mb,
            "enable_yara": active.enable_yara,
            "enable_ai_heuristics": active.enable_ai_heuristics,
            "scan_priority": active.scan_priority,
            "file_extensions_exclude": active.file_extensions_exclude or "",
            "is_active": active.is_active,
            "updated_at": active.updated_at.isoformat() if active.updated_at else now_utc.isoformat()
        }

    @staticmethod
    async def update_scan_mode(db: AsyncSession, payload: ScanModeCreateRequest) -> Dict[str, Any]:
        """
        Deactivates previous scan mode settings and creates/persists new active scan mode setting.
        """
        now_utc = datetime.now(timezone.utc)

        # Mark previous settings inactive
        await db.execute(
            update(ScanModeSetting).values(is_active=False)
        )

        paths_json = json.dumps(payload.target_paths)
        new_setting = ScanModeSetting(
            mode_name=payload.mode_name,
            action_mode=payload.action_mode,
            target_paths=paths_json,
            max_file_size_mb=payload.max_file_size_mb,
            enable_yara=payload.enable_yara,
            enable_ai_heuristics=payload.enable_ai_heuristics,
            scan_priority=payload.scan_priority,
            file_extensions_exclude=payload.file_extensions_exclude,
            is_active=True,
            updated_at=now_utc
        )
        db.add(new_setting)
        await db.commit()
        await db.refresh(new_setting)

        return {
            "id": new_setting.id,
            "mode_name": new_setting.mode_name,
            "action_mode": new_setting.action_mode,
            "target_paths": payload.target_paths,
            "max_file_size_mb": new_setting.max_file_size_mb,
            "enable_yara": new_setting.enable_yara,
            "enable_ai_heuristics": new_setting.enable_ai_heuristics,
            "scan_priority": new_setting.scan_priority,
            "file_extensions_exclude": new_setting.file_extensions_exclude or "",
            "is_active": new_setting.is_active,
            "updated_at": new_setting.updated_at.isoformat()
        }

scan_mode_service = ScanModeService()

