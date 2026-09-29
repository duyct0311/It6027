import React from 'react';
import { AgentListCard } from '../agents/AgentListCard';
import { LogFilterBar } from '../logs/LogFilterBar';
import { LogTable } from '../logs/LogTable';

export const ScanLogsTab = ({
  agents,
  logs,
  total,
  loading,
  filters,
  updateFilters,
  refresh,
  onSelectLog
}) => {
  return (
    <div className="dashboard-grid">
      {/* Left Sidebar: Connected Agents */}
      <div className="sidebar-col">
        <AgentListCard
          agents={agents}
          selectedAgentId={filters.agent_id}
          onSelectAgent={(agentId) => updateFilters({ agent_id: agentId })}
        />
      </div>

      {/* Right Area: Log Filter Bar & Telemetry Table */}
      <div className="content-col">
        <LogFilterBar
          filters={filters}
          onFilterChange={updateFilters}
          agents={agents}
          onRefresh={refresh}
          loading={loading}
        />

        <div className="table-wrapper-card">
          <div className="table-header-info">
            <span className="font-semibold text-main">
              Nhật Ký Quét Real-time ({total.toLocaleString()} sự kiện)
            </span>
            {filters.agent_id && (
              <span className="text-xs text-accent font-mono">
                Agent: {filters.agent_id}
              </span>
            )}
          </div>

          <LogTable
            logs={logs}
            loading={loading}
            onSelectLog={onSelectLog}
          />
        </div>
      </div>
    </div>
  );
};
