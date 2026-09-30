import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Send,
  ShieldCheck,
  FileCode,
  Hash,
  Globe,
  RefreshCw,
  Search,
  CheckCircle2,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { apiClient } from '../../services/api';

export const IocUpdateTab = () => {
  const [iocs, setIocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  // Filters state
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Form State
  const [form, setForm] = useState({
    category: 'FileHash',
    value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    description: 'Custom SHA256 Trojan Payload'
  });

  const fetchIocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSource) params.source = selectedSource;
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      const res = await apiClient.get('/ioc', { params });
      setIocs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch IOCs:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSource, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchIocs();
  }, [fetchIocs]);

  const handleSyncFeeds = async () => {
    setSyncing(true);
    setMsg('');
    try {
      const res = await apiClient.post('/ioc/sync');
      const count = res.data?.ingested_count || 0;
      setMsg(`TI Feed Sync Completed! Successfully ingested/updated ${count.toLocaleString()} indicators.`);
      fetchIocs();
    } catch (err) {
      setMsg('Feed Sync Failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    try {
      await apiClient.post('/ioc', form);
      setMsg('Custom Manual IOC payload created & deployed to agents successfully!');
      fetchIocs();
      setForm({
        category: 'MaliciousIP',
        value: '192.168.1.100',
        description: 'Custom Botnet C2 Server IP'
      });
    } catch (err) {
      setMsg('Failed to create manual IOC: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const getIocIcon = (cat) => {
    switch (cat) {
      case 'FileHash':
        return <Hash size={16} className="text-accent flex-shrink-0" />;
      case 'YARA':
        return <FileCode size={16} className="text-warning flex-shrink-0" />;
      case 'MaliciousIP':
      case 'URL':
        return <Globe size={16} className="text-danger flex-shrink-0" />;
      default:
        return <Database size={16} className="flex-shrink-0" />;
    }
  };

  // Calculate summary counts
  const sourceCounts = iocs.reduce((acc, item) => {
    const src = item.source || 'Manual Admin';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="tab-container">
      {/* Banner Header */}
      <div className="tab-header-banner flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database size={28} className="text-accent" />
          <div>
            <h2>Feature 3: Hybrid IOC & Threat Intelligence Engine</h2>
            <p>Automate public Threat Intelligence feed imports (MalwareBazaar, ThreatFox, FeodoTracker, URLhaus) and add custom manual IOCs.</p>
          </div>
        </div>

        <button
          onClick={handleSyncFeeds}
          className="btn-primary flex items-center gap-2"
          disabled={syncing}
          style={{ width: 'auto' }}
        >
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          <span>{syncing ? 'Syncing Public Feeds...' : 'Sync All Feeds Now'}</span>
        </button>
      </div>

      {/* Public TI Feed Provider Status Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper text-accent">
            <Hash size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">MalwareBazaar</span>
            <div className="stat-value-group">
              <span className="stat-value text-accent">{sourceCounts['MalwareBazaar'] || 0}</span>
              <span className="stat-subtext text-muted">Hashes</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper text-info">
            <Globe size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">ThreatFox</span>
            <div className="stat-value-group">
              <span className="stat-value text-info">{sourceCounts['ThreatFox'] || 0}</span>
              <span className="stat-subtext text-muted">C2 IPs/Hashes</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper text-danger">
            <ShieldCheck size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Feodo Tracker</span>
            <div className="stat-value-group">
              <span className="stat-value text-danger">{sourceCounts['FeodoTracker'] || 0}</span>
              <span className="stat-subtext text-muted">Botnet IPs</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper text-warning">
            <Sliders size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Manual Admin Entries</span>
            <div className="stat-value-group">
              <span className="stat-value text-warning">{sourceCounts['Manual Admin'] || 0}</span>
              <span className="stat-subtext text-muted">Custom IOCs</span>
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`banner-alert ${msg.includes('Failed') ? 'alert-danger' : 'alert-success'}`}>
          {msg}
        </div>
      )}

      <div className="tab-grid">
        {/* Left Column: Manual Admin IOC Creation Form */}
        <div className="card-panel">
          <div className="panel-title flex items-center gap-2">
            <Send size={18} className="text-accent" />
            <span>Add Custom Manual IOC Signature</span>
          </div>

          <form onSubmit={handleManualSubmit} className="form-stack">
            <div className="form-group">
              <label>IOC Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="form-select"
              >
                <option value="FileHash">File Hash (MD5 / SHA256)</option>
                <option value="MaliciousIP">Malicious IP (C2 / Botnet)</option>
                <option value="YARA">YARA Detection Rule</option>
                <option value="URL">Malicious URL Link</option>
              </select>
            </div>

            <div className="form-group">
              <label>Indicator Value / Rule Content</label>
              <textarea
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="form-textarea font-mono"
                rows={3}
                placeholder="e.g. e3b0c44298fc... or 192.168.1.100"
                required
              />
            </div>

            <div className="form-group">
              <label>Threat Description / Reference Context</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="form-input"
                placeholder="e.g. Custom Cobalt Strike C2 Server"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Adding IOC...' : 'Add Custom IOC Immediately'}
            </button>
          </form>
        </div>

        {/* Right Column: Ingested IOC Repository & Filter List */}
        <div className="card-panel">
          <div className="panel-title flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={18} className="text-accent" />
              <span>IOC Signature Repository ({iocs.length})</span>
            </div>

            <button onClick={fetchIocs} className="btn-icon" title="Refresh IOCs">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="search-input-wrapper">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search hash or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-input"
              />
            </div>

            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="filter-select text-xs"
            >
              <option value="">All Feed Sources</option>
              <option value="MalwareBazaar">MalwareBazaar</option>
              <option value="ThreatFox">ThreatFox</option>
              <option value="FeodoTracker">FeodoTracker</option>
              <option value="URLhaus">URLhaus</option>
              <option value="Manual Admin">Manual Admin</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select text-xs"
            >
              <option value="">All Categories</option>
              <option value="FileHash">FileHash</option>
              <option value="MaliciousIP">MaliciousIP</option>
              <option value="YARA">YARA</option>
              <option value="URL">URL</option>
            </select>
          </div>

          {loading ? (
            <div className="table-loading">Loading IOC repository...</div>
          ) : iocs.length === 0 ? (
            <div className="empty-state">No IOC signatures found matching filter.</div>
          ) : (
            <div className="schedule-list max-h-96 overflow-y-auto pr-1">
              {iocs.map((item) => (
                <div key={item.id} className="schedule-item">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getIocIcon(item.category || item.ioc_type)}
                      <span className="font-semibold text-main text-xs">{item.category || item.ioc_type}</span>
                    </div>
                    <span className={`badge ${item.source === 'Manual Admin' ? 'badge-high' : 'badge-low'}`}>
                      {item.source || 'Manual Admin'}
                    </span>
                  </div>
                  <div className="path-code font-mono text-xs my-1 select-all break-all">{item.value}</div>
                  <div className="text-xs text-muted truncate">{item.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
