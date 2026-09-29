import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, HardDrive, Cpu, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../services/api';

export const ScheduleScanTab = ({ agents }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const [form, setForm] = useState({
    name: 'Quét Định Kỳ Hệ Thống',
    cron_expression: '0 0 * * *',
    scan_scope: 'C:\\Program Files',
    target_agents: 'ALL',
    scan_mode: 'DETECTED_ONLY'
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    try {
      await apiClient.post('/schedules', form);
      setMsg('Đã tạo lịch quét định kỳ thành công!');
      fetchSchedules();
      setForm({
        name: 'Quét Định Kỳ Toàn Diện',
        cron_expression: '0 2 * * 0',
        scan_scope: 'C:\\Users',
        target_agents: 'ALL',
        scan_mode: 'DETECTED_ONLY'
      });
    } catch (err) {
      setMsg('Lỗi khi tạo lịch quét: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tab-container">
      <div className="tab-header-banner">
        <div className="flex items-center gap-3">
          <Calendar size={28} className="text-accent" />
          <div>
            <h2>Tính Năng 2: Lập Lịch Quét Định Kỳ (Scan Scheduling)</h2>
            <p>Tự động phát lệnh định kỳ ra lệnh cho Agent thực hiện quét hệ thống theo biểu thức Cron.</p>
          </div>
        </div>
      </div>

      <div className="tab-grid">
        {/* Form Tạo Lịch Quét */}
        <div className="card-panel">
          <div className="panel-title flex items-center gap-2">
            <Plus size={18} className="text-accent" />
            <span>Tạo Lịch Quét Mới</span>
          </div>

          {msg && (
            <div className={`banner-alert ${msg.includes('Lỗi') ? 'alert-danger' : 'alert-success'}`}>
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-stack">
            <div className="form-group">
              <label>Tên Lịch Quét</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Biểu Thức Cron (Ví dụ: 0 0 * * * = hàng ngày lúc 00:00)</label>
              <input
                type="text"
                value={form.cron_expression}
                onChange={(e) => setForm({ ...form, cron_expression: e.target.value })}
                className="form-input font-mono"
                required
              />
            </div>

            <div className="form-group">
              <label>Phạm Vi Quét (Directory/Path)</label>
              <input
                type="text"
                value={form.scan_scope}
                onChange={(e) => setForm({ ...form, scan_scope: e.target.value })}
                className="form-input font-mono"
                required
              />
            </div>

            <div className="form-group">
              <label>Agent Mục Tiêu</label>
              <select
                value={form.target_agents}
                onChange={(e) => setForm({ ...form, target_agents: e.target.value })}
                className="form-select"
              >
                <option value="ALL">Tất Cả Agent (ALL Connected Agents)</option>
                {agents.map((a) => (
                  <option key={a.agent_id} value={a.agent_id}>
                    {a.hostname} ({a.agent_id.substring(0, 8)})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Chế Độ Quét</label>
              <select
                value={form.scan_mode}
                onChange={(e) => setForm({ ...form, scan_mode: e.target.value })}
                className="form-select"
              >
                <option value="DETECTED_ONLY">Nhận diện & Cảnh báo (Detection Only)</option>
                <option value="QUARANTINE">Cách ly File vi phạm (Quarantine)</option>
                <option value="DELETE">Xóa vĩnh viễn (Delete)</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Đang Tạo Lịch...' : 'Lập Lịch Quét Ngay'}
            </button>
          </form>
        </div>

        {/* Danh Sách Lịch Quét */}
        <div className="card-panel">
          <div className="panel-title flex items-center gap-2">
            <Clock size={18} className="text-accent" />
            <span>Danh Sách Lịch Quét Đã Cấu Hình ({schedules.length})</span>
          </div>

          {loading ? (
            <div className="table-loading">Đang tải danh sách lịch...</div>
          ) : schedules.length === 0 ? (
            <div className="empty-state">Chưa có lịch quét nào được khởi tạo.</div>
          ) : (
            <div className="schedule-list">
              {schedules.map((s) => (
                <div key={s.id} className="schedule-item">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-main">{s.name}</span>
                    <span className="badge badge-low flex items-center gap-1">
                      <CheckCircle2 size={12} /> Đang Hoạt Động
                    </span>
                  </div>
                  <div className="schedule-details text-xs font-mono text-muted space-y-1">
                    <div>📅 Cron: <span className="text-accent">{s.cron_expression}</span></div>
                    <div>📂 Phạm vi: {s.scan_scope}</div>
                    <div>🖥️ Agent: {s.target_agents}</div>
                    <div>🛡️ Chế độ: {s.scan_mode}</div>
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
