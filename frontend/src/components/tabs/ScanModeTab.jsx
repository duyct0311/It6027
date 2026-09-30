import React, { useState, useEffect } from 'react';
import { Settings, Zap, ShieldCheck, Cpu, HardDrive, Eye, Trash2, CheckCircle2, Code2, Sliders } from 'lucide-react';
import { apiClient } from '../../services/api';

export const ScanModeTab = () => {
  const [activeConfig, setActiveConfig] = useState({
    mode_name: 'Quick Scan',
    action_mode: 'DETECTED_ONLY',
    target_paths: ['C:\\Windows\\Temp', 'C:\\Users\\Public'],
    max_file_size_mb: 50,
    enable_yara: true,
    enable_ai_heuristics: true,
    scan_priority: 'NORMAL',
    file_extensions_exclude: '.iso,.vhd,.tmp'
  });

  const [form, setForm] = useState({
    mode_name: 'Quick Scan',
    action_mode: 'DETECTED_ONLY',
    target_paths: 'C:\\Windows\\Temp\nC:\\Users\\Public',
    max_file_size_mb: 50,
    enable_yara: true,
    enable_ai_heuristics: true,
    scan_priority: 'NORMAL',
    file_extensions_exclude: '.iso,.vhd,.tmp'
  });

  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchScanMode = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/scan-mode');
      if (res.data) {
        setActiveConfig(res.data);
        setForm({
          mode_name: res.data.mode_name || 'Quick Scan',
          action_mode: res.data.action_mode || 'DETECTED_ONLY',
          target_paths: (res.data.target_paths || []).join('\n'),
          max_file_size_mb: res.data.max_file_size_mb || 50,
          enable_yara: res.data.enable_yara ?? true,
          enable_ai_heuristics: res.data.enable_ai_heuristics ?? true,
          scan_priority: res.data.scan_priority || 'NORMAL',
          file_extensions_exclude: res.data.file_extensions_exclude || '.iso,.vhd,.tmp'
        });
      }
    } catch (err) {
      console.error('Failed to fetch scan mode config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScanMode();
  }, []);

  const handleSelectPreset = (presetName) => {
    let presetData = {};
    if (presetName === 'Quick Scan') {
      presetData = {
        ...form,
        mode_name: 'Quick Scan',
        target_paths: 'C:\\Windows\\Temp\nC:\\Users\\Public',
        max_file_size_mb: 50,
        scan_priority: 'NORMAL',
        file_extensions_exclude: '.iso,.vhd,.tmp'
      };
    } else if (presetName === 'Full System Scan') {
      presetData = {
        ...form,
        mode_name: 'Full System Scan',
        target_paths: 'C:\\\nD:\\',
        max_file_size_mb: 250,
        scan_priority: 'HIGH',
        file_extensions_exclude: '.iso,.vhd'
      };
    } else {
      presetData = {
        ...form,
        mode_name: 'Custom / Deep Scan',
        target_paths: 'C:\\ProgramData\nC:\\Users',
        max_file_size_mb: 500,
        scan_priority: 'LOW',
        file_extensions_exclude: '.iso,.vhd,.bak'
      };
    }
    setForm(presetData);
  };

  const handleSelectActionMode = (actionModeKey) => {
    setForm({ ...form, action_mode: actionModeKey });
  };

  const handleDeployConfig = async (e) => {
    if (e) e.preventDefault();
    setDeploying(true);
    setMsg('');

    try {
      const pathsArray = form.target_paths
        .split('\n')
        .flatMap(p => p.split(','))
        .map(p => p.strip ? p.strip() : p.trim())
        .filter(Boolean);

      const payload = {
        mode_name: form.mode_name,
        action_mode: form.action_mode,
        target_paths: pathsArray,
        max_file_size_mb: Number(form.max_file_size_mb) || 50,
        enable_yara: form.enable_yara,
        enable_ai_heuristics: form.enable_ai_heuristics,
        scan_priority: form.scan_priority,
        file_extensions_exclude: form.file_extensions_exclude
      };

      const res = await apiClient.post('/scan-mode', payload);
      setMsg(`⚡ ${res.data?.message || 'Scan Mode & Response Action deployed to connected agents successfully!'}`);
      fetchScanMode();
    } catch (err) {
      setMsg('Failed to deploy scan mode: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="tab-container">
      {/* Banner Header */}
      <div className="tab-header-banner flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings size={28} className="text-accent" />
          <div>
            <h2>Feature 4: Agent Scan Mode & Threat Response Action</h2>
            <p>Configure threat response behavior (Alert / Quarantine / Delete), target paths, heuristics, and push JSON config to Agents.</p>
          </div>
        </div>

        <button
          onClick={handleDeployConfig}
          className="btn-primary flex items-center gap-2"
          disabled={deploying}
          style={{ width: 'auto' }}
        >
          <Zap size={16} className={deploying ? 'animate-pulse text-warning' : ''} />
          <span>{deploying ? 'Deploying to Agents...' : 'Deploy Config to Agents'}</span>
        </button>
      </div>

      {msg && (
        <div className={`banner-alert ${msg.includes('Failed') ? 'alert-danger' : 'alert-success'}`}>
          {msg}
        </div>
      )}

      {/* 1. Threat Response Action Selection Grid (DETECTED_ONLY / QUARANTINE / DELETE) */}
      <div className="mb-4">
        <div className="section-title text-xs font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
          <span>1. Threat Response Action Mode (Enforced on Endpoint Detection)</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {/* Action 1: DETECTED_ONLY */}
          <div
            onClick={() => handleSelectActionMode('DETECTED_ONLY')}
            className={`stat-card cursor-pointer hover:border-warning transition-all ${
              form.action_mode === 'DETECTED_ONLY' ? 'border-2 border-warning bg-warning/5' : ''
            }`}
          >
            <div className="stat-icon-wrapper text-warning">
              <Eye size={26} />
            </div>
            <div className="stat-info">
              <div className="flex items-center justify-between">
                <span className="stat-label font-bold text-main">Detection Only (Alert Only)</span>
                {activeConfig.action_mode === 'DETECTED_ONLY' && (
                  <span className="badge badge-low text-xs">Active</span>
                )}
              </div>
              <p className="text-xs text-muted mt-1">Scan & raise telemetry alerts. Zero file mutation on client endpoints.</p>
            </div>
          </div>

          {/* Action 2: QUARANTINE */}
          <div
            onClick={() => handleSelectActionMode('QUARANTINE')}
            className={`stat-card cursor-pointer hover:border-info transition-all ${
              form.action_mode === 'QUARANTINE' ? 'border-2 border-info bg-info/5' : ''
            }`}
          >
            <div className="stat-icon-wrapper text-info">
              <ShieldCheck size={26} />
            </div>
            <div className="stat-info">
              <div className="flex items-center justify-between">
                <span className="stat-label font-bold text-main">Quarantine (Isolation)</span>
                {activeConfig.action_mode === 'QUARANTINE' && (
                  <span className="badge badge-high text-xs">Active</span>
                )}
              </div>
              <p className="text-xs text-muted mt-1">Safely isolate malicious files into encrypted local quarantine path.</p>
            </div>
          </div>

          {/* Action 3: DELETE */}
          <div
            onClick={() => handleSelectActionMode('DELETE')}
            className={`stat-card cursor-pointer hover:border-danger transition-all ${
              form.action_mode === 'DELETE' ? 'border-2 border-danger bg-danger/5' : ''
            }`}
          >
            <div className="stat-icon-wrapper text-danger">
              <Trash2 size={26} />
            </div>
            <div className="stat-info">
              <div className="flex items-center justify-between">
                <span className="stat-label font-bold text-main">Delete (Permanent Removal)</span>
                {activeConfig.action_mode === 'DELETE' && (
                  <span className="badge badge-high text-xs">Active</span>
                )}
              </div>
              <p className="text-xs text-muted mt-1">Permanently remove verified malware artifacts from target paths.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Preset Scan Scope Selection Grid */}
      <div className="mb-4">
        <div className="section-title text-xs font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
          <span>2. Scan Scope Profile Preset</span>
        </div>
        <div className="stats-grid">
          <div
            onClick={() => handleSelectPreset('Quick Scan')}
            className={`stat-card cursor-pointer hover:border-accent transition-all ${
              form.mode_name === 'Quick Scan' ? 'border-2 border-accent bg-accent/5' : ''
            }`}
          >
            <div className="stat-icon-wrapper text-accent">
              <Cpu size={22} />
            </div>
            <div className="stat-info">
              <div className="flex items-center justify-between">
                <span className="stat-label font-bold text-main">Quick Scan</span>
                {activeConfig.mode_name === 'Quick Scan' && (
                  <span className="badge badge-low text-xs">Active Scope</span>
                )}
              </div>
              <p className="text-xs text-muted mt-1">System temp & download paths.</p>
            </div>
          </div>

          <div
            onClick={() => handleSelectPreset('Full System Scan')}
            className={`stat-card cursor-pointer hover:border-accent transition-all ${
              form.mode_name === 'Full System Scan' ? 'border-2 border-accent bg-accent/5' : ''
            }`}
          >
            <div className="stat-icon-wrapper text-info">
              <HardDrive size={22} />
            </div>
            <div className="stat-info">
              <div className="flex items-center justify-between">
                <span className="stat-label font-bold text-main">Full System Scan</span>
                {activeConfig.mode_name === 'Full System Scan' && (
                  <span className="badge badge-low text-xs">Active Scope</span>
                )}
              </div>
              <p className="text-xs text-muted mt-1">All local drives (C:\, D:\).</p>
            </div>
          </div>

          <div
            onClick={() => handleSelectPreset('Custom / Deep Scan')}
            className={`stat-card cursor-pointer hover:border-accent transition-all ${
              form.mode_name === 'Custom / Deep Scan' ? 'border-2 border-accent bg-accent/5' : ''
            }`}
          >
            <div className="stat-icon-wrapper text-warning">
              <Sliders size={22} />
            </div>
            <div className="stat-info">
              <div className="flex items-center justify-between">
                <span className="stat-label font-bold text-main">Custom / Deep Scan</span>
                {activeConfig.mode_name === 'Custom / Deep Scan' && (
                  <span className="badge badge-low text-xs">Active Scope</span>
                )}
              </div>
              <p className="text-xs text-muted mt-1">High file size limit & custom paths.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="tab-grid">
        {/* Left Column: Form Settings */}
        <div className="card-panel">
          <div className="panel-title flex items-center gap-2">
            <Sliders size={18} className="text-accent" />
            <span>Detailed Configuration Parameters</span>
          </div>

          <form onSubmit={handleDeployConfig} className="form-stack">
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label>Profile Name</label>
                <input
                  type="text"
                  value={form.mode_name}
                  onChange={(e) => setForm({ ...form, mode_name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Response Action Mode</label>
                <select
                  value={form.action_mode}
                  onChange={(e) => setForm({ ...form, action_mode: e.target.value })}
                  className="form-select font-semibold"
                >
                  <option value="DETECTED_ONLY">1. Detection Only (Alert Only)</option>
                  <option value="QUARANTINE">2. Quarantine (File Isolation)</option>
                  <option value="DELETE">3. Delete (Permanent Removal)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Target Filesystem Paths (One per line or comma-separated)</label>
              <textarea
                value={form.target_paths}
                onChange={(e) => setForm({ ...form, target_paths: e.target.value })}
                className="form-textarea font-mono text-xs"
                rows={3}
                placeholder="C:\Windows\Temp&#10;C:\Users\Public"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label>Max File Size (MB)</label>
                <input
                  type="number"
                  value={form.max_file_size_mb}
                  onChange={(e) => setForm({ ...form, max_file_size_mb: e.target.value })}
                  className="form-input"
                  min={1}
                  max={2048}
                  required
                />
              </div>

              <div className="form-group">
                <label>Execution Priority</label>
                <select
                  value={form.scan_priority}
                  onChange={(e) => setForm({ ...form, scan_priority: e.target.value })}
                  className="form-select"
                >
                  <option value="LOW">LOW (Background)</option>
                  <option value="NORMAL">NORMAL (Standard)</option>
                  <option value="HIGH">HIGH (Priority)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Excluded File Extensions</label>
              <input
                type="text"
                value={form.file_extensions_exclude}
                onChange={(e) => setForm({ ...form, file_extensions_exclude: e.target.value })}
                className="form-input font-mono text-xs"
                placeholder=".iso,.vhd,.tmp"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 my-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={form.enable_yara}
                  onChange={(e) => setForm({ ...form, enable_yara: e.target.checked })}
                  className="form-checkbox"
                />
                <span>Enable YARA Rules Engine</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={form.enable_ai_heuristics}
                  onChange={(e) => setForm({ ...form, enable_ai_heuristics: e.target.checked })}
                  className="form-checkbox"
                />
                <span>Enable AI Heuristics Engine</span>
              </label>
            </div>

            <button type="submit" className="btn-primary mt-2" disabled={deploying}>
              {deploying ? 'Deploying to Agents...' : 'Deploy Config to Agents'}
            </button>
          </form>
        </div>

        {/* Right Column: Active Config JSON Preview */}
        <div className="card-panel">
          <div className="panel-title flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 size={18} className="text-accent" />
              <span>Active Agent Scan Mode JSON Payload</span>
            </div>
            <span className="badge badge-low text-xs">WebSocket Broadcast Payload</span>
          </div>

          <p className="text-xs text-muted mb-3">
            This exact JSON payload is transmitted via WebSocket to all connected agents whenever configuration changes or an agent registers.
          </p>

          <div className="bg-card-bg border border-border-color rounded-lg p-3 font-mono text-xs overflow-x-auto text-accent select-all">
            <pre>{JSON.stringify({
              event: "SYNC_SCAN_MODE",
              timestamp: activeConfig.updated_at,
              data: {
                action: "SYNC_SCAN_MODE",
                mode_name: activeConfig.mode_name,
                action_mode: activeConfig.action_mode,
                target_paths: activeConfig.target_paths,
                max_file_size_mb: activeConfig.max_file_size_mb,
                enable_yara: activeConfig.enable_yara,
                enable_ai_heuristics: activeConfig.enable_ai_heuristics,
                scan_priority: activeConfig.scan_priority,
                file_extensions_exclude: activeConfig.file_extensions_exclude,
                pushed_at: activeConfig.updated_at
              }
            }, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
