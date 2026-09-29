from datetime import datetime, timezone
from sqlalchemy import Integer, String, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class IOC(Base):
    __tablename__ = "iocs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ioc_type: Mapped[str] = mapped_column(String(30), nullable=False) # HASH_MD5, HASH_SHA256, YARA_RULE, MALICIOUS_IP, MALICIOUS_DOMAIN
    value: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    severity: Mapped[str] = mapped_column(String(20), default="High")
    status: Mapped[str] = mapped_column(String(20), default="DEPLOYED")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
