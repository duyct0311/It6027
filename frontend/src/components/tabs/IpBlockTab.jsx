import React, { useState, useEffect } from 'react';
import { ShieldAlert, Send, Lock, Unlock, Server, Code, CheckCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '../../services/api';

export const IpBlockTab = ({ agents = [] }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    ip_address: '185.220.101.5',
    action: 'BLOCK',
    target_agents: 'ALL',
    reason: 'Detected Botnet / Command & Control Traffic'
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/ip-block');
      setRules(res.data || []);
    } catch (err) {
      console.error('Failed to fetch IP rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    try {
      if (form.action === 'UNBLOCK') {
        await apiClient.post('/ip-block/unblock', {
          ip_address: form.ip_address,
          target_agents: form.target_agents,
          reason: form.reason
        });
      } else {
        await apiClient.post('/ip-block', form);
      }
      setMsg(`Successfully dispatched [${form.action}] directive for IP ${form.ip_address} down to agents!`);
      fetchRules();
    } catch (err) {
      setMsg('Failed to dispatch IP rule: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickUnblock = async (ipAddress, targetAgents) => {
    setSubmitting(true);
    setMsg('');
    try {
      await apiClient.post('/ip-block/unblock', {
        ip_address: ipAddress,
        target_agents: targetAgents || 'ALL',
        reason: 'Unblocked via Web Dashboard'
      });
      setMsg(`Dispatched UNBLOCK directive for IP ${ipAddress} to agents.`);
      fetchRules();
    } catch (err) {
      setMsg('Failed to unblock IP: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Generate real-time live WebSocket payload preview for Windows Agents
  const targetIp = form.ip_address || '185.220.101.5';
  const winCommand = form.action === 'BLOCK'
    ? `netsh advfirewall firewall add rule name="MalwareMgr_Block_${targetIp}" dir=in action=block remoteip=${targetIp}`
    : `netsh advfirewall firewall delete rule name="MalwareMgr_Block_${targetIp}"`;

  const previewPayload = {
    event: form.action === 'BLOCK' ? 'COMMAND_IP_BLOCK' : 'COMMAND_IP_UNBLOCK',
    timestamp: new Date().toISOString(),
    data: {
      action: form.action,
      ip_address: targetIp,
      command: winCommand,
      target_agents: form.target_agents,
      reason: form.reason || '',
      dispatched_at: new Date().toISOString()
    }
  };

  return (
    <div className="tab-container">
      <div className="tab-header-banner">
        <div className="flex items-center gap-3">
          <ShieldAlert size={28} className="text-danger" />
          <div>
            <h2>Feature 5: Windows Firewall IP Barrier & Command Dispatch</h2>
            <p>Dispatch explicit Windows Firewall (netsh advfirewall / PowerShell New-NetFirewallRule) commands directly down to Windows Agents over WebSockets.</p>
          </div>
        </div>
      </div>

      <div className="tab-grid">
        {/* Form Dispatch IP Rule */}
        <div className="card-panel">
          <div className="panel-title flex items-center gap-2">
            <Send size={18} className="text-accent" />
            <span>Dispatch Network Firewall Directive</span>
          </div>

          {msg && (
            <div className={`banner-alert ${msg.includes('Failed') ? 'alert-danger' : 'alert-success'}`}>
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-stack">
            <div className="form-group">
              <label>Directive Action</label>
              <select
                value={form.action}
                onChange={(e) => setForm({ ...form, action: e.target.value })}
                className="form-select"
              >
                <option value="BLOCK">🚫 BLOCK IP (Drop Network Packets)</option>
                <option value="UNBLOCK">✅ UNBLOCK IP (Allow Network Packets)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Target IP Address (IPv4 / IPv6)</label>
              <input
                type="text"
                value={form.ip_address}
                onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
                className="form-input font-mono"
                placeholder="e.g. 185.220.101.5"
                required
              />
            </div>

            <div className="form-group">
              <label>Target Agent Scope</label>
              <select
                value={form.target_agents}
                onChange={(e) => setForm({ ...form, target_agents: e.target.value })}
                className="form-select"
              >
                <option value="ALL">ALL Agents (Broadcast to all active endpoints)</option>
                {agents.map((a) => (
                  <option key={a.agent_id} value={a.agent_id}>
                    {a.hostname} ({a.agent_id.substring(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Reason / Threat Intel Note</label>
              <input
                type="text"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="form-input"
                placeholder="e.g. Feodo Tracker C2 Node"
              />
            </div>

            <button
              type="submit"
              className={`btn-primary ${form.action === 'BLOCK' ? 'btn-danger-gradient' : ''}`}
              disabled={submitting}
            >
              {submitting ? 'Broadcasting Command...' : `Dispatch ${form.action} Directive to Agents`}
            </button>
          </form>

          {/* Live WebSocket Command Preview */}
          <div className="mt-4 pt-3 border-t border-slate-700">
            <div className="flex items-center gap-2 text-xs font-bold text-muted mb-2">
              <Code size={14} className="text-accent" />
              <span>LIVE WEBSOCKET PAYLOAD PREVIEW</span>
            </div>
            <pre className="bg-slate-900 p-3 rounded text-xs font-mono text-green-400 overflow-x-auto border border-slate-800">
              {JSON.stringify(previewPayload, null, 2)}
            </pre>
          </div>
        </div>

        {/* IP Rule History & Active Rules */}
        <div className="card-panel">
          <div className="panel-title flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock size={18} className="text-accent" />
              <span>Firewall Rules History ({rules.length})</span>
            </div>
            <button
              onClick={fetchRules}
              className="text-xs text-muted hover:text-white flex items-center gap-1"
              title="Refresh rules"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="table-loading">Loading firewall rules history...</div>
          ) : rules.length === 0 ? (
            <div className="empty-state">No firewall rules dispatched yet.</div>
          ) : (
            <div className="schedule-list">
              {rules.map((item) => (
                <div key={item.id} className="schedule-item">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {item.action === 'BLOCK' ? (
                        <Lock size={16} className="text-danger" />
                      ) : (
                        <Unlock size={16} className="text-success" />
                      )}
                      <span className="font-semibold font-mono text-main">{item.ip_address}</span>
                      <span className={`badge ${item.status === 'ACTIVE' ? 'badge-critical' : 'badge-low'}`}>
                        {item.status || item.action}
                      </span>
                    </div>

                    {item.action === 'BLOCK' && item.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleQuickUnblock(item.ip_address, item.target_agents)}
                        className="btn-secondary text-xs py-1 px-2 flex items-center gap-1"
                        disabled={submitting}
                      >
                        <Unlock size={12} /> Unblock
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-muted flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <Server size={12} /> Target: <span className="font-mono">{item.target_agents}</span>
                    </div>
                    <div>{item.created_at || 'Just now'}</div>
                  </div>

                  {item.reason && (
                    <div className="text-xs text-slate-400 mt-1 italic">
                      Reason: {item.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IpBlockTab;

