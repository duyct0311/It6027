from datetime import datetime, timezone
from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class IpRule(Base):
    __tablename__ = "ip_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(20), nullable=False) # BLOCK / UNBLOCK
    target_agents: Mapped[str] = mapped_column(String(255), default="ALL")
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="APPLIED")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
