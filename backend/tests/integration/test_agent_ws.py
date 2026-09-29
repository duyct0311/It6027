import pytest
import pytest_asyncio
import json
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.db.base import Base
from app.services.log_service import log_service
from app.models.scan_log import ScanLog
from app.models.log_quarantine import LogQuarantine

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
async def test_process_valid_incoming_log(test_db: AsyncSession):
    valid_payload = {
        "AgentID": "0a9582fe-ddbe-1d4b2e1d-1aa8-877458e6",
        "Module": "AI",
        "Name": "AI-Detected Malware",
        "Path": r"C:\Users\tienl\Downloads\build_x86\dll_test.exe",
        "ScanType": "Realtime Protection",
        "Severity": "Medium",
        "Status": "DETECTED_ONLY",
        "Time": datetime.now(timezone.utc).isoformat(),
        "version": "1.0"
    }

    success = await log_service.process_incoming_log(
        db=test_db,
        raw_text=json.dumps(valid_payload),
        client_ip="192.168.1.100"
    )
    assert success is True

    logs, total = await log_service.get_logs_filtered(db=test_db, agent_id="0a9582fe-ddbe-1d4b2e1d-1aa8-877458e6")
    assert total == 1
    assert logs[0].name == "AI-Detected Malware"
    assert logs[0].severity == "Medium"

@pytest.mark.asyncio
async def test_process_malformed_log(test_db: AsyncSession):
    invalid_payload = "{ malformed json: true "

    success = await log_service.process_incoming_log(
        db=test_db,
        raw_text=invalid_payload,
        client_ip="192.168.1.101"
    )
    assert success is False

    # Verify log went to quarantine
    logs, total = await log_service.get_logs_filtered(db=test_db)
    assert total == 0
