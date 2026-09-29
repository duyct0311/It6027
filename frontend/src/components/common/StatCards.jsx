import React from 'react';
import { Server, Activity, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

export const StatCards = ({ summary }) => {
  const {
    total_agents = 0,
    online_agents = 0,
    offline_agents = 0,
    total_scan_logs = 0,
    critical_threats = 0
  } = summary || {};

  return (
    <div className="stats-grid">
      {/* Active Agents Card */}
      <div className="stat-card">
        <div className="stat-icon-wrapper text-info">
          <Server size={24} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Active Agents</span>
          <div className="stat-value-group">
            <span className="stat-value">{total_agents}</span>
            <span className="stat-badge badge-online">
              <CheckCircle2 size={12} /> {online_agents} Online
            </span>
          </div>
        </div>
      </div>

      {/* Offline Agents Card */}
      <div className="stat-card">
        <div className="stat-icon-wrapper text-muted">
          <Activity size={24} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Disconnected Agents</span>
          <div className="stat-value-group">
            <span className="stat-value">{offline_agents}</span>
            <span className="stat-subtext text-muted">Awaiting heartbeat</span>
          </div>
        </div>
      </div>

      {/* Total Scans Card */}
      <div className="stat-card">
        <div className="stat-icon-wrapper text-accent">
          <FileText size={24} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Total Telemetry Logs</span>
          <div className="stat-value-group">
            <span className="stat-value">{total_scan_logs.toLocaleString()}</span>
            <span className="stat-subtext">Events Ingested</span>
          </div>
        </div>
      </div>

      {/* Critical Threats Card */}
      <div className="stat-card card-threat">
        <div className="stat-icon-wrapper text-danger">
          <ShieldAlert size={24} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Critical/High Threats</span>
          <div className="stat-value-group">
            <span className="stat-value text-danger">{critical_threats}</span>
            <span className="stat-badge badge-critical">Action Required</span>
          </div>
        </div>
      </div>
    </div>
  );
};
