from datetime import datetime, timezone
from sqlalchemy import Integer, String, DateTime, Text, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class IOC(Base):
    __tablename__ = "iocs"
    __table_args__ = (
        UniqueConstraint('value', 'category', name='uix_ioc_value_category'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    value: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(32), nullable=False, index=True) # FileHash, MaliciousIP, YARA, URL
    source: Mapped[str] = mapped_column(String(64), nullable=False, index=True)   # MalwareBazaar, ThreatFox, FeodoTracker, URLhaus, Manual Admin
    description: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    last_synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

class FeedProvider(Base):
    __tablename__ = "feed_providers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    feed_url: Mapped[str] = mapped_column(String(512), nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_sync_status: Mapped[str] = mapped_column(String(32), default="SUCCESS", nullable=False)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    total_ingested: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
