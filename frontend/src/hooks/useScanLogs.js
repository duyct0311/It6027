import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';

export const useScanLogs = (initialFilters = {}) => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    agent_id: '',
    severity: '',
    status: '',
    scan_type: '',
    module: '',
    search: '',
    page: 1,
    limit: 50,
    ...initialFilters
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== '' && filters[key] !== null) {
          params[key] = filters[key];
        }
      });

      const response = await apiClient.get('/logs', { params });
      setLogs(response.data.items || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch scan logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1
    }));
  };

  const prependRealtimeLog = (newLog) => {
    setLogs((prev) => [newLog, ...prev.slice(0, filters.limit - 1)]);
    setTotal((prev) => prev + 1);
  };

  return {
    logs,
    total,
    loading,
    error,
    filters,
    updateFilters,
    refresh: fetchLogs,
    prependRealtimeLog
  };
};
