from datetime import datetime, timezone
from sqlalchemy import Integer, String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class LogQuarantine(Base):
    __tablename__ = "log_quarantine"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    agent_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    raw_payload: Mapped[str] = mapped_column(Text, nullable=False)
    error_reason: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
