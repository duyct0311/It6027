import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy import select
from app.db.session import engine, AsyncSessionLocal
from app.db.base import Base
from app.models.admin_user import AdminUser
from app.models.agent import Agent
from app.models.scan_log import ScanLog
from app.models.log_quarantine import LogQuarantine
from app.models.ioc import IOC, FeedProvider
from app.models.scan_schedule import ScanSchedule
from app.models.ip_rule import IpRule
from app.models.scan_mode import ScanModeSetting
from app.core.config import settings
from app.core.security import get_password_hash
from app.services.ti_collector import sync_all_public_feeds

logger = logging.getLogger(__name__)

INITIAL_SEED_IOCS = [
    {
        "value": "2db2D75109b5757754f4413999905d4d",
        "category": "FileHash",
        "source": "MalwareBazaar",
        "description": "WannaCry Ransomware MD5 Signature"
    },
    {
        "value": "ed018a70D48d34d6706260593b4fe6a135732bb393d773994ac4b115b0e20c29",
        "category": "FileHash",
        "source": "MalwareBazaar",
        "description": "WannaCry Ransomware SHA256 Signature"
    },
    {
        "value": "185.220.101.5",
        "category": "MaliciousIP",
        "source": "FeodoTracker",
        "description": "Feodo C2 Command Server"
    },
    {
        "value": "http://malicious-payload-dl.ru/exploit.exe",
        "category": "URL",
        "source": "URLhaus",
        "description": "URLhaus Active Malicious Executable Dropper"
    }
]

async def init_db():
    print("[*] Initializing Database Schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[+] Database Tables Created Successfully.")

    async with AsyncSessionLocal() as session:
        # 1. Check & Seed Admin User
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

        # 2. Check & Seed Initial Baseline Scan Mode Setting
        stmt_mode = select(ScanModeSetting)
        mode_res = await session.execute(stmt_mode)
        existing_modes = mode_res.scalars().all()

        now_utc = datetime.now(timezone.utc)
        if not existing_modes:
            print("[*] Seeding Baseline Scan Mode Configuration Profiles...")
            default_quick_mode = ScanModeSetting(
                mode_name="Quick Scan",
                target_paths='["C:\\\\Windows\\\\Temp", "C:\\\\Users\\\\Public"]',
                max_file_size_mb=50,
                enable_yara=True,
                enable_ai_heuristics=True,
                scan_priority="NORMAL",
                file_extensions_exclude=".iso,.vhd,.tmp",
                is_active=True,
                updated_at=now_utc
            )
            session.add(default_quick_mode)
            await session.commit()
            print("[+] Seeded Default Active 'Quick Scan' Profile.")

        # 3. Check & Seed Initial Baseline IP Firewall Rule
        stmt_ip = select(IpRule)
        ip_res = await session.execute(stmt_ip)
        existing_ips = ip_res.scalars().all()

        if not existing_ips:
            print("[*] Seeding Baseline IP Firewall Barrier Rule...")
            default_ip_rule = IpRule(
                ip_address="185.220.101.5",
                action="BLOCK",
                target_agents="ALL",
                reason="Baseline Seed: Feodo Botnet Command Server IP",
                status="APPLIED",
                created_at=now_utc
            )
            session.add(default_ip_rule)
            await session.commit()
            print("[+] Seeded Default Active IP Block Rule ('185.220.101.5').")

        # 4. Check & Seed Initial Baseline IOCs
        stmt_ioc = select(IOC)
        ioc_res = await session.execute(stmt_ioc)
        existing_iocs = ioc_res.scalars().all()

        if not existing_iocs:
            print("[*] Seeding Baseline Threat Intelligence Sample IOCs...")
            for seed in INITIAL_SEED_IOCS:
                session.add(IOC(
                    value=seed["value"],
                    category=seed["category"],
                    source=seed["source"],
                    description=seed["description"],
                    is_active=True,
                    created_at=now_utc,
                    last_synced_at=now_utc
                ))
            await session.commit()
            print(f"[+] Seeded {len(INITIAL_SEED_IOCS)} Initial Baseline IOCs.")

        # 5. Synchronize Live Threat Intelligence Feeds
        print("[*] Triggering Initial Public TI Feed Synchronization...")
        try:
            sync_res = await sync_all_public_feeds(session)
            print(f"[+] Live Feed Sync Complete: Ingested {sync_res.get('ingested_count', 0)} IOCs from live sources.")
        except Exception as e:
            print(f"[!] Warning: Public feed sync skipped or hit network issue: {e}")


if __name__ == "__main__":
    asyncio.run(init_db())


