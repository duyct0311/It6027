from datetime import datetime, timezone
from sqlalchemy import Integer, String, DateTime, ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class ScanLog(Base):
    __tablename__ = "scan_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    agent_id: Mapped[str] = mapped_column(String(36), ForeignKey("agents.agent_id"), index=True, nullable=False)
    module: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    path: Mapped[str] = mapped_column(String(500), index=True, nullable=False)
    scan_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    event_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    payload_version: Mapped[str] = mapped_column(String(10), default="1.0")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True
    )

    # Relationships
    agent = relationship("Agent", back_populates="scan_logs")

__table_args__ = (
    Index("idx_agent_event_time", "agent_id", "event_time"),
    Index("idx_severity_status_time", "severity", "status", "event_time"),
)
