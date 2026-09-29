import React, { useState, useEffect } from 'react';
import { Database, Send, ShieldCheck, FileCode, Hash, Globe } from 'lucide-react';
import { apiClient } from '../../services/api';

export const IocUpdateTab = () => {
  const [iocs, setIocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    ioc_type: 'HASH_SHA256',
    value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    description: 'SHA256 Hash Trojan Payload',
    severity: 'High'
  });

  const fetchIocs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/ioc');
      setIocs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch IOCs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIocs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    try {
      await apiClient.post('/ioc', form);
      setMsg('IOC & Signature payload deployed down to agents successfully!');
      fetchIocs();
    } catch (err) {
      setMsg('Failed to deploy IOC: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const getIocIcon = (type) => {
    switch (type) {
      case 'HASH_MD5':
      case 'HASH_SHA256':
        return <Hash size={16} className="text-accent" />;
      case 'YARA_RULE':
        return <FileCode size={16} className="text-warning" />;
      case 'MALICIOUS_IP':
      case 'MALICIOUS_DOMAIN':
        return <Globe size={16} className="text-danger" />;
      default:
        return <Database size={16} />;
    }
  };

  return (
    <div className="tab-container">
      <div className="tab-header-banner">
        <div className="flex items-center gap-3">
          <Database size={28} className="text-accent" />
          <div>
            <h2>Feature 3: IOC & Signature Distribution Engine</h2>
            <p>Push file hashes (MD5/SHA256), YARA detection rules, and malicious IP/Domain blocklists down to connected agents.</p>
          </div>
        </div>
      </div>

      <div className="tab-grid">
        {/* Form Deploy IOC */}
        <div className="card-panel">
          <div className="panel-title flex items-center gap-2">
            <Send size={18} className="text-accent" />
            <span>Deploy New IOC / Signature to Agents</span>
          </div>

          {msg && (
            <div className={`banner-alert ${msg.includes('Failed') ? 'alert-danger' : 'alert-success'}`}>
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-stack">
            <div className="form-group">
              <label>IOC Category (Type)</label>
              <select
                value={form.ioc_type}
                onChange={(e) => setForm({ ...form, ioc_type: e.target.value })}
                className="form-select"
              >
                <option value="HASH_SHA256">File Hash (SHA256)</option>
                <option value="HASH_MD5">File Hash (MD5)</option>
                <option value="YARA_RULE">YARA Detection Rule</option>
                <option value="MALICIOUS_IP">Malicious IP (IP Blacklist)</option>
                <option value="MALICIOUS_DOMAIN">Malicious Domain (Domain Blacklist)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Payload Value / Rule Specification Text</label>
              <textarea
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="form-textarea font-mono"
                rows={4}
                required
              />
            </div>

            <div className="form-group">
              <label>Rule Description / Threat Label</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Assigned Threat Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="form-select"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Deploying...' : 'Deploy IOC Payload Immediately'}
            </button>
          </form>
        </div>

        {/* IOC List */}
        <div className="card-panel">
          <div className="panel-title flex items-center gap-2">
            <ShieldCheck size={18} className="text-accent" />
            <span>Deployed IOC Repository ({iocs.length})</span>
          </div>

          {loading ? (
            <div className="table-loading">Loading IOC repository...</div>
          ) : iocs.length === 0 ? (
            <div className="empty-state">No IOC signatures deployed yet.</div>
          ) : (
            <div className="schedule-list">
              {iocs.map((item) => (
                <div key={item.id} className="schedule-item">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getIocIcon(item.ioc_type)}
                      <span className="font-semibold text-main">{item.ioc_type}</span>
                    </div>
                    <span className="badge badge-high">{item.status}</span>
                  </div>
                  <div className="path-code font-mono text-xs my-1">{item.value}</div>
                  <div className="text-xs text-muted">{item.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
