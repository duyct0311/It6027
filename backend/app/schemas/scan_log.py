from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator

class ScanTypeEnum(str, Enum):
    REALTIME = "Realtime Protection"
    MANUAL = "Manual Scan"
    SCHEDULED = "Scheduled Scan"

class SeverityEnum(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class ActionStatusEnum(str, Enum):
    DETECTED_ONLY = "DETECTED_ONLY"
    QUARANTINED = "QUARANTINED"
    DELETED = "DELETED"

class AgentLogPayload(BaseModel):
    AgentID: str = Field(..., description="Unique UUID identifier of the scanning agent")
    Module: str = Field(..., min_length=1, description="Detection engine (e.g. AI, YARA, Hash)")
    Name: str = Field(..., min_length=1, description="Threat or rule name")
    Path: str = Field(..., min_length=1, description="Full file path on agent system")
    ScanType: str = Field(..., description="Type of scan")
    Severity: str = Field(..., description="Severity level")
    Status: str = Field(..., description="Action status executed")
    Time: datetime = Field(..., description="ISO 8601 timestamp with offset")
    version: str = Field("1.0", description="Protocol version")

    @field_validator("AgentID")
    @classmethod
    def validate_agent_id(cls, v: str) -> str:
        if not v or len(v.strip()) == 0:
            raise ValueError("AgentID cannot be empty")
        return v.strip()

class ScanLogResponse(BaseModel):
    id: int
    agent_id: str
    module: str
    name: str
    path: str
    scan_type: str
    severity: str
    status: str
    time: datetime
    created_at: datetime

    class Config:
        from_attributes = True
