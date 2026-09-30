# Tài Liệu Mô Tả Chi Tiết Chức Năng & Giao Thức Payload Của Web Server Central Hub

---

## 📌 Tổng Quan Hệ Thống

**Malware Manager Central Web Server** là thành phần máy chủ trung tâm xây dựng trên nền tảng **FastAPI (Python)** và **React (Vite/Tailwind)**. Máy chủ đóng vai trò:
1. **Quản lý & Tiếp nhận Telemetry**: Lắng nghe và xử lý nhật ký quét mã độc thời gian thực từ các Windows Agent phân tán.
2. **Thu thập Threat Intelligence (TI)**: Tự động thu thập chỉ số IOC từ các nguồn uy tín mở (FeodoTracker, ThreatFox, MalwareBazaar, URLhaus).
3. **Phân phối Cấu hình & Chỉ thị (Control Dispatch)**: Đẩy cấu hình chế độ quét, lịch quét, tập luật IOC và chỉ thị rào cản mạng **Windows Firewall (`netsh advfirewall`)** trực tiếp xuống Agent qua kết nối **WebSocket** thời gian thực.

---

## 🛠️ Danh Sách Các Tính Năng Chi Tiết & Giao Thức Payload

---

### 1. Telemetry & Log Management (Tập Trung & Quản Lý Nhật Ký Quét)

#### 📝 Mô tả chức năng
* Lắng nghe chuỗi dữ liệu định dạng JSON gửi liên tục từ các Agent qua cổng WebSocket `/ws/agent`.
* Phân tích, chuẩn hóa dữ liệu log, lưu trữ vào cơ sở dữ liệu SQLite/PostgreSQL, tính toán mức độ nguy cơ (**Critical, High, Medium, Low**).
* Đẩy nhật ký real-time lên giao diện Web Dashboard Admin qua WebSocket `/ws/dashboard`.

#### 🛰️ Payload Gửi LÊN (Agent ➔ Server qua WebSocket `/ws/agent`)
* **Định dạng**: JSON Text Frame
* **Tần suất**: Phát sinh ngay khi Agent phát hiện file/tiến trình nghi vấn.

```json
{
  "AgentID": "58fabb7a-56c5-45af-a0aa-586710005ea3",
  "Module": "YARA",
  "Name": "Trojan.Win32.Generic",
  "Path": "C:\\Windows\\Temp\\malicious_payload.dll",
  "ScanType": "Realtime Protection",
  "Severity": "Critical",
  "Status": "QUARANTINED",
  "Time": "2026-09-30T13:20:00.000Z",
  "version": "1.0"
}
```

* **Chi tiết trường dữ liệu**:
  * `AgentID` *(string)*: GUID định danh duy nhất của Windows Agent.
  * `Module` *(string)*: Mô-đun phát hiện (`AI`, `YARA`, `Hash`, `Behavioral`, `Heuristic`).
  * `Name` *(string)*: Tên chủng loại mã độc / mối đe dọa.
  * `Path` *(string)*: Đường dẫn tệp tin nghi vấn trên hệ thống Windows.
  * `ScanType` *(string)*: Hình thức quét (`Realtime Protection`, `Manual Scan`, `Scheduled Scan`).
  * `Severity` *(string)*: Mức độ nghiêm trọng (`Critical`, `High`, `Medium`, `Low`).
  * `Status` *(string)*: Trạng thái xử lý tại Agent (`DETECTED_ONLY`, `QUARANTINED`, `DELETED`).
  * `Time` *(string)*: Thời điểm phát hiện dạng UTC ISO-8601.

#### 📡 Payload Gửi XUỐNG Dashboard (Server ➔ Web UI qua WebSocket `/ws/dashboard`)
```json
{
  "event": "NEW_SCAN_LOG",
  "timestamp": "2026-09-30T13:20:00.000Z",
  "data": {
    "id": 1042,
    "agent_id": "58fabb7a-56c5-45af-a0aa-586710005ea3",
    "module": "YARA",
    "threat_name": "Trojan.Win32.Generic",
    "file_path": "C:\\Windows\\Temp\\malicious_payload.dll",
    "scan_type": "Realtime Protection",
    "severity": "Critical",
    "status": "QUARANTINED",
    "client_ip": "192.168.1.15",
    "created_at": "2026-09-30T13:20:00.000Z"
  }
}
```

#### 🌐 REST API Truy Vấn Log (`GET /api/v1/logs`)
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Query Params**: `page=1&limit=20&severity=Critical&search=Trojan`
* **Response 200 OK**:
```json
{
  "items": [
    {
      "id": 1042,
      "agent_id": "58fabb7a-56c5-45af-a0aa-586710005ea3",
      "module": "YARA",
      "threat_name": "Trojan.Win32.Generic",
      "file_path": "C:\\Windows\\Temp\\malicious_payload.dll",
      "severity": "Critical",
      "status": "QUARANTINED",
      "created_at": "2026-09-30T13:20:00+00:00"
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20,
  "pages": 1
}
```

