import React, { useState, useEffect } from 'react';
import { Eye, ShieldCheck, Trash2, CheckCircle2, Settings } from 'lucide-react';
import { apiClient } from '../../services/api';

export const ScanModeTab = () => {
  const [currentMode, setCurrentMode] = useState('DETECTED_ONLY');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchMode = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/scan-mode');
      setCurrentMode(res.data?.mode || 'DETECTED_ONLY');
    } catch (err) {
      console.error('Failed to fetch scan mode:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMode();
  }, []);

  const handleSelectMode = async (modeKey) => {
    setUpdating(true);
    setMsg('');
    try {
      await apiClient.post('/scan-mode', { mode: modeKey });
      setCurrentMode(modeKey);
      setMsg(`System-wide scan action mode updated to [${modeKey}]!`);
    } catch (err) {
      setMsg('Failed to update scan mode: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="tab-container">
      <div className="tab-header-banner">
        <div className="flex items-center gap-3">
          <Settings size={28} className="text-accent" />
          <div>
            <h2>Feature 4: Agent Scan Action Mode Configuration</h2>
            <p>Configure automated threat response behavior executed by agents upon malware detection (Detection Only / Quarantine / Delete).</p>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`banner-alert ${msg.includes('Failed') ? 'alert-danger' : 'alert-success'}`}>
          {msg}
        </div>
      )}

      <div className="mode-card-grid">
        {/* Option 1: DETECTED_ONLY */}
        <div
          onClick={() => handleSelectMode('DETECTED_ONLY')}
          className={`mode-selection-card ${currentMode === 'DETECTED_ONLY' ? 'mode-selected' : ''}`}
        >
          <div className="mode-card-header">
            <div className="mode-icon-box text-warning">
              <Eye size={28} />
            </div>
            {currentMode === 'DETECTED_ONLY' && (
              <span className="mode-active-badge">
                <CheckCircle2 size={14} /> Currently Active
              </span>
            )}
          </div>
          <h3 className="mode-title">1. Detection Only (Alert Only)</h3>
          <p className="mode-desc">
            Perform scanning, identify threats, and generate telemetry alerts to the Web Server. No file mutation or deletion occurs on client endpoints.
          </p>
          <ul className="mode-features">
            <li>✓ Maximum safety for system files</li>
            <li>✓ Ideal for initial audit and monitoring</li>
            <li>✓ Zero risk of accidental false-positive deletion</li>
          </ul>
        </div>

        {/* Option 2: QUARANTINE */}
        <div
          onClick={() => handleSelectMode('QUARANTINE')}
          className={`mode-selection-card ${currentMode === 'QUARANTINE' ? 'mode-selected' : ''}`}
        >
          <div className="mode-card-header">
            <div className="mode-icon-box text-info">
              <ShieldCheck size={28} />
            </div>
            {currentMode === 'QUARANTINE' && (
              <span className="mode-active-badge">
                <CheckCircle2 size={14} /> Currently Active
              </span>
            )}
          </div>
          <h3 className="mode-title">2. Quarantine (File Isolation)</h3>
          <p className="mode-desc">
            Safely isolate malicious files into an encrypted quarantine directory on the agent endpoint. Preserves metadata for rollback/restoration.
          </p>
          <ul className="mode-features">
            <li>✓ Instantly neutralizes execution risk</li>
            <li>✓ Supports File Rollback & Restoration</li>
            <li>✓ Secures local client environment</li>
          </ul>
        </div>

        {/* Option 3: DELETE */}
        <div
          onClick={() => handleSelectMode('DELETE')}
          className={`mode-selection-card ${currentMode === 'DELETE' ? 'mode-selected' : ''}`}
        >
          <div className="mode-card-header">
            <div className="mode-icon-box text-danger">
              <Trash2 size={28} />
            </div>
            {currentMode === 'DELETE' && (
              <span className="mode-active-badge">
                <CheckCircle2 size={14} /> Currently Active
              </span>
            )}
          </div>
          <h3 className="mode-title">3. Delete (Permanent Removal)</h3>
          <p className="mode-desc">
            Permanently delete verified malware files from target file paths upon signature / YARA / AI match.
          </p>
          <ul className="mode-features">
            <li>✓ Completely removes threat artifacts</li>
            <li>✓ Consumes zero quarantine storage</li>
            <li>⚠️ Requires verified rule confidence</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
