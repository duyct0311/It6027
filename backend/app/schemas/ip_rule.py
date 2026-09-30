import ipaddress
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict

class IpRuleCreateRequest(BaseModel):
    ip_address: str = Field(..., description="Target IPv4 or IPv6 address to block or unblock")
    action: str = Field(default="BLOCK", description="Action type: BLOCK or UNBLOCK")
    target_agents: str = Field(default="ALL", description="Target agents scope ('ALL' or specific Agent ID)")
    reason: Optional[str] = Field(default="Malicious C2 Botnet IP")

    @field_validator("ip_address")
    def validate_ip(cls, v: str) -> str:
        clean_ip = v.strip()
        try:
            ipaddress.ip_address(clean_ip)
        except ValueError:
            raise ValueError(f"Invalid IP address format: '{clean_ip}'")
        return clean_ip

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "ip_address": "185.220.101.5",
                "action": "BLOCK",
                "target_agents": "ALL",
                "reason": "Malicious Feodo C2 Server IP"
            }
        }
    )

class IpUnblockRequest(BaseModel):
    ip_address: str = Field(..., description="Target IPv4 or IPv6 address to unblock")
    target_agents: str = Field(default="ALL", description="Target agents scope ('ALL' or specific Agent ID)")
    reason: Optional[str] = Field(default="Verified safe false positive")

    @field_validator("ip_address")
    def validate_ip(cls, v: str) -> str:
        clean_ip = v.strip()
        try:
            ipaddress.ip_address(clean_ip)
        except ValueError:
            raise ValueError(f"Invalid IP address format: '{clean_ip}'")
        return clean_ip

class IpRuleResponse(BaseModel):
    id: int
    ip_address: str
    action: str
    target_agents: str
    reason: Optional[str]
    status: str
    created_at: str
