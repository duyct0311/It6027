# Phase 1 Data Model: IP Blocking & Unblocking Command Dispatch

## Data Entities

### 1. `IpRule` (Database Model: `ip_rules`)

Represents an IP firewall rule directive persisted in SQLite.

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | Integer | Primary Key, Autoincrement | Unique ID of firewall rule |
| `ip_address` | String(45) | Not Null, Index | Target IPv4 or IPv6 address (e.g. `185.220.101.5`) |
| `action` | String(20) | Not Null | Directive action (`BLOCK` or `UNBLOCK`) |
| `target_agents` | String(255) | Default `"ALL"` | Target agents scope (`"ALL"` or specific `agent_id`) |
| `reason` | String(255) | Nullable | Reason / threat context for rule |
| `status` | String(20) | Default `"APPLIED"` | Execution status (`APPLIED`, `PENDING`, `FAILED`) |
| `created_at` | DateTime(UTC) | Not Null | Timestamp of rule creation |

---

## Pydantic Schemas

### `IpRuleCreateRequest`
```python
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import ipaddress

class IpRuleCreateRequest(BaseModel):
    ip_address: str = Field(..., description="Target IPv4 or IPv6 address to block/unblock")
    action: str = Field(default="BLOCK", description="Action to enforce: BLOCK or UNBLOCK")
    target_agents: str = Field(default="ALL", description="Target agents: ALL or specific Agent ID")
    reason: Optional[str] = Field(default="Malicious C2 Botnet IP")

    @field_validator("ip_address")
    def validate_ip_format(cls, v: str) -> str:
        v_clean = v.strip()
        try:
            ipaddress.ip_address(v_clean)
        except ValueError:
            raise ValueError(f"Invalid IP address format: '{v_clean}'")
        return v_clean
```

### `IpRuleResponse`
```python
class IpRuleResponse(BaseModel):
    id: int
    ip_address: str
    action: str
    target_agents: str
    reason: Optional[str]
    status: str
    created_at: str
```
