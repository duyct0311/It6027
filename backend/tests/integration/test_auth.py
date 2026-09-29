import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.db.base import Base
from app.models.admin_user import AdminUser
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token

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
async def test_admin_password_hashing():
    raw_pwd = "SecretAdminPassword123!"
    hashed_pwd = get_password_hash(raw_pwd)
    
    assert verify_password(raw_pwd, hashed_pwd) is True
    assert verify_password("WrongPassword", hashed_pwd) is False

@pytest.mark.asyncio
async def test_jwt_token_generation_and_decoding():
    username = "admin"
    token = create_access_token(subject=username)
    assert isinstance(token, str)

    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == username
    assert payload["role"] == "Admin"
