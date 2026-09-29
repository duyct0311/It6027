import React, { useState, useEffect, useCallback } from 'react';
import { Shield, LogOut, Radio, User, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useScanLogs } from '../hooks/useScanLogs';
import { useWebSocket } from '../hooks/useWebSocket';
import { StatCards } from '../components/common/StatCards';
import { AgentListCard } from '../components/agents/AgentListCard';
import { LogFilterBar } from '../components/logs/LogFilterBar';
import { LogTable } from '../components/logs/LogTable';
import { LogDetailModal } from '../components/logs/LogDetailModal';
import { apiClient } from '../services/api';

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { logs, total, loading, filters, updateFilters, refresh, prependRealtimeLog } = useScanLogs();
  
  const [agents, setAgents] = useState([]);
  const [summary, setSummary] = useState({});
  const [selectedLog, setSelectedLog] = useState(null);

  // Fetch agent listing & summary metrics
  const fetchAgentsAndSummary = useCallback(async () => {
    try {
      const [agentsRes, summaryRes] = await Promise.all([
        apiClient.get('/agents'),
        apiClient.get('/agents/summary')
      ]);
      setAgents(agentsRes.data || []);
      setSummary(summaryRes.data || {});
    } catch (err) {
      console.error('Failed to fetch agents or summary metrics:', err);
    }
  }, []);

  useEffect(() => {
    fetchAgentsAndSummary();
  }, [fetchAgentsAndSummary]);

  // Handle incoming real-time WebSocket messages
  const handleWebSocketMessage = useCallback((message) => {
    if (message.event === 'NEW_SCAN_LOG' && message.data) {
      prependRealtimeLog(message.data);
      fetchAgentsAndSummary();
    }
  }, [prependRealtimeLog, fetchAgentsAndSummary]);

  const { isConnected } = useWebSocket(handleWebSocketMessage);

  return (
    <div className="dashboard-layout">
      {/* Top Navbar */}
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="shield-logo">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="header-title">Malware Scan Manager</h1>
            <span className="header-subtitle">Real-time Telemetry & Agent Operations</span>
          </div>
        </div>

        <div className="header-right">
          {/* WebSocket Status Indicator */}
          <div className={`ws-badge ${isConnected ? 'ws-connected' : 'ws-disconnected'}`}>
            <Radio size={14} className={isConnected ? 'animate-pulse' : ''} />
            <span>{isConnected ? 'LIVE FEED ACTIVE' : 'DISCONNECTED'}</span>
          </div>

          {/* Admin User Profile */}
          <div className="user-profile">
            <User size={16} />
            <span className="user-name">{user?.username || 'Admin'}</span>
            <span className="role-tag">{user?.role || 'Admin'}</span>
          </div>

          {/* Logout Button */}
          <button onClick={logout} className="btn-logout" title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Stat Summary Cards */}
        <StatCards summary={summary} />

        {/* Dashboard Grid: Agents Sidebar & Log Management */}
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
              onRefresh={() => {
                refresh();
                fetchAgentsAndSummary();
              }}
              loading={loading}
            />

            <div className="table-wrapper-card">
              <div className="table-header-info">
                <span className="font-semibold text-main">
                  Malware Telemetry Logs ({total.toLocaleString()} total events)
                </span>
                {filters.agent_id && (
                  <span className="text-xs text-accent">
                    Filtered by Agent: {filters.agent_id}
                  </span>
                )}
              </div>

              <LogTable
                logs={logs}
                loading={loading}
                onSelectLog={(log) => setSelectedLog(log)}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Log Detail Modal */}
      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
};