---

### 2. Periodic Scan Scheduler (Lên Lịch Quét Định Kỳ Cho Agent)

#### 📝 Mô tả chức năng
* Cho phép Admin lập lịch quét tự động định kỳ (Daily, Weekly, Cron expression) áp dụng cho toàn bộ máy Agent hoặc 1 máy cụ thể.
* Lưu lịch quét vào database và tự động phát động công việc khi đến mốc thời gian chỉ định.

#### 🌐 REST API Tạo Lịch Quét (`POST /api/v1/schedules`)
* **Request Payload (Web UI ➔ Server)**:
```json
{
  "schedule_name": "Daily Midnight Deep Scan",
  "target_agents": "ALL",
  "cron_expression": "0 0 * * *",
  "scan_type": "FULL",
  "target_paths": ["C:\\", "D:\\Data"],
  "is_active": true
}
```

* **Response 200 OK (Server ➔ Web UI)**:
```json
{
  "status": "success",
  "schedule": {
    "id": 5,
    "schedule_name": "Daily Midnight Deep Scan",
    "target_agents": "ALL",
    "cron_expression": "0 0 * * *",
    "scan_type": "FULL",
    "target_paths": ["C:\\", "D:\\Data"],
    "is_active": true,
    "created_at": "2026-09-30T13:22:00+00:00"
  },
  "message": "Scan schedule created successfully."
}
```

---

### 3. Threat Intelligence & IOC Distribution Engine (Thu Thập & Đồng Bộ Chỉ Số Độc Hại)

#### 📝 Mô tả chức năng
* Kích hoạt job tự động tải chỉ số độc hại từ các nguồn mở:
  * **FeodoTracker**: Danh sách IP C2 Botnet (JSON).
  * **ThreatFox**: Tập chỉ số IOC tổng hợp (JSON).
  * **MalwareBazaar**: Hash tệp tin mã độc mới phát hiện (CSV).
  * **URLhaus**: Tệp URL phân phối mã độc (CSV).
* Đẩy tập chỉ số IOC mới thu thập xuống các Windows Agent để cập nhật cơ sở dữ liệu nhận diện tại máy con.

#### 🌐 REST API Kích Hoạt Thu Thập Feed (`POST /api/v1/ioc/fetch-feed`)
* **Response 200 OK**:
```json
{
  "status": "success",
  "fetched_count": 450,
  "message": "Successfully updated 450 new IOC threat signatures into database."
}
```

#### 📡 Payload Gửi XUỐNG Agent (`SERVER ➔ AGENT` qua WebSocket `/ws/agent`)
* **Sự kiện**: `SYNC_IOC_RULES`
```json
{
  "event": "SYNC_IOC_RULES",
  "timestamp": "2026-09-30T13:24:00.000Z",
  "data": {
    "action": "SYNC_IOC_RULES",
    "total_rules": 1250,
    "pushed_at": "2026-09-30T13:24:00.000Z"
  }
}
```

#### 🔄 Payload Phản Hồi Từ Agent (`AGENT ➔ SERVER` qua WebSocket `/ws/agent`)
* **Sự kiện**: `ACK_IOC_SYNC`
```json
{
  "event": "ACK_IOC_SYNC",
  "agent_id": "58fabb7a-56c5-45af-a0aa-586710005ea3",
  "rules_count": 1250,
  "status": "SUCCESS",
  "timestamp": "2026-09-30T13:24:01.000Z"
}
```

---

### 4. Agent Scan Action Mode Configuration (Cấu Hình Chế Độ Hành Động Quét)

#### 📝 Mô tả chức năng
* Admin điều chỉnh cấu hình quét và phản ứng của Agent:
  * **Chế độ hành động (`action_mode`)**:
    * `DETECT_ONLY`: Chỉ phát hiện & phát cảnh báo (không can thiệp file).
    * `QUARANTINE`: Tự động chuyển tệp tin phát hiện vào thư mục cách ly an toàn.
    * `DELETE`: Tự động xóa vĩnh viễn tệp tin độc hại.
  * **Tham số bổ sung**: Đường dẫn quét (`target_paths`), giới hạn dung lượng file (`max_file_size_mb`), bật/tắt YARA engine (`enable_yara`), bật/tắt AI Heuristics (`enable_ai_heuristics`), đuôi tệp loại trừ (`file_extensions_exclude`).
