import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  HardDrive,
  Cpu,
  CheckCircle2,
  Zap,
  Folder,
  Sliders,
  ShieldAlert,
  Server,
  Layers
} from 'lucide-react';
import { apiClient } from '../../services/api';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon', full: 'Monday' },
  { id: 2, label: 'Tue', full: 'Tuesday' },
  { id: 3, label: 'Wed', full: 'Wednesday' },
  { id: 4, label: 'Thu', full: 'Thursday' },
  { id: 5, label: 'Fri', full: 'Friday' },
  { id: 6, label: 'Sat', full: 'Saturday' },
  { id: 0, label: 'Sun', full: 'Sunday' }
];

const SCOPE_PRESETS = [
  { id: 'prog_files', label: 'Program Files', path: 'C:\\Program Files', icon: HardDrive },
  { id: 'user_dirs', label: 'User Profiles', path: 'C:\\Users', icon: Folder },
  { id: 'system_temp', label: 'System Temp', path: 'C:\\Windows\\Temp', icon: Zap },
  { id: 'root_drive', label: 'Full System (C:)', path: 'C:\\', icon: Cpu },
  { id: 'custom', label: 'Custom Path', path: '', icon: Sliders }
];

export const ScheduleScanTab = ({ agents }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  // Interactive Widget States
  const [name, setName] = useState('Periodic Malware Scan');
  const [frequency, setFrequency] = useState('daily'); // 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom'
  const [hour, setHour] = useState('02');
  const [minute, setMinute] = useState('00');
  const [dayOfWeek, setDayOfWeek] = useState(1); // 1 = Monday
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [customCron, setCustomCron] = useState('0 2 * * *');

  // Scope Widget State
  const [selectedScopePreset, setSelectedScopePreset] = useState('prog_files');
  const [customPath, setCustomPath] = useState('C:\\Program Files');

  // Target Agents & Mode State
  const [targetAgent, setTargetAgent] = useState('ALL');
  const [scanMode, setScanMode] = useState('DETECTED_ONLY');

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

  // Compute Cron string dynamically based on widgets
  const computeCron = () => {
    if (frequency === 'custom') return customCron;
    const m = parseInt(minute, 10) || 0;
    const h = parseInt(hour, 10) || 0;

    switch (frequency) {
      case 'hourly':
        return `${m} * * * *`;
      case 'daily':
        return `${m} ${h} * * *`;
      case 'weekly':
        return `${m} ${h} * * ${dayOfWeek}`;
      case 'monthly':
        const dom = Math.min(Math.max(parseInt(dayOfMonth, 10) || 1, 1), 31);
        return `${m} ${h} ${dom} * *`;
      default:
        return `${m} ${h} * * *`;
    }
  };

  // Compute Human readable summary string
  const computeHumanText = () => {
    if (frequency === 'custom') return `Custom Cron Pattern (${customCron})`;
    const pad = (n) => String(n).padStart(2, '0');
    const timeStr = `${pad(hour)}:${pad(minute)}`;

    switch (frequency) {
      case 'hourly':
        return `Runs Every Hour at :${pad(minute)} minute`;
      case 'daily':
        return `Runs Every Day at ${timeStr}`;
      case 'weekly': {
        const dayObj = DAYS_OF_WEEK.find((d) => d.id === dayOfWeek);
        return `Runs Every ${dayObj?.full || 'Day'} at ${timeStr}`;
      }
      case 'monthly':
        return `Runs Monthly on Day ${dayOfMonth} at ${timeStr}`;
      default:
        return `Runs Every Day at ${timeStr}`;
    }
  };

  const getEffectivePath = () => {
    if (selectedScopePreset === 'custom') return customPath;
    const preset = SCOPE_PRESETS.find((p) => p.id === selectedScopePreset);
    return preset ? preset.path : customPath;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');

    const cronExpr = computeCron();
    const finalScope = getEffectivePath();

    const payload = {
      name,
      cron_expression: cronExpr,
      scan_scope: finalScope,
      target_agents: targetAgent,
      scan_mode: scanMode
    };

    try {
      await apiClient.post('/schedules', payload);
      setMsg('Scan schedule created successfully!');
      fetchSchedules();
      // Reset form defaults
      setName('Weekly Full System Audit');
    } catch (err) {
      setMsg('Failed to create schedule: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tab-container">
      {/* Banner Header */}
      <div className="tab-header-banner">
        <div className="flex items-center gap-3">
          <Calendar size={28} className="text-accent" />
          <div>
            <h2>Feature 2: Automated Scan Scheduler</h2>
            <p>Configure automated periodic scan schedules using interactive date, time, and frequency widgets.</p>
          </div>
        </div>
      </div>

      <div className="tab-grid">
        {/* Left Column: Interactive Schedule Creator Form */}
        <div className="card-panel">
          <div className="panel-title flex items-center gap-2">
            <Plus size={18} className="text-accent" />
            <span>Schedule Configuration Widgets</span>
          </div>

          {msg && (
            <div className={`banner-alert ${msg.includes('Failed') ? 'alert-danger' : 'alert-success'}`}>
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-stack">
            {/* Schedule Title */}
            <div className="form-group">
              <label>Schedule Task Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="e.g. Daily Malware Deep Audit"
                required
              />
            </div>

            {/* WIDGET 1: Frequency Selector Tiles */}
            <div className="form-group">
              <label>1. Scan Frequency</label>
              <div className="widget-grid">
                <button
                  type="button"
                  onClick={() => setFrequency('hourly')}
                  className={`widget-card ${frequency === 'hourly' ? 'widget-card-active' : ''}`}
                >
                  <Zap size={20} className="widget-icon" />
                  <span className="widget-title">Hourly</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFrequency('daily')}
                  className={`widget-card ${frequency === 'daily' ? 'widget-card-active' : ''}`}
                >
                  <Clock size={20} className="widget-icon" />
                  <span className="widget-title">Daily</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFrequency('weekly')}
                  className={`widget-card ${frequency === 'weekly' ? 'widget-card-active' : ''}`}
                >
                  <Calendar size={20} className="widget-icon" />
                  <span className="widget-title">Weekly</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFrequency('monthly')}
                  className={`widget-card ${frequency === 'monthly' ? 'widget-card-active' : ''}`}
                >
                  <Layers size={20} className="widget-icon" />
                  <span className="widget-title">Monthly</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFrequency('custom')}
                  className={`widget-card ${frequency === 'custom' ? 'widget-card-active' : ''}`}
                >
                  <Sliders size={20} className="widget-icon" />
                  <span className="widget-title">Custom</span>
                </button>
              </div>
            </div>

            {/* WIDGET 2: Time / Date Execution Pickers */}
            {frequency !== 'custom' && (
              <div className="form-group">
                <label>2. Execution Time & Recurrence</label>

                <div className="space-y-3">
                  {/* Time Pickers (Hour & Minute) */}
                  {frequency !== 'hourly' && (
                    <div className="time-picker-grid">
                      <div>
                        <span className="text-xs text-muted block mb-1">Hour (24h format)</span>
                        <select
                          value={hour}
                          onChange={(e) => setHour(e.target.value)}
                          className="form-select font-mono"
                        >
                          {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                            <option key={h} value={h}>
                              {h}:00 ({h > 12 ? `${h - 12} PM` : h === '12' ? '12 PM' : h === '00' ? '12 AM' : `${h} AM`})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-xs text-muted block mb-1">Minute</span>
                        <select
                          value={minute}
                          onChange={(e) => setMinute(e.target.value)}
                          className="form-select font-mono"
                        >
                          {['00', '15', '30', '45'].map((m) => (
                            <option key={m} value={m}>
                              :{m}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {frequency === 'hourly' && (
                    <div>
                      <span className="text-xs text-muted block mb-1">Minute of the Hour</span>
                      <select
                        value={minute}
                        onChange={(e) => setMinute(e.target.value)}
                        className="form-select font-mono"
                      >
                        {['00', '15', '30', '45'].map((m) => (
                          <option key={m} value={m}>
                            At minute :{m} of every hour
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Day of Week Selector Chips */}
                  {frequency === 'weekly' && (
                    <div>
                      <span className="text-xs text-muted block mb-1.5">Select Day of Week</span>
                      <div className="chip-group">
                        {DAYS_OF_WEEK.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setDayOfWeek(d.id)}
                            className={`chip-btn ${dayOfWeek === d.id ? 'chip-btn-active' : ''}`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Day of Month Selector */}
                  {frequency === 'monthly' && (
                    <div>
                      <span className="text-xs text-muted block mb-1">Day of Month (1 - 31)</span>
                      <select
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(e.target.value)}
                        className="form-select font-mono"
                      >
                        {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => (
                          <option key={d} value={d}>
                            Day {d} of the month
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Custom Cron Input */}
            {frequency === 'custom' && (
              <div className="form-group">
                <label>Custom Cron Expression (Minute Hour Day-of-Month Month Day-of-Week)</label>
                <input
                  type="text"
                  value={customCron}
                  onChange={(e) => setCustomCron(e.target.value)}
                  className="form-input font-mono"
                  placeholder="e.g. 0 0 * * *"
                  required
                />
              </div>
            )}

            {/* WIDGET 3: Computed Human Summary Banner */}
            <div className="cron-summary-banner">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-accent flex-shrink-0" />
                <div>
                  <div className="font-semibold text-main text-xs">{computeHumanText()}</div>
                  <div className="text-xs font-mono text-muted">
                    Generated Cron: <span className="text-accent font-bold">{computeCron()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* WIDGET 4: Scan Scope Presets */}
            <div className="form-group">
              <label>3. Target Scan Scope (Directory / File Path)</label>
              <div className="scope-grid mb-2">
                {SCOPE_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedScopePreset(preset.id);
                        if (preset.path) setCustomPath(preset.path);
                      }}
                      className={`scope-tile ${selectedScopePreset === preset.id ? 'scope-tile-active' : ''}`}
                    >
                      <Icon size={14} />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>

              {selectedScopePreset === 'custom' ? (
                <input
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  className="form-input font-mono mt-1"
                  placeholder="e.g. C:\CustomPath\To\Scan"
                  required
                />
              ) : (
                <div className="text-xs font-mono text-accent bg-card p-2 rounded border border-border">
                  📁 Selected Scope: {getEffectivePath()}
                </div>
              )}
            </div>

            {/* WIDGET 5: Target Agent Selector */}
            <div className="form-group">
              <label>4. Target Agents</label>
              <select
                value={targetAgent}
                onChange={(e) => setTargetAgent(e.target.value)}
                className="form-select"
              >
                <option value="ALL">🌐 All Connected Agents ({agents.length} Endpoints)</option>
                {agents.map((a) => (
                  <option key={a.agent_id} value={a.agent_id}>
                    🖥️ {a.hostname || 'Agent'} ({a.agent_id.substring(0, 8)}) - {a.status || 'ONLINE'}
                  </option>
                ))}
              </select>
            </div>

            {/* WIDGET 6: Scan Action Mode */}
            <div className="form-group">
              <label>5. Scan Action Mode</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setScanMode('DETECTED_ONLY')}
                  className={`scope-tile justify-center ${scanMode === 'DETECTED_ONLY' ? 'scope-tile-active' : ''}`}
                >
                  👁️ Alert Only
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('QUARANTINE')}
                  className={`scope-tile justify-center ${scanMode === 'QUARANTINE' ? 'scope-tile-active' : ''}`}
                >
                  🛡️ Quarantine
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('DELETE')}
                  className={`scope-tile justify-center ${scanMode === 'DELETE' ? 'scope-tile-active' : ''}`}
                >
                  🗑️ Auto Delete
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating Schedule...' : 'Schedule Scan Now'}
            </button>
          </form>
        </div>

        {/* Right Column: Active Configured Schedules */}
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
                  <div className="schedule-details text-xs font-mono text-muted space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-accent" />
                      <span>Cron: <strong className="text-accent">{s.cron_expression}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Folder size={12} />
                      <span>Scope: {s.scan_scope}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Server size={12} />
                      <span>Target: {s.target_agents === 'ALL' ? 'All Endpoints' : s.target_agents.substring(0, 12)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert size={12} />
                      <span>Mode: <strong className="text-main">{s.scan_mode}</strong></span>
                    </div>
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
