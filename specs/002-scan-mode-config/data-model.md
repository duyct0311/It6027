# Phase 1 Data Model: Scan Mode Configuration Distribution

## Data Entities

### 1. `ScanModeSetting` (Database Model: `scan_mode_settings`)

Represents a scan mode configuration profile persisted in SQLite.

| Field Name | Type | Constraints | Description |
|------------|------|-------------|-------------|
| `id` | Integer | Primary Key, Autoincrement | Unique ID of configuration record |
| `mode_name` | String(50) | Not Null, Index | Preset name ("Quick Scan", "Full System Scan", "Custom / Deep Scan") |
| `target_paths` | String(1000) | Not Null | Comma-separated or JSON list of paths (e.g. `["C:\\Windows\\Temp", "C:\\Users"]`) |
| `max_file_size_mb` | Integer | Default: 100 | Maximum file size in MB to inspect |
| `enable_yara` | Boolean | Default: True | Enable YARA signature engine |
| `enable_ai_heuristics` | Boolean | Default: True | Enable AI/ML heuristics engine |
| `scan_priority` | String(20) | Default: "NORMAL" | Thread priority ("LOW", "NORMAL", "HIGH") |
| `file_extensions_exclude` | String(255) | Nullable | Excluded file extensions (e.g. `".iso,.vhd,.tmp"`) |
| `is_active` | Boolean | Default: True, Index | Active configuration flag |
| `updated_at` | DateTime(UTC) | Not Null | Timestamp of configuration deployment |

---

## Pydantic Schemas

### `ScanModeCreateRequest`
```python
from pydantic import BaseModel, Field
from typing import List, Optional

class ScanModeCreateRequest(BaseModel):
    mode_name: str = Field(..., example="Quick Scan")
    target_paths: List[str] = Field(default_factory=lambda: ["C:\\Windows\\Temp", "C:\\Users\\Public"])
    max_file_size_mb: int = Field(default=100, ge=1, le=2048)
    enable_yara: bool = Field(default=True)
    enable_ai_heuristics: bool = Field(default=True)
    scan_priority: str = Field(default="NORMAL", regex="^(LOW|NORMAL|HIGH)$")
    file_extensions_exclude: Optional[str] = Field(default=".iso,.vhd,.tmp")
```

### `ScanModeResponse`
```python
class ScanModeResponse(BaseModel):
    id: int
    mode_name: str
    target_paths: List[str]
    max_file_size_mb: int
    enable_yara: bool
    enable_ai_heuristics: bool
    scan_priority: str
    file_extensions_exclude: Optional[str]
    is_active: bool
    updated_at: str
```
