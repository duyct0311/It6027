import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldOff, Send, Lock, Unlock, Server } from 'lucide-react';
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
    reason: 'Phát hiện lưu lượng Botnet / Command & Control'
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
      setMsg(`Đã gửi lệnh [${form.action}] IP ${form.ip_address} xuống Agent thành công!`);
      fetchRules();
    } catch (err) {
      setMsg('Lỗi khi gửi lệnh chặn IP: ' + (err.response?.data?.detail || err.message));
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
            <h2>Tính Năng 5: Chặn & Bỏ Chặn IP (Network Barrier Control)</h2>
            <p>Phát lệnh trực tiếp xuống Agent để thực thi việc ngăn chặn (Block) hoặc bỏ ngăn chặn (Unblock) các IP độc hại trên Firewall máy trạm.</p>
          </div>
        </div>
      </div>

      <div className="tab-grid">
        {/* Form Gửi Lệnh Chặn/Bỏ Chặn IP */}
        <div className="card-panel">
          <div className="panel-title flex items-center gap-2">
            <Send size={18} className="text-accent" />
            <span>Phát Lệnh Ngăn Chặn Mạng Mới</span>
          </div>

          {msg && (
            <div className={`banner-alert ${msg.includes('Lỗi') ? 'alert-danger' : 'alert-success'}`}>
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-stack">
            <div className="form-group">
              <label>Hành Động Lệnh (Action)</label>
              <select
                value={form.action}
                onChange={(e) => setForm({ ...form, action: e.target.value })}
                className="form-select"
              >
                <option value="BLOCK">🚫 CHẶN IP (Block Traffic)</option>
                <option value="UNBLOCK">✅ BỎ CHẶN IP (Allow Traffic)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Địa Chỉ IP Mục Tiêu</label>
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
              <label>Agent Nhận Lệnh</label>
              <select
                value={form.target_agents}
                onChange={(e) => setForm({ ...form, target_agents: e.target.value })}
                className="form-select"
              >
                <option value="ALL">Toàn Bộ Agent (ALL Agents)</option>
                {agents.map((a) => (
                  <option key={a.agent_id} value={a.agent_id}>
                    {a.hostname} ({a.agent_id.substring(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Lý Do / Ghi Chú An Ninh</label>
              <input
                type="text"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="form-input"
              />
            </div>

            <button type="submit" className={`btn-primary ${form.action === 'BLOCK' ? 'btn-danger-gradient' : ''}`} disabled={submitting}>
              {submitting ? 'Đang Gửi Lệnh...' : `Gửi Lệnh ${form.action} Xuống Agent`}
            </button>
          </form>
        </div>

        {/* Lịch Sử Gửi Lệnh IP */}
        <div className="card-panel">
          <div className="panel-title flex items-center gap-2">
            <Lock size={18} className="text-accent" />
            <span>Lịch Sử Phát Lệnh IP ({rules.length})</span>
          </div>

          {loading ? (
            <div className="table-loading">Đang tải lịch sử lệnh IP...</div>
          ) : rules.length === 0 ? (
            <div className="empty-state">Chưa có lệnh chặn/bỏ chặn IP nào được khởi tạo.</div>
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
                    <Server size={12} /> Target: {item.target_agents} | Lý do: {item.reason || 'N/A'}
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
