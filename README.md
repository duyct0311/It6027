# 🛡️ Malware Manager Central Web Server Hub

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)

Trung tâm điều khiển & quản lý tập trung (Central Control Hub) dành cho hệ thống giám sát và quét mã độc mã nguồn mở phân tán trên các endpoint **Windows**. Máy chủ cung cấp giao diện quản trị Web Dashboard thời gian thực, tự động thu thập Threat Intelligence (TI), tiếp nhận telemetry từ Agent và điều phối lệnh rào cản mạng **Windows Firewall (`netsh advfirewall`)**.

---

## 🌟 Tính Năng Chính (Core Features)

1. **📊 Real-time Telemetry & Scan Log Management**:
   - Tiếp nhận nhật ký quét thời gian thực qua kênh WebSocket (`/ws/agent`).
   - Phân tích mức độ nghiêm trọng (**Critical, High, Medium, Low**) và lưu vết cơ sở dữ liệu.
   - Hiển thị trực quan dữ liệu telemetry trên Web Dashboard với bộ lọc nâng cao.

2. **📅 Periodic Scan Scheduler**:
   - Lập lịch quét tự động định kỳ (Daily, Weekly, Cron expression).
   - Cho phép chỉ định phạm vi quét áp dụng cho từng Agent hoặc tất cả các máy con.

3. **🔄 Threat Intelligence & IOC Distribution Engine**:
   - Tự động thu thập dữ liệu chỉ số độc hại từ 4 nguồn mở uy tín: **FeodoTracker**, **ThreatFox**, **MalwareBazaar**, và **URLhaus**.
   - Đẩy tập chỉ số IOC (Hashes, IPs, URLs) xuống toàn bộ Agent để cập nhật cơ sở dữ liệu nhận diện tại endpoint.

4. **⚙️ Agent Scan Action Mode Configuration**:
   - Cấu hình linh hoạt chế độ phản ứng của Agent: `DETECT_ONLY` (Chỉ cảnh báo), `QUARANTINE` (Tự động cách ly), và `DELETE` (Tự động xóa vĩnh viễn).
   - Tùy chỉnh tham số quét: đường dẫn mục tiêu, giới hạn dung lượng file, bật/tắt YARA Engine & AI Heuristics.
   - **Handshake Auto-Sync**: Tự động đẩy cấu hình mới nhất xuống khi Agent kết nối vào hệ thống.

5. **🛡️ Windows Firewall IP Barrier & Command Dispatch**:
   - Quản lý danh sách địa chỉ IP bị cấm/cho phép truy cập.
   - Biên dịch lệnh **Windows Firewall (`netsh advfirewall firewall`)** chuẩn xác và phát trực tiếp xuống các Windows Agent qua WebSocket thời gian thực.
   - Đảm bảo các quy tắc rào cản mạng active được tự động đẩy lại khi Agent kết nối/kết nối lại (Handshake sync).

---

## 🏗️ Kiến Trúc Công Nghệ (Tech Stack)

* **Backend**: Python 3.10+, FastAPI, SQLAlchemy (AsyncIO), Pydantic v2, Pytest, Uvicorn, WebSockets.
* **Frontend**: React 18, Vite, Vanilla CSS Modern UI System, Lucide Icons, Axios.
* **Simulation**: Async Python Agent Simulator giả lập môi trường đa Agent kết nối liên tục.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy (Quickstart)

### 1. Khởi Chạy Backend Web Server
```bash
# Di chuyển vào thư mục backend
cd backend

# Tạo môi trường ảo Python (khuyên dùng)
python -m venv venv
# Trên Windows:
venv\Scripts\activate
# Trên Linux/macOS:
source venv/bin/activate

# Cài đặt các thư viện phụ thuộc
pip install -r requirements.txt

# Đặt biến môi trường nếu cần (Tùy chọn)
set ADMIN_USERNAME=admin
set ADMIN_PASSWORD=your_secure_password
set SECRET_KEY=your_production_secret_key

# Khởi chạy uvicorn server
uvicorn app.main:app --reload --port 8000
```
> Server sẽ chạy tại: `http://localhost:8000` (Swagger UI Docs tại `http://localhost:8000/docs`).

### 2. Khởi Chạy Frontend Web Dashboard
```bash
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt các gói phụ thuộc node
npm install

# Khởi chạy dev server
npm run dev
```
> Giao diện Dashboard sẽ hiển thị tại: `http://localhost:5173`.

### 3. Khởi Chạy Giả Lập Windows Agent (Agent Simulator)
```bash
# Chạy trình giả lập 3 Agent kết nối đồng thời lên Server
python backend/scripts/agent_simulator.py --agents 3 --interval 2.5
```

---

## 📄 Tài Liệu Chi Tiết (Documentation)

* **Đặc tả Chi tiết Chức năng & Dữ liệu Payload (Request/Response & WebSocket Push/ACK)**:
  👉 [`docs/web_server_features_spec.md`](docs/web_server_features_spec.md)

---

## 🧪 Kiểm Thử Hệ Thống (Testing)

Khởi chạy bộ kiểm thử tự động toàn diện (Integration Tests) cho Backend:
```bash
cd backend
python -m pytest tests/
```

Kiểm thử đóng gói ứng dụng Frontend:
```bash
cd frontend
npm run build
```

---

## 📜 Giấy Phép (License)

Dự án được phát hành theo giấy phép [MIT License](LICENSE).
