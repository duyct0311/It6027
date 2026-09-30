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
async def test_create_and_fetch_manual_ioc(test_db):
    app.dependency_overrides[get_db] = lambda: test_db

    token = create_access_token(subject="admin")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Create a manual custom IOC (Malicious IP)
        ioc_payload = {
            "value": "192.168.1.250",
            "category": "MaliciousIP",
            "description": "Custom Cobalt Strike C2 Server IP"
        }
        res = await client.post("/api/v1/ioc", json=ioc_payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["id"] is not None
        assert data["value"] == "192.168.1.250"
        assert data["category"] == "MaliciousIP"
        assert data["source"] == "Manual Admin"
        assert data["description"] == "Custom Cobalt Strike C2 Server IP"
        assert data["is_active"] is True

        # 2. Query GET /api/v1/ioc with source filter
        get_res = await client.get("/api/v1/ioc?source=Manual Admin", headers=headers)
        assert get_res.status_code == 200
        items = get_res.json()
        assert len(items) == 1
        assert items[0]["value"] == "192.168.1.250"

    app.dependency_overrides.clear()
