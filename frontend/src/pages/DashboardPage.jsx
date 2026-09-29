import React, { useState, useEffect, useCallback } from 'react';
import { Shield, LogOut, Radio, User, FileText, Calendar, Database, Settings, ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useScanLogs } from '../hooks/useScanLogs';
import { useWebSocket } from '../hooks/useWebSocket';
import { StatCards } from '../components/common/StatCards';
import { LogDetailModal } from '../components/logs/LogDetailModal';

// 5 Main Feature Tabs
import { ScanLogsTab } from '../components/tabs/ScanLogsTab';
import { ScheduleScanTab } from '../components/tabs/ScheduleScanTab';
import { IocUpdateTab } from '../components/tabs/IocUpdateTab';
import { ScanModeTab } from '../components/tabs/ScanModeTab';
import { IpBlockTab } from '../components/tabs/IpBlockTab';

import { apiClient } from '../services/api';

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { logs, total, loading, filters, updateFilters, refresh, prependRealtimeLog } = useScanLogs();
  
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' | 'schedules' | 'ioc' | 'scan_mode' | 'ip_block'
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
            <h1 className="header-title">Malware Scan Agent Manager</h1>
            <span className="header-subtitle">Hệ Thống Quản Lý Agent Quét Mã Độc Tập Trung</span>
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

      {/* Main Navigation Bar - 5 Feature Tabs */}
      <nav className="tab-navigation-bar">
        <button
          onClick={() => setActiveTab('logs')}
          className={`tab-btn ${activeTab === 'logs' ? 'tab-btn-active' : ''}`}
        >
          <FileText size={18} />
          <span>1. Log Quét & Real-time</span>
        </button>

        <button
          onClick={() => setActiveTab('schedules')}
          className={`tab-btn ${activeTab === 'schedules' ? 'tab-btn-active' : ''}`}
        >
          <Calendar size={18} />
          <span>2. Lập Lịch Quét</span>
        </button>

        <button
          onClick={() => setActiveTab('ioc')}
          className={`tab-btn ${activeTab === 'ioc' ? 'tab-btn-active' : ''}`}
        >
          <Database size={18} />
          <span>3. Cập Nhật IOC & Signature</span>
        </button>

        <button
          onClick={() => setActiveTab('scan_mode')}
          className={`tab-btn ${activeTab === 'scan_mode' ? 'tab-btn-active' : ''}`}
        >
          <Settings size={18} />
          <span>4. Chế Độ Quét</span>
        </button>

        <button
          onClick={() => setActiveTab('ip_block')}
          className={`tab-btn ${activeTab === 'ip_block' ? 'tab-btn-active' : ''}`}
        >
          <ShieldAlert size={18} />
          <span>5. Chặn / Bỏ Chặn IP</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Stat Summary Cards */}
        <StatCards summary={summary} />

        {/* Dynamic Tab Content Render */}
        {activeTab === 'logs' && (
          <ScanLogsTab
            agents={agents}
            logs={logs}
            total={total}
            loading={loading}
            filters={filters}
            updateFilters={updateFilters}
            refresh={() => {
              refresh();
              fetchAgentsAndSummary();
            }}
            onSelectLog={(log) => setSelectedLog(log)}
          />
        )}

        {activeTab === 'schedules' && <ScheduleScanTab agents={agents} />}

        {activeTab === 'ioc' && <IocUpdateTab />}

        {activeTab === 'scan_mode' && <ScanModeTab />}

        {activeTab === 'ip_block' && <IpBlockTab agents={agents} />}
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
