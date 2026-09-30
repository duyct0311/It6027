import asyncio
import logging
from datetime import datetime, timezone
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.ioc import IOC

logger = logging.getLogger("ti_collector")

FREE_FEED_SOURCES = [
    {
        "name": "FeodoTracker",
        "url": "https://feodotracker.abuse.ch/downloads/ipblocklist.json",
        "category": "MaliciousIP",
        "type": "json_feodo"
    },
    {
        "name": "ThreatFox",
        "url": "https://threatfox.abuse.ch/export/json/recent/",
        "category": "MaliciousIP",
        "type": "json_threatfox"
    },
    {
        "name": "MalwareBazaar",
        "url": "https://bazaar.abuse.ch/export/csv/recent/",
        "category": "FileHash",
        "type": "csv_bazaar"
    },
    {
        "name": "URLhaus",
        "url": "https://urlhaus.abuse.ch/downloads/csv_recent/",
        "category": "URL",
        "type": "csv_urlhaus"
    }
]

async def sync_all_public_feeds(db: AsyncSession) -> dict:
    """
    Asynchronously fetches free Threat Intelligence feeds, parses IOC indicators,
    performs deduplication on (value, category), and updates SQLite DB.
    """
    total_ingested = 0
    sync_results = {}
    headers = {"User-Agent": "Malware-Scan-Server/1.0"}

    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=headers) as client:
        for feed in FREE_FEED_SOURCES:
            name = feed["name"]
            url = feed["url"]
            feed_type = feed["type"]

            try:
                resp = await client.get(url)
                if resp.status_code != 200:
                    logger.warning(f"Feed {name} returned HTTP {resp.status_code}")
                    sync_results[name] = {"status": "FAILED", "count": 0}
                    continue

                parsed_items = []
                seen_keys = set()

                def add_item(val: str, cat: str, desc: str):
                    key = (val.strip(), cat)
                    if val and key not in seen_keys:
                        seen_keys.add(key)
                        parsed_items.append({
                            "value": val.strip(),
                            "category": cat,
                            "description": desc
                        })

                if feed_type == "json_feodo":
                    data = resp.json()
                    if isinstance(data, list):
                        for item in data[:200]:
                            ip = item.get("ip_address")
                            if ip:
                                add_item(
                                    ip,
                                    "MaliciousIP",
                                    f"Feodo Botnet C2 ({item.get('malware', 'Botnet')})"
                                )

                elif feed_type == "json_threatfox":
                    data = resp.json()
                    items_dict = data if isinstance(data, dict) else {}
                    for item_id, items in items_dict.items():
                        if isinstance(items, list):
                            for item in items[:200]:
                                ioc_val = item.get("ioc_value") or item.get("ioc")
                                ioc_type = (item.get("ioc_type") or "").lower()
                                if "ip" in ioc_type or "domain" in ioc_type:
                                    cat = "MaliciousIP"
                                elif "url" in ioc_type:
                                    cat = "URL"
                                else:
                                    cat = "FileHash"

                                if ioc_val:
                                    add_item(
                                        ioc_val,
                                        cat,
                                        f"ThreatFox ({item.get('malware_printable', 'Malware')})"
                                    )

                elif feed_type == "csv_bazaar":
                    lines = resp.text.splitlines()
                    for line in lines[:300]:
                        if line.startswith("#") or not line.strip():
                            continue
                        parts = [p.strip().strip('"') for p in line.split(",")]
                        if len(parts) >= 2:
                            sha256_hash = parts[1]
                            if len(sha256_hash) == 64:
                                add_item(
                                    sha256_hash,
                                    "FileHash",
                                    f"MalwareBazaar Sample ({parts[8] if len(parts) > 8 else 'Malware'})"
                                )

                elif feed_type == "csv_urlhaus":
                    lines = resp.text.splitlines()
                    for line in lines[:300]:
                        if line.startswith("#") or not line.strip():
                            continue
                        parts = [p.strip().strip('"') for p in line.split(",")]
                        if len(parts) >= 3:
                            url_val = parts[2]
                            if url_val.startswith("http"):
                                add_item(
                                    url_val,
                                    "URL",
                                    f"URLhaus Malicious Link ({parts[5] if len(parts) > 5 else 'Payload'})"
                                )

                # Batch Deduplicate & Ingest
                ingested_for_feed = 0
                for item in parsed_items:
                    stmt = select(IOC).where(IOC.value == item["value"], IOC.category == item["category"])
                    res = await db.execute(stmt)
                    existing = res.scalars().first()

                    now_utc = datetime.now(timezone.utc)
                    if existing:
                        existing.last_synced_at = now_utc
                    else:
                        ioc_rec = IOC(
                            value=item["value"],
                            category=item["category"],
                            source=name,
                            description=item["description"],
                            is_active=True,
                            created_at=now_utc,
                            last_synced_at=now_utc
                        )
                        db.add(ioc_rec)
                        ingested_for_feed += 1

                await db.commit()
                total_ingested += ingested_for_feed
                sync_results[name] = {"status": "SUCCESS", "count": ingested_for_feed}

            except Exception as e:
                await db.rollback()
                logger.error(f"Error syncing feed {name}: {e}")
                sync_results[name] = {"status": "ERROR", "error": str(e), "count": 0}

    return {
        "status": "success",
        "ingested_count": total_ingested,
        "feed_results": sync_results
    }


