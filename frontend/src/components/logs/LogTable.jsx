import React from 'react';
import { ShieldAlert, ShieldCheck, Trash2, Eye, Server, Clock } from 'lucide-react';

export const LogTable = ({ logs, loading, onSelectLog }) => {
  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical':
        return <span className="badge badge-critical">Critical</span>;
      case 'High':
        return <span className="badge badge-high">High</span>;
      case 'Medium':
        return <span className="badge badge-medium">Medium</span>;
      case 'Low':
      default:
        return <span className="badge badge-low">Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DETECTED_ONLY':
        return (
          <span className="status-tag status-detected">
            <Eye size={12} /> DETECTED_ONLY
          </span>
        );
      case 'QUARANTINED':
        return (
          <span className="status-tag status-quarantined">
            <ShieldCheck size={12} /> QUARANTINED
          </span>
        );
      case 'DELETED':
        return (
          <span className="status-tag status-deleted">
            <Trash2 size={12} /> DELETED
          </span>
        );
      default:
        return <span className="status-tag">{status}</span>;
    }
  };

  const formatTimestamp = (timeString) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleString();
    } catch {
      return timeString;
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="table-loading">
        <div className="spinner"></div>
        <span>Loading scan telemetry logs...</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="empty-state">
        <ShieldAlert size={48} className="empty-icon" />
        <h3>No Scan Logs Found</h3>
        <p>No malware scan events match the current filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Agent ID</th>
            <th>Module</th>
            <th>Threat Name</th>
            <th>Target File Path</th>
            <th>Severity</th>
            <th>Action Status</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id || `${log.AgentID}-${log.Time}`} className="table-row">
              <td className="text-muted text-xs whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{formatTimestamp(log.time || log.Time)}</span>
                </div>
              </td>
              <td className="font-mono text-xs text-accent whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <Server size={12} />
                  <span>{(log.agent_id || log.AgentID || '').substring(0, 12)}...</span>
                </div>
              </td>
              <td>
                <span className="module-pill">{log.module || log.Module}</span>
              </td>
              <td className="font-semibold text-main">{log.name || log.Name}</td>
              <td className="font-mono text-xs text-muted truncate-path" title={log.path || log.Path}>
                {log.path || log.Path}
              </td>
              <td>{getSeverityBadge(log.severity || log.Severity)}</td>
              <td>{getStatusBadge(log.status || log.Status)}</td>
              <td>
                <button
                  onClick={() => onSelectLog(log)}
                  className="btn-icon"
                  title="Inspect Log Details"
                >
                  <Eye size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