* Server tự động đẩy cấu hình JSON này xuống toàn bộ Agent (tức thời khi lưu và tự động đẩy lại khi Agent mới thực hiện Handshake kết nối).

#### 🌐 REST API Cập Nhật Chế Độ Quét (`POST /api/v1/scan-mode`)
* **Request Payload (Web UI ➔ Server)**:
```json
{
  "mode_name": "Full System Scan",
  "action_mode": "QUARANTINE",
  "target_paths": ["C:\\", "D:\\"],
  "max_file_size_mb": 250,
  "enable_yara": true,
  "enable_ai_heuristics": true,
  "scan_priority": "HIGH",
  "file_extensions_exclude": ".iso,.vhd"
}
```

#### 📡 Payload Gửi XUỐNG Agent (`SERVER ➔ AGENT` qua WebSocket `/ws/agent`)
* **Sự kiện**: `SYNC_SCAN_MODE` (Gửi khi Admin bấm Save hoặc khi Agent thực hiện Handshake).

```json
{
  "event": "SYNC_SCAN_MODE",
  "timestamp": "2026-09-30T13:25:00.000Z",
  "data": {
    "action": "SYNC_SCAN_MODE",
    "mode_name": "Full System Scan",
    "action_mode": "QUARANTINE",
    "target_paths": ["C:\\", "D:\\"],
    "max_file_size_mb": 250,
    "enable_yara": true,
    "enable_ai_heuristics": true,
    "scan_priority": "HIGH",
    "file_extensions_exclude": ".iso,.vhd",
    "pushed_at": "2026-09-30T13:25:00.000Z"
  }
}
```

#### 🔄 Payload Phản Hồi Từ Agent (`AGENT ➔ SERVER` qua WebSocket `/ws/agent`)
* **Sự kiện**: `ACK_SCAN_MODE_SYNC`
```json
{
  "event": "ACK_SCAN_MODE_SYNC",
  "agent_id": "58fabb7a-56c5-45af-a0aa-586710005ea3",
  "mode_name": "Full System Scan",
  "status": "SUCCESS",
  "timestamp": "2026-09-30T13:25:01.000Z"
}
```

---

### 5. Windows Firewall IP Barrier & Command Dispatch (Gửi Lệnh Chặn/Bỏ Chặn IP xuống Windows Agent)

#### 📝 Mô tả chức năng
* Admin quản lý danh sách địa chỉ IP bị cấm/cho phép truy cập hệ thống.
* Server biên dịch yêu cầu thành lệnh **Windows Firewall (`netsh advfirewall firewall`)** chuẩn xác và phát thẳng xuống các Windows Agent để thực thi tại cấp hệ điều hành.
* **Handshake Auto-Sync**: Khi một Windows Agent kết nối mới/kết nối lại, Server tự động quét database và đẩy lại toàn bộ các quy tắc `COMMAND_IP_BLOCK` đang có hiệu lực để Agent áp dụng ngay lập tức.

#### 🌐 REST API Tạo Lệnh Chặn IP (`POST /api/v1/ip-block`)
* **Request Payload (Web UI ➔ Server)**:
```json
{
  "ip_address": "198.51.100.88",
  "action": "BLOCK",
  "target_agents": "ALL",
  "reason": "Malicious Feodo C2 Botnet Node"
}
```

#### 🌐 REST API Tạo Lệnh Bỏ Chặn IP (`POST /api/v1/ip-block/unblock`)
* **Request Payload (Web UI ➔ Server)**:
```json
{
  "ip_address": "198.51.100.88",
  "target_agents": "ALL",
  "reason": "Verified false positive unblock request"
}
```

#### 📡 Payload Gửi XUỐNG Windows Agent (`SERVER ➔ AGENT` qua WebSocket `/ws/agent`)

##### 🚫 1. Trường hợp Lệnh Chặn IP (`COMMAND_IP_BLOCK`)
```json
{
  "event": "COMMAND_IP_BLOCK",
  "timestamp": "2026-09-30T13:25:26.000Z",
  "data": {
    "action": "BLOCK",
    "ip_address": "198.51.100.88",
    "command": "netsh advfirewall firewall add rule name=\"MalwareMgr_Block_198.51.100.88\" dir=in action=block remoteip=198.51.100.88",
    "target_agents": "ALL",
    "reason": "Malicious Feodo C2 Botnet Node",
    "dispatched_at": "2026-09-30T13:25:26.000Z"
  }
}
```

