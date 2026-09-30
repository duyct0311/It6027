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
async def test_scan_mode_get_and_post(test_db):
    app.dependency_overrides[get_db] = lambda: test_db

    token = create_access_token(subject="admin")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. GET initial active scan mode
        get_res = await client.get("/api/v1/scan-mode", headers=headers)
        assert get_res.status_code == 200
        get_data = get_res.json()
        assert get_data["mode_name"] == "Quick Scan"

        # 2. POST update to Full System Scan
        payload = {
            "mode_name": "Full System Scan",
            "target_paths": ["C:\\", "D:\\"],
            "max_file_size_mb": 250,
            "enable_yara": True,
            "enable_ai_heuristics": True,
            "scan_priority": "HIGH",
            "file_extensions_exclude": ".iso,.vhd"
        }
        post_res = await client.post("/api/v1/scan-mode", json=payload, headers=headers)
        assert post_res.status_code == 200
        post_data = post_res.json()
        assert post_data["status"] == "success"
        assert post_data["config"]["mode_name"] == "Full System Scan"
        assert post_data["config"]["scan_priority"] == "HIGH"

        # 3. GET active scan mode again to verify persistence
        verify_res = await client.get("/api/v1/scan-mode", headers=headers)
        assert verify_res.status_code == 200
        verify_data = verify_res.json()
        assert verify_data["mode_name"] == "Full System Scan"
        assert verify_data["target_paths"] == ["C:\\", "D:\\"]
        assert verify_data["max_file_size_mb"] == 250

    app.dependency_overrides.clear()
