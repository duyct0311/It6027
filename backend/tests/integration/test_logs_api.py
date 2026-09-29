import pytest
import pytest_asyncio
import json
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.db.base import Base
from app.models.agent import Agent
from app.models.scan_log import ScanLog
from app.services.log_service import log_service

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest_asyncio.fixture
async def test_db():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, expire_on_commit=False)
    async with async_session() as session:
        yield session

    await engine.dispose()

@pytest.mark.asyncio
async def test_log_filtering_by_severity(test_db: AsyncSession):
    # Seed agent & logs
    agent = Agent(agent_id="agent-001", hostname="HostA", status="ONLINE")
    test_db.add(agent)

    log1 = ScanLog(
        agent_id="agent-001",
        module="AI",
        name="Malware.Critical",
        path=r"C:\Windows\System32\malware.dll",
        scan_type="Realtime Protection",
        severity="Critical",
        status="DETECTED_ONLY",
        event_time=datetime.now(timezone.utc)
    )
    log2 = ScanLog(
        agent_id="agent-001",
        module="YARA",
        name="PUP.LowRisk",
        path=r"C:\Temp\adware.exe",
        scan_type="Manual Scan",
        severity="Low",
        status="QUARANTINED",
        event_time=datetime.now(timezone.utc)
    )
    test_db.add_all([log1, log2])
    await test_db.commit()

    # Query Critical logs
    items, total = await log_service.get_logs_filtered(db=test_db, severity="Critical")
    assert total == 1
    assert items[0].name == "Malware.Critical"

    # Query search keyword
    items_search, total_search = await log_service.get_logs_filtered(db=test_db, search="adware")
    assert total_search == 1
    assert items_search[0].name == "PUP.LowRisk"
