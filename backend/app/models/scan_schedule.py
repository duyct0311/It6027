from datetime import datetime, timezone
from sqlalchemy import Integer, String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class ScanSchedule(Base):
    __tablename__ = "scan_schedules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    cron_expression: Mapped[str] = mapped_column(String(50), nullable=False, default="0 0 * * *")
    scan_scope: Mapped[str] = mapped_column(String(255), nullable=False, default="C:\\Program Files")
    target_agents: Mapped[str] = mapped_column(String(255), nullable=False, default="ALL")
    scan_mode: Mapped[str] = mapped_column(String(30), nullable=False, default="DETECTED_ONLY")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
