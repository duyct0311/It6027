from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Agent(Base):
    __tablename__ = "agents"

    agent_id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    hostname: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ONLINE", index=True)
    version: Mapped[str] = mapped_column(String(20), default="1.0")
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    scan_logs = relationship("ScanLog", back_populates="agent", cascade="all, delete-orphan")
