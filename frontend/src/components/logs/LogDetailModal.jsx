import React from 'react';
import { X, ShieldAlert, FileText, Server, Clock, HardDrive, Cpu, Activity } from 'lucide-react';

export const LogDetailModal = ({ log, onClose }) => {
  if (!log) return null;

  const formatTimestamp = (timeString) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleString() + ` (${timeString})`;
    } catch {
      return timeString;
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <ShieldAlert size={22} className="text-accent" />
            <h2>Malware Telemetry Event Inspection</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label"><Server size={14} /> Agent ID</span>
              <span className="detail-value font-mono">{log.agent_id || log.AgentID}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label"><Clock size={14} /> Event Timestamp</span>
              <span className="detail-value">{formatTimestamp(log.time || log.Time)}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label"><Cpu size={14} /> Detection Engine</span>
              <span className="detail-value">{log.module || log.Module}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label"><Activity size={14} /> Scan Type</span>
              <span className="detail-value">{log.scan_type || log.ScanType}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label"><ShieldAlert size={14} /> Threat Name</span>
              <span className="detail-value font-semibold text-danger">{log.name || log.Name}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Severity & Status</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`badge badge-${(log.severity || log.Severity || '').toLowerCase()}`}>
                  {log.severity || log.Severity}
                </span>
                <span className="status-tag">{log.status || log.Status}</span>
              </div>
            </div>
          </div>

          <div className="path-box">
            <span className="detail-label"><HardDrive size={14} /> Full File System Path</span>
            <div className="path-code font-mono">{log.path || log.Path}</div>
          </div>

          <div className="raw-json-box">
            <span className="detail-label"><FileText size={14} /> Raw JSON Payload</span>
            <pre className="json-code">{JSON.stringify(log, null, 2)}</pre>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Close Inspection
          </button>
        </div>
      </div>
    </div>
  );
};
