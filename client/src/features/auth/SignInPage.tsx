import React, { useState, useEffect } from 'react';
import { Ship, Lock, Mail, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2, User, Key } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export const SignInPage: React.FC = () => {
  const { login } = useTelemetry();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recentlyCreated, setRecentlyCreated] = useState<{
    identifier: string;
    username: string;
    password?: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('last_created_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentlyCreated(parsed);
        if (parsed.identifier && parsed.password) {
          setEmailOrUsername(parsed.username || parsed.identifier);
          setPassword(parsed.password);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await login(emailOrUsername, password);
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err?.message || (typeof err?.error === 'string' ? err.error : 'Invalid credentials or connection error');
      setErrorMsg(typeof msg === 'object' ? JSON.stringify(msg) : String(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillTesterAdmin = () => {
    setEmailOrUsername('TESTER_ADMIN');
    setPassword('TesterAdmin@2026!');
    setErrorMsg(null);
  };

  const handleQuickFillOperator = () => {
    setEmailOrUsername('OPERATOR');
    setPassword('Operator@2026!');
    setErrorMsg(null);
  };

  const handleQuickFillCreatedUser = () => {
    if (recentlyCreated) {
      setEmailOrUsername(recentlyCreated.username || recentlyCreated.identifier);
      if (recentlyCreated.password) setPassword(recentlyCreated.password);
      setErrorMsg(null);
    }
  };

  return (
    <div className="login-screen-wrapper">
      {/* Background glowing ocean ambient gradients */}
      <div className="login-ambient-glow glow-1" />
      <div className="login-ambient-glow glow-2" />

      <div className="login-card-container">
        {/* Header Branding */}
        <div className="login-card-header">
          <div className="login-logo-badge">
            <Ship size={28} className="text-cyan" />
          </div>
          <h1 className="login-title">SJV Tanker SCADA</h1>
          <p className="login-subtitle">
            Enterprise Vessel Monitoring & Telemetry Ingestion Platform
          </p>
          <div className="login-policy-tag">
            <ShieldCheck size={13} />
            <span>Authorized Corporate Access Only (@sjvmarine.com)</span>
          </div>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div className="login-error-banner">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Recently created user notification banner */}
        {recentlyCreated && (
          <div
            className="alert-notice-box mb-3 cursor-pointer"
            onClick={handleQuickFillCreatedUser}
            title="Click to fill newly provisioned account credentials"
          >
            <User size={14} className="text-emerald" />
            <div className="text-xs">
              <strong className="text-emerald">Newly Provisioned User Detected:</strong>{' '}
              <span className="font-mono">{recentlyCreated.username}</span> ({recentlyCreated.role}). Click to fill credentials.
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login-email">Mail ID or User Name</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                id="login-email"
                type="text"
                placeholder="USER_NAME or corporate@sjvmarine.com"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Access Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                id="login-password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating Secure Session...</span>
            ) : (
              <>
                <span>Sign In to SCADA Workstation</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick Testing Accounts Section */}
        <div className="login-tester-section">
          <div className="tester-divider">
            <span>EVALUATION & PROVISIONED ACCOUNTS</span>
          </div>
          <div className="tester-buttons-grid">
            <button
              type="button"
              className="btn btn-secondary btn-sm tester-btn"
              onClick={handleQuickFillTesterAdmin}
            >
              <CheckCircle2 size={13} className="text-cyan" />
              <span>Fill Tester Admin</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm tester-btn"
              onClick={handleQuickFillOperator}
            >
              <CheckCircle2 size={13} className="text-amber" />
              <span>Fill Operator</span>
            </button>
            {recentlyCreated && (
              <button
                type="button"
                className="btn btn-secondary btn-sm tester-btn"
                onClick={handleQuickFillCreatedUser}
              >
                <CheckCircle2 size={13} className="text-emerald" />
                <span>Fill {recentlyCreated.username}</span>
              </button>
            )}
          </div>
          <p className="tester-note">
            Pre-configured with full RBAC access to VLCC, Suezmax & Aframax test vessels.
          </p>
        </div>

        {/* Footer Security Watermark */}
        <div className="login-footer">
          <span>End-to-End Encrypted Telemetry Gateway</span>
          <span className="dot-sep">•</span>
          <span>Prisma PostgreSQL Storage</span>
          <span className="dot-sep">•</span>
          <span>v2.4.0-prod</span>
        </div>
      </div>
    </div>
  );
};
