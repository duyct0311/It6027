import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, HardDrive, Cpu, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../services/api';

export const ScheduleScanTab = ({ agents }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    name: 'Periodic System Scan',
    cron_expression: '0 0 * * *',
    scan_scope: 'C:\\Program Files',
    target_agents: 'ALL',
    scan_mode: 'DETECTED_ONLY'
  });

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/schedules');
      setSchedules(res.data || []);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    try {
      await apiClient.post('/schedules', form);
      setMsg('Scan schedule created successfully!');
      fetchSchedules();
      setForm({
        name: 'Weekly Full System Audit',
        cron_expression: '0 2 * * 0',
        scan_scope: 'C:\\Users',
        target_agents: 'ALL',
        scan_mode: 'DETECTED_ONLY'
      });
    } catch (err) {
      setMsg('Failed to create schedule: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tab-container">
      <div className="tab-header-banner">
        <div className="flex items-center gap-3">
          <Calendar size={28} className="text-accent" />
          <div>
            <h2>Feature 2: Periodic Scan Scheduler</h2>
            <p>Automatically dispatch periodic scan orders to target agents according to Cron expressions.</p>
          </div>
        </div>
      </div>

      <div className="tab-grid">
        {/* Form Create Schedule */}
        <div className="card-panel">
          <div className="panel-title flex items-center gap-2">
            <Plus size={18} className="text-accent" />
            <span>Create New Scan Schedule</span>
          </div>

          {msg && (
            <div className={`banner-alert ${msg.includes('Failed') ? 'alert-danger' : 'alert-success'}`}>
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-stack">
            <div className="form-group">
              <label>Schedule Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Cron Expression (e.g. 0 0 * * * = Daily at Midnight)</label>
              <input
                type="text"
                value={form.cron_expression}
                onChange={(e) => setForm({ ...form, cron_expression: e.target.value })}
                className="form-input font-mono"
                required
              />
            </div>

            <div className="form-group">
              <label>Target Scan Scope (Directory / File Path)</label>
              <input
                type="text"
                value={form.scan_scope}
                onChange={(e) => setForm({ ...form, scan_scope: e.target.value })}
                className="form-input font-mono"
                required
              />
            </div>

            <div className="form-group">
              <label>Target Agents</label>
              <select
                value={form.target_agents}
                onChange={(e) => setForm({ ...form, target_agents: e.target.value })}
                className="form-select"
              >
                <option value="ALL">All Agents (ALL Connected Endpoints)</option>
                {agents.map((a) => (
                  <option key={a.agent_id} value={a.agent_id}>
                    {a.hostname} ({a.agent_id.substring(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Scan Action Mode</label>
              <select
                value={form.scan_mode}
                onChange={(e) => setForm({ ...form, scan_mode: e.target.value })}
                className="form-select"
              >
                <option value="DETECTED_ONLY">Detection Only (Alert Only)</option>
                <option value="QUARANTINE">Quarantine (File Isolation)</option>
                <option value="DELETE">Delete (Permanent Removal)</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating Schedule...' : 'Schedule Scan Now'}
            </button>
          </form>
        </div>

        {/* Schedule List */}
        <div className="card-panel">
          <div className="panel-title flex items-center gap-2">
            <Clock size={18} className="text-accent" />
            <span>Active Configured Schedules ({schedules.length})</span>
          </div>

          {loading ? (
            <div className="table-loading">Loading schedule records...</div>
          ) : schedules.length === 0 ? (
            <div className="empty-state">No active scan schedules configured yet.</div>
          ) : (
            <div className="schedule-list">
              {schedules.map((s) => (
                <div key={s.id} className="schedule-item">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-main">{s.name}</span>
                    <span className="badge badge-low flex items-center gap-1">
                      <CheckCircle2 size={12} /> Active
                    </span>
                  </div>
                  <div className="schedule-details text-xs font-mono text-muted space-y-1">
                    <div>📅 Cron: <span className="text-accent">{s.cron_expression}</span></div>
                    <div>📂 Scope: {s.scan_scope}</div>
                    <div>🖥️ Target: {s.target_agents}</div>
                    <div>🛡️ Mode: {s.scan_mode}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
