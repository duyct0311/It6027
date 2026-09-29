import React, { useState, useEffect } from 'react';
import { ShieldAlert, Send, Lock, Unlock, Server } from 'lucide-react';
import { apiClient } from '../../services/api';

export const IpBlockTab = ({ agents }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    ip_address: '192.168.1.105',
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
      await apiClient.post('/ip-block', form);
      setMsg(`Dispatched [${form.action}] rule for IP ${form.ip_address} down to agents successfully!`);
      fetchRules();
    } catch (err) {
      setMsg('Failed to dispatch IP rule: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tab-container">
      <div className="tab-header-banner">
        <div className="flex items-center gap-3">
          <ShieldAlert size={28} className="text-danger" />
          <div>
            <h2>Feature 5: Network Barrier Control (IP Block / Unblock)</h2>
            <p>Dispatch network barrier directives directly to agents to block or unblock target malicious IP addresses on host firewalls.</p>
          </div>
        </div>
      </div>

      <div className="tab-grid">
        {/* Form Dispatch IP Rule */}
        <div className="card-panel">
          <div className="panel-title flex items-center gap-2">
            <Send size={18} className="text-accent" />
            <span>Dispatch New Network Barrier Rule</span>
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
                <option value="BLOCK">🚫 BLOCK IP (Drop Network Traffic)</option>
                <option value="UNBLOCK">✅ UNBLOCK IP (Allow Network Traffic)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Target IP Address</label>
              <input
                type="text"
                value={form.ip_address}
                onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
                className="form-input font-mono"
                placeholder="192.168.1.100"
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
              <label>Reason / Security Note</label>
              <input
                type="text"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="form-input"
              />
            </div>

            <button type="submit" className={`btn-primary ${form.action === 'BLOCK' ? 'btn-danger-gradient' : ''}`} disabled={submitting}>
              {submitting ? 'Dispatching...' : `Dispatch ${form.action} Rule to Agents`}
            </button>
          </form>
        </div>

        {/* IP Rule History */}
        <div className="card-panel">
          <div className="panel-title flex items-center gap-2">
            <Lock size={18} className="text-accent" />
            <span>Dispatched Network Rule History ({rules.length})</span>
          </div>

          {loading ? (
            <div className="table-loading">Loading IP rule history...</div>
          ) : rules.length === 0 ? (
            <div className="empty-state">No network rules dispatched yet.</div>
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
                    </div>
                    <span className={`badge ${item.action === 'BLOCK' ? 'badge-critical' : 'badge-low'}`}>
                      {item.action}
                    </span>
                  </div>
                  <div className="text-xs text-muted flex items-center gap-2 mt-1">
                    <Server size={12} /> Target: {item.target_agents} | Reason: {item.reason || 'N/A'}
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
