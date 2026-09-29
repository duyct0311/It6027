import asyncio
import logging
from sqlalchemy import select
from app.db.session import engine, AsyncSessionLocal
from app.db.base import Base
from app.models.admin_user import AdminUser
from app.models.agent import Agent
from app.models.scan_log import ScanLog
from app.models.log_quarantine import LogQuarantine
from app.core.config import settings
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

async def init_db():
    print("[*] Initializing Database Schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[+] Database Tables Created Successfully.")

    async with AsyncSessionLocal() as session:
        # Check if Admin user exists
        stmt = select(AdminUser).where(AdminUser.username == settings.ADMIN_USERNAME)
        result = await session.execute(stmt)
        admin = result.scalar_one_or_none()

        if not admin:
            print(f"[*] Seeding Initial Admin User: '{settings.ADMIN_USERNAME}'")
            hashed_pwd = get_password_hash(settings.ADMIN_PASSWORD)
            admin = AdminUser(
                username=settings.ADMIN_USERNAME,
                password_hash=hashed_pwd,
                role="Admin"
            )
            session.add(admin)
            await session.commit()
            print(f"[+] Admin Account Created. Username: {settings.ADMIN_USERNAME}")
        else:
            print(f"[i] Admin User '{settings.ADMIN_USERNAME}' already exists.")

if __name__ == "__main__":
    asyncio.run(init_db())
