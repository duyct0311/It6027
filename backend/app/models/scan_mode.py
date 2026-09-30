from datetime import datetime, timezone
from sqlalchemy import Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class ScanModeSetting(Base):
    __tablename__ = "scan_mode_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mode_name: Mapped[str] = mapped_column(String(50), nullable=False, index=True) # Quick Scan, Full System Scan, Custom / Deep Scan
    action_mode: Mapped[str] = mapped_column(String(20), default="DETECTED_ONLY") # DETECTED_ONLY, QUARANTINE, DELETE
    target_paths: Mapped[str] = mapped_column(Text, nullable=False) # JSON or comma-separated paths string
    max_file_size_mb: Mapped[int] = mapped_column(Integer, default=100)
    enable_yara: Mapped[bool] = mapped_column(Boolean, default=True)
    enable_ai_heuristics: Mapped[bool] = mapped_column(Boolean, default=True)
    scan_priority: Mapped[str] = mapped_column(String(20), default="NORMAL") # LOW, NORMAL, HIGH
    file_extensions_exclude: Mapped[str | None] = mapped_column(String(255), nullable=True) # .iso,.vhd,.tmp
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )

