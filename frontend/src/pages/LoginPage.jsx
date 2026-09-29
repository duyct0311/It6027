import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!username.trim() || !password.trim()) {
      setLocalError('Please enter both username and password.');
      return;
    }

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setLocalError(err.message || 'Invalid username or password.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand-header">
          <div className="shield-icon-wrapper">
            <Shield className="shield-icon" size={38} />
          </div>
          <h1 className="brand-title">Malware Scan Manager</h1>
          <p className="brand-subtitle">Single Admin Authentication Control</p>
        </div>

        {localError && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{localError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Admin Username</label>
            <div className="input-field-wrapper">
              <User className="input-icon" size={18} />
              <input
                id="username"
                type="text"
                placeholder="Enter admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-field-wrapper">
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span className="spinner-text">Authenticating...</span>
            ) : (
              <span>Sign In as Admin</span>
            )}
          </button>
        </form>

        <div className="login-footer">
          <CheckCircle2 size={14} className="text-success" />
          <span>Protected by Mutual Authentication & JWT Encryption</span>
        </div>
      </div>
    </div>
  );
};
