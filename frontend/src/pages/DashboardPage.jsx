import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  LogOut,
  Radio,
  User,
  FileText,
  Calendar,
  Database,
  Settings,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
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
    <div className="app-container">
      {/* Vertical Left Sidebar Navigation */}
      <aside className="left-sidebar">
        <div className="sidebar-brand">
          <div className="shield-logo">
            <Shield size={26} />
          </div>
          <div className="brand-text">
            <h1 className="brand-name">Malware Manager</h1>
            <span className="brand-tag">Central Server Hub</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">MAIN FEATURES</div>

          <button
            onClick={() => setActiveTab('logs')}
            className={`nav-item ${activeTab === 'logs' ? 'nav-item-active' : ''}`}
          >
            <FileText size={18} />
            <span>1. Telemetry & Scan Logs</span>
            {activeTab === 'logs' && <ChevronRight size={14} className="ml-auto text-accent" />}
          </button>

          <button
            onClick={() => setActiveTab('schedules')}
            className={`nav-item ${activeTab === 'schedules' ? 'nav-item-active' : ''}`}
          >
            <Calendar size={18} />
            <span>2. Scan Scheduler</span>
            {activeTab === 'schedules' && <ChevronRight size={14} className="ml-auto text-accent" />}
          </button>

          <button
            onClick={() => setActiveTab('ioc')}
            className={`nav-item ${activeTab === 'ioc' ? 'nav-item-active' : ''}`}
          >
            <Database size={18} />
            <span>3. IOC & Signatures</span>
            {activeTab === 'ioc' && <ChevronRight size={14} className="ml-auto text-accent" />}
          </button>

          <button
            onClick={() => setActiveTab('scan_mode')}
            className={`nav-item ${activeTab === 'scan_mode' ? 'nav-item-active' : ''}`}
          >
            <Settings size={18} />
            <span>4. Scan Action Modes</span>
            {activeTab === 'scan_mode' && <ChevronRight size={14} className="ml-auto text-accent" />}
          </button>

          <button
            onClick={() => setActiveTab('ip_block')}
            className={`nav-item ${activeTab === 'ip_block' ? 'nav-item-active' : ''}`}
          >
            <ShieldAlert size={18} />
            <span>5. IP Firewall Control</span>
            {activeTab === 'ip_block' && <ChevronRight size={14} className="ml-auto text-accent" />}
          </button>
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="sidebar-footer">
          <div className="user-info-box">
            <div className="avatar-icon">
              <User size={16} />
            </div>
            <div className="user-details">
              <span className="user-display-name">{user?.username || 'Admin'}</span>
              <span className="user-role-badge">{user?.role || 'Administrator'}</span>
            </div>
          </div>

          <button onClick={logout} className="sidebar-logout-btn" title="Sign Out">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Right Content Layout */}
      <div className="main-viewport">
        {/* Top Header Status Bar */}
        <header className="top-header">
          <div className="header-status-title">
            <h2 className="text-lg font-bold">
              {activeTab === 'logs' && 'Real-time Scan Telemetry & Log Management'}
              {activeTab === 'schedules' && 'Automated Periodic Scan Scheduling'}
              {activeTab === 'ioc' && 'IOC & Threat Signature Distribution Engine'}
              {activeTab === 'scan_mode' && 'Agent Scan Action Mode Configuration'}
              {activeTab === 'ip_block' && 'Network Barrier & IP Firewall Dispatch'}
            </h2>
          </div>

          <div className="header-right">
            {/* WebSocket Connection Status */}
            <div className={`ws-badge ${isConnected ? 'ws-connected' : 'ws-disconnected'}`}>
              <Radio size={14} className={isConnected ? 'animate-pulse' : ''} />
              <span>{isConnected ? 'LIVE FEED ONLINE' : 'FEED DISCONNECTED'}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <main className="dashboard-content">
          {/* Summary Stat Cards */}
          <StatCards summary={summary} />

          {/* Dynamic Feature Tab Render */}
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
      </div>

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
