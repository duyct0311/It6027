import React, { useState, useEffect } from 'react';
import { Eye, ShieldCheck, Trash2, CheckCircle2, Shield, Settings } from 'lucide-react';
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
      setMsg(`Đã cập nhật chế độ quét mặc định toàn hệ thống sang [${modeKey}]!`);
    } catch (err) {
      setMsg('Lỗi khi cập nhật chế độ quét: ' + (err.response?.data?.detail || err.message));
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
            <h2>Tính Năng 4: Chọn Chế Độ Quét (Scan Mode Selection)</h2>
            <p>Thiết lập phương án xử lý tự động của Agent khi phát hiện mã độc (Nhận diện / Cách ly / Xóa).</p>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`banner-alert ${msg.includes('Lỗi') ? 'alert-danger' : 'alert-success'}`}>
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
                <CheckCircle2 size={14} /> Đang Áp Dụng
              </span>
            )}
          </div>
          <h3 className="mode-title">1. Nhận Diện (Detection Only)</h3>
          <p className="mode-desc">
            Chỉ thực hiện quét, phát hiện và đưa ra cảnh báo tới Server. Không thay đổi hoặc chỉnh sửa tệp tin trên máy trạm Agent.
          </p>
          <ul className="mode-features">
            <li>✓ An toàn tối đa cho dữ liệu hệ thống</li>
            <li>✓ Phù hợp cho giai đoạn giám sát</li>
            <li>✓ Không nguy cơ xóa nhầm tệp hệ thống</li>
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
                <CheckCircle2 size={14} /> Đang Áp Dụng
              </span>
            )}
          </div>
          <h3 className="mode-title">2. Cách Ly (Quarantine)</h3>
          <p className="mode-desc">
            Tự động cách ly tệp độc hại vào thư mục mã hóa an toàn trên máy trạm Agent. Lưu kèm metadata cho phép khôi phục khi cần.
          </p>
          <ul className="mode-features">
            <li>✓ Ngăn chặn mã độc thực thi ngay lập tức</li>
            <li>✓ Hỗ trợ Rollback (Khôi phục tệp bị cách ly)</li>
            <li>✓ Bảo vệ môi trường làm việc</li>
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
                <CheckCircle2 size={14} /> Đang Áp Dụng
              </span>
            )}
          </div>
          <h3 className="mode-title">3. Xóa (Delete)</h3>
          <p className="mode-desc">
            Xóa vĩnh viễn tệp tin độc hại khỏi ổ đĩa ngay khi phát hiện vi phạm chữ ký / YARA / AI.
          </p>
          <ul className="mode-features">
            <li>✓ Loại bỏ hoàn toàn mối đe dọa</li>
            <li>✓ Không tiêu tốn dung lượng lưu trữ cách ly</li>
            <li>⚠️ Bắt buộc kiểm tra kỹ quy tắc nhận diện</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
