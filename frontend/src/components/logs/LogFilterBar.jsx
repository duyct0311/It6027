import React from 'react';
import { Search, Filter, RefreshCw, X } from 'lucide-react';

export const LogFilterBar = ({ filters, onFilterChange, agents = [], onRefresh, loading }) => {
  const handleInputChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  const handleReset = () => {
    onFilterChange({
      agent_id: '',
      severity: '',
      status: '',
      scan_type: '',
      search: '',
      page: 1
    });
  };

  const hasActiveFilters =
    filters.agent_id || filters.severity || filters.status || filters.scan_type || filters.search;

  return (
    <div className="filter-card">
      <div className="filter-header">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-accent" />
          <span className="font-medium">Filter Scan Telemetry Logs</span>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button onClick={handleReset} className="btn-secondary text-sm">
              <X size={14} />
              Reset Filters
            </button>
          )}
          <button onClick={onRefresh} className="btn-secondary text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Feed
          </button>
        </div>
      </div>

      <div className="filter-grid">
        {/* Search Keyword */}
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search threat name or file path..."
            value={filters.search || ''}
            onChange={(e) => handleInputChange('search', e.target.value)}
            className="filter-input"
          />
        </div>

        {/* Agent Select */}
        <select
          value={filters.agent_id || ''}
          onChange={(e) => handleInputChange('agent_id', e.target.value)}
          className="filter-select"
        >
          <option value="">All Agents ({agents.length})</option>
          {agents.map((agent) => (
            <option key={agent.agent_id} value={agent.agent_id}>
              {agent.hostname || agent.agent_id.substring(0, 8)} ({agent.agent_id.substring(0, 8)})
            </option>
          ))}
        </select>

        {/* Severity Select */}
        <select
          value={filters.severity || ''}
          onChange={(e) => handleInputChange('severity', e.target.value)}
          className="filter-select"
        >
          <option value="">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Status Select */}
        <select
          value={filters.status || ''}
          onChange={(e) => handleInputChange('status', e.target.value)}
          className="filter-select"
        >
          <option value="">All Action Statuses</option>
          <option value="DETECTED_ONLY">DETECTED_ONLY (Alert)</option>
          <option value="QUARANTINED">QUARANTINED (Isolated)</option>
          <option value="DELETED">DELETED (Removed)</option>
        </select>

        {/* Scan Type Select */}
        <select
          value={filters.scan_type || ''}
          onChange={(e) => handleInputChange('scan_type', e.target.value)}
          className="filter-select"
        >
          <option value="">All Scan Types</option>
          <option value="Realtime Protection">Realtime Protection</option>
          <option value="Manual Scan">Manual Scan</option>
          <option value="Scheduled Scan">Scheduled Scan</option>
        </select>
      </div>
    </div>
  );
};
