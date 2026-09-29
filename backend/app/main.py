from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.api.v1 import auth, logs, agents, schedules, ioc, scan_mode, ip_block
from app.api.websockets import agent_ws, dashboard_ws

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API Routers for the 5 Main Features
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Auth"])
app.include_router(logs.router, prefix=f"{settings.API_V1_STR}/logs", tags=["Feature 1: Log Quét & Telemetry"])
app.include_router(agents.router, prefix=f"{settings.API_V1_STR}/agents", tags=["Agents"])
app.include_router(schedules.router, prefix=f"{settings.API_V1_STR}/schedules", tags=["Feature 2: Lập Lịch Quét"])
app.include_router(ioc.router, prefix=f"{settings.API_V1_STR}/ioc", tags=["Feature 3: Cập Nhật IOC"])
app.include_router(scan_mode.router, prefix=f"{settings.API_V1_STR}/scan-mode", tags=["Feature 4: Chế Độ Quét"])
app.include_router(ip_block.router, prefix=f"{settings.API_V1_STR}/ip-block", tags=["Feature 5: Chặn/Bỏ Chặn IP"])

# Mount WebSocket Routers
app.include_router(agent_ws.router, tags=["WebSocket Agent"])
app.include_router(dashboard_ws.router, tags=["WebSocket Dashboard"])

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0"
    }