##### ✅ 2. Trường hợp Lệnh Bỏ Chặn IP (`COMMAND_IP_UNBLOCK`)
```json
{
  "event": "COMMAND_IP_UNBLOCK",
  "timestamp": "2026-09-30T13:25:28.000Z",
  "data": {
    "action": "UNBLOCK",
    "ip_address": "198.51.100.88",
    "command": "netsh advfirewall firewall delete rule name=\"MalwareMgr_Block_198.51.100.88\"",
    "target_agents": "ALL",
    "reason": "Verified false positive unblock request",
    "dispatched_at": "2026-09-30T13:25:28.000Z"
  }
}
```

#### 🔄 Payload Phản Hồi Từ Windows Agent (`AGENT ➔ SERVER` qua WebSocket `/ws/agent`)

##### 📜 1. Xác nhận Chặn IP thành công (`ACK_IP_BLOCK`)
```json
{
  "event": "ACK_IP_BLOCK",
  "agent_id": "58fabb7a-56c5-45af-a0aa-586710005ea3",
  "rule_id": 3,
  "ip_address": "198.51.100.88",
  "action": "BLOCK",
  "executed_command": "netsh advfirewall firewall add rule name=\"MalwareMgr_Block_198.51.100.88\" dir=in action=block remoteip=198.51.100.88",
  "status": "SUCCESS",
  "timestamp": "2026-09-30T13:25:26.250Z"
}
```

##### 📜 2. Xác nhận Bỏ Chặn IP thành công (`ACK_IP_UNBLOCK`)
```json
{
  "event": "ACK_IP_UNBLOCK",
  "agent_id": "58fabb7a-56c5-45af-a0aa-586710005ea3",
  "rule_id": 3,
  "ip_address": "198.51.100.88",
  "action": "UNBLOCK",
  "executed_command": "netsh advfirewall firewall delete rule name=\"MalwareMgr_Block_198.51.100.88\"",
  "status": "SUCCESS",
  "timestamp": "2026-09-30T13:25:28.300Z"
}
```

---

### 6. Admin Authentication & Core WebSocket Session (Xác Thực Admin & Quản Lý Kết Nối)

#### 📝 Mô tả chức năng
* Đăng nhập xác thực tài khoản Administrator, cấp phát chuỗi JWT Bearer token có thời hạn.
* Quản lý kết nối WebSocket tập trung qua `BroadcastManager`.

#### 🌐 REST API Đăng Nhập Admin (`POST /api/v1/auth/login`)
* **Request Payload**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```
* **Response 200 OK**:
```json
{
  "access_token": "<JWT_ACCESS_TOKEN_STRING>",
  "token_type": "bearer",
  "user": {
    "username": "admin",
    "role": "Admin"
  }
}
```

---

## 📊 Tóm Tắt Luồng Dữ Liệu WebSocket (WebSocket Protocol Map)

| Tên Sự Kiện (`event`) | Hướng Dữ Liệu | Mục Đích Sử Dụng | Payload Chính |
| :--- | :--- | :--- | :--- |
| **`NEW_SCAN_LOG`** | Server ➔ Dashboard UI | Đẩy thông báo có tệp độc hại mới tới Web Admin | `agent_id`, `threat_name`, `severity`, `file_path` |
| **`SYNC_SCAN_MODE`** | Server ➔ Agent | Đẩy cấu hình chế độ quét & can thiệp (`QUARANTINE`, `DELETE`) | `action_mode`, `target_paths`, `enable_yara`, `enable_ai_heuristics` |
| **`ACK_SCAN_MODE_SYNC`** | Agent ➔ Server | Xác nhận Agent đã áp dụng chế độ quét mới | `agent_id`, `mode_name`, `status` |
| **`SYNC_IOC_RULES`** | Server ➔ Agent | Đẩy tập chữ ký độc hại mới | `total_rules`, `pushed_at` |
| **`ACK_IOC_SYNC`** | Agent ➔ Server | Xác nhận Agent đã nạp tập IOC vào engine | `agent_id`, `rules_count`, `status` |
| **`COMMAND_IP_BLOCK`** | Server ➔ Windows Agent | Đẩy câu lệnh chặn IP `netsh advfirewall` | `ip_address`, `command`, `target_agents`, `reason` |
| **`ACK_IP_BLOCK`** | Windows Agent ➔ Server | Xác nhận Windows Agent đã thi hành lệnh `netsh` chặn IP thành công | `agent_id`, `ip_address`, `executed_command`, `status` |
| **`COMMAND_IP_UNBLOCK`** | Server ➔ Windows Agent | Đẩy câu lệnh xóa quy tắc chặn IP | `ip_address`, `command`, `target_agents` |
| **`ACK_IP_UNBLOCK`** | Windows Agent ➔ Server | Xác nhận Windows Agent đã xóa quy tắc tường lửa thành công | `agent_id`, `ip_address`, `executed_command`, `status` |
