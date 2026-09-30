from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict

class ScanModeCreateRequest(BaseModel):
    mode_name: str = Field(..., description="Scan Mode Profile Name (e.g. Quick Scan, Full System Scan, Custom / Deep Scan)")
    action_mode: str = Field(default="DETECTED_ONLY", description="Threat Action Mode: DETECTED_ONLY | QUARANTINE | DELETE")
    target_paths: List[str] = Field(default_factory=lambda: ["C:\\Windows\\Temp", "C:\\Users\\Public"])
    max_file_size_mb: int = Field(default=100, ge=1, le=2048)
    enable_yara: bool = Field(default=True)
    enable_ai_heuristics: bool = Field(default=True)
    scan_priority: str = Field(default="NORMAL") # LOW, NORMAL, HIGH
    file_extensions_exclude: Optional[str] = Field(default=".iso,.vhd,.tmp")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "mode_name": "Quick Scan",
                "action_mode": "DETECTED_ONLY",
                "target_paths": ["C:\\Windows\\Temp", "C:\\Users\\Public"],
                "max_file_size_mb": 50,
                "enable_yara": True,
                "enable_ai_heuristics": True,
                "scan_priority": "NORMAL",
                "file_extensions_exclude": ".iso,.vhd,.tmp"
            }
        }
    )

class ScanModeResponse(BaseModel):
    id: int
    mode_name: str
    action_mode: str
    target_paths: List[str]
    max_file_size_mb: int
    enable_yara: bool
    enable_ai_heuristics: bool
    scan_priority: str
    file_extensions_exclude: Optional[str]
    is_active: bool
    updated_at: str

