import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.db.base import Base
from app.db.session import get_db
from app.models.admin_user import AdminUser
from app.core.security import get_password_hash, create_access_token
from app.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture
async def test_db():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, expire_on_commit=False)
    async with async_session() as session:
        # Seed Admin user
        admin = AdminUser(
            username="admin",
            password_hash=get_password_hash("admin123"),
            role="Admin"
        )
        session.add(admin)
        await session.commit()
        yield session

    await engine.dispose()

@pytest.mark.asyncio
async def test_create_and_fetch_scan_schedules(test_db):
    app.dependency_overrides[get_db] = lambda: test_db

    token = create_access_token(subject="admin")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Create a Daily Scan Schedule (Widgets selection: Daily, 02:00 AM, C:\Program Files, ALL, DETECTED_ONLY)
        daily_payload = {
            "name": "Daily Program Files Audit",
            "cron_expression": "0 2 * * *",
            "scan_scope": "C:\\Program Files",
            "target_agents": "ALL",
            "scan_mode": "DETECTED_ONLY"
        }
        res1 = await client.post("/api/v1/schedules", json=daily_payload, headers=headers)
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["id"] is not None
        assert data1["name"] == "Daily Program Files Audit"
        assert data1["cron_expression"] == "0 2 * * *"
        assert data1["scan_scope"] == "C:\\Program Files"
        assert data1["target_agents"] == "ALL"
        assert data1["scan_mode"] == "DETECTED_ONLY"
        assert data1["is_active"] is True

        # 2. Create a Weekly Scan Schedule (Widgets selection: Weekly, Mon 14:30, C:\Users, Specific Agent, QUARANTINE)
        weekly_payload = {
            "name": "Weekly User Folder Isolation",
            "cron_expression": "30 14 * * 1",
            "scan_scope": "C:\\Users",
            "target_agents": "agent-uuid-001",
            "scan_mode": "QUARANTINE"
        }
        res2 = await client.post("/api/v1/schedules", json=weekly_payload, headers=headers)
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["name"] == "Weekly User Folder Isolation"
        assert data2["cron_expression"] == "30 14 * * 1"
        assert data2["scan_mode"] == "QUARANTINE"

        # 3. GET All Scan Schedules and verify records
        get_res = await client.get("/api/v1/schedules", headers=headers)
        assert get_res.status_code == 200
        schedules = get_res.json()
        assert len(schedules) == 2
        schedule_names = [s["name"] for s in schedules]
        assert "Daily Program Files Audit" in schedule_names
        assert "Weekly User Folder Isolation" in schedule_names

    app.dependency_overrides.clear()
