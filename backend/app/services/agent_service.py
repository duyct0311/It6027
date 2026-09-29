import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.scan_log import ScanLog

logger = logging.getLogger(__name__)

class AgentService:
    @staticmethod
    async def get_all_agents(db: AsyncSession) -> List[Agent]:
        """
        List all registered agents and update Online/Offline status based on last_seen_at.
        """
        stmt = select(Agent).order_by(Agent.last_seen_at.desc())
        result = await db.execute(stmt)
        agents = result.scalars().all()

        now = datetime.now(timezone.utc)
        # Timeout threshold for offline status: 15 seconds
        offline_threshold = timedelta(seconds=15)

        for agent in agents:
            if agent.last_seen_at and (now - agent.last_seen_at > offline_threshold):
                if agent.status == "ONLINE":
                    agent.status = "OFFLINE"
        
        await db.commit()
        return list(agents)

    @staticmethod
    async def get_dashboard_summary(db: AsyncSession) -> Dict[str, Any]:
        """
        Retrieve summary metrics for the Admin Dashboard.
        """
        now = datetime.now(timezone.utc)
        offline_threshold = timedelta(seconds=15)

        # Count active/total agents
        agents_stmt = select(Agent)
        agents_res = await db.execute(agents_stmt)
        agents = agents_res.scalars().all()

        total_agents = len(agents)
        online_agents = sum(
            1 for a in agents if a.last_seen_at and (now - a.last_seen_at <= offline_threshold)
        )

        # Total scan logs count
        logs_count_stmt = select(func.count()).select_from(ScanLog)
        total_logs_res = await db.execute(logs_count_stmt)
        total_logs = total_logs_res.scalar_one()

        # Count Critical/High threats
        critical_stmt = select(func.count()).select_from(ScanLog).where(ScanLog.severity.in_(["Critical", "High"]))
        critical_res = await db.execute(critical_stmt)
        critical_threats = critical_res.scalar_one()

        return {
            "total_agents": total_agents,
            "online_agents": online_agents,
            "offline_agents": total_agents - online_agents,
            "total_scan_logs": total_logs,
            "critical_threats": critical_threats
        }

agent_service = AgentService()
