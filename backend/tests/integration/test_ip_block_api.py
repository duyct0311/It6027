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
async def test_ip_block_api_workflow(test_db):
    app.dependency_overrides[get_db] = lambda: test_db

    token = create_access_token(subject="admin")
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. GET initial active IP rules list
        get_res = await client.get("/api/v1/ip-block", headers=headers)
        assert get_res.status_code == 200
        rules = get_res.json()
        assert isinstance(rules, list)

        # 2. POST create invalid IP block rule -> Expect HTTP 422/400 validation error
        invalid_payload = {
            "ip_address": "999.999.999.999",
            "action": "BLOCK",
            "target_agents": "ALL",
            "reason": "Test Invalid Format"
        }
        invalid_res = await client.post("/api/v1/ip-block", json=invalid_payload, headers=headers)
        assert invalid_res.status_code in (400, 422)

        # 3. POST create valid IP block rule -> Expect HTTP 200
        valid_payload = {
            "ip_address": "185.220.101.5",
            "action": "BLOCK",
            "target_agents": "ALL",
            "reason": "Malicious Feodo C2 Botnet Server"
        }
        post_res = await client.post("/api/v1/ip-block", json=valid_payload, headers=headers)
        assert post_res.status_code == 200
        post_data = post_res.json()
        assert post_data["status"] == "success"
        assert post_data["rule"]["ip_address"] == "185.220.101.5"
        assert post_data["rule"]["action"] == "BLOCK"
        assert post_data["rule"]["status"] == "APPLIED"

        # 4. GET rules again to verify rule added
        get_res2 = await client.get("/api/v1/ip-block", headers=headers)
        assert get_res2.status_code == 200
        rules2 = get_res2.json()
        assert len(rules2) >= 1
        assert any(r["ip_address"] == "185.220.101.5" and r["status"] == "APPLIED" for r in rules2)

        # 5. POST unblock rule for 185.220.101.5 -> Expect HTTP 200
        unblock_payload = {
            "ip_address": "185.220.101.5",
            "target_agents": "ALL",
            "reason": "Verified false positive unblock request"
        }
        unblock_res = await client.post("/api/v1/ip-block/unblock", json=unblock_payload, headers=headers)
        assert unblock_res.status_code == 200
        unblock_data = unblock_res.json()
        assert unblock_data["status"] == "success"

        # 6. GET rules again to verify rule status changed
        get_res3 = await client.get("/api/v1/ip-block", headers=headers)
        assert get_res3.status_code == 200
        rules3 = get_res3.json()
        unblocked_rule = next((r for r in rules3 if r["ip_address"] == "185.220.101.5"), None)
        assert unblocked_rule is not None
        assert unblocked_rule["action"] == "UNBLOCK"
        assert unblocked_rule["status"] == "APPLIED"

    app.dependency_overrides.clear()
