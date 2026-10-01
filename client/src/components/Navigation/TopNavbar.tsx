import React, { useState, useEffect } from 'react';
import {
  useTelemetry,
  AVAILABLE_USERS,
  UserProfile,
} from '../../context/TelemetryContext';
import {
  Ship,
  Radio,
  Clock,
  Zap,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import * as api from '../../services/api';

export const TopNavbar: React.FC = () => {
  const {
    connectionStatus,
    latencySec,
    vessels,
    currentVesselId,
    setCurrentVesselId,
    currentUser,
    setCurrentUser,
    triggerRocSpike,
    resetSimulation,
  } = useTelemetry();

  const [utcTime, setUtcTime] = useState('');
  const [simMenuOpen, setSimMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toUTCString().slice(5, 16);
      const timeStr = now.toISOString().slice(11, 19);
      setUtcTime(`${dateStr} | ${timeStr} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSwitchUser = async (user: UserProfile) => {
    const prevUser = currentUser;
    setCurrentUser(user);
    setRoleMenuOpen(false);

    try {
      const activeVessel = vessels.find((v) => v.vesselId === currentVesselId);
      await api.recordAuditEvent({
        userId: user.userId,
        userName: user.name,
        userRole: user.role,
        action: 'USER_ROLE_SWITCH',
        vesselId: currentVesselId,
        vesselName: activeVessel ? activeVessel.name : 'Commercial Tanker',
        targetEntity: 'SCADA Workstation Session',
        oldValue: `${prevUser.name} (${prevUser.role})`,
        newValue: `${user.name} (${user.role})`,
        details: `Operator identity switched on console workstation.`,
      });
    } catch (err) {
      console.error('Audit logging role switch failed:', err);
    }
  };

  const activeVesselName = vessels.find((v) => v.vesselId === currentVesselId)?.name || 'Vessel';

  return (
    <header className="top-navbar">
      {/* Left: Vessel Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Ship size={18} color="var(--accent-cyan)" />
          <select
            id="vessel-select-dropdown"
            value={currentVesselId}
            onChange={(e) => setCurrentVesselId(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              color: '#fff',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              fontFamily: 'var(--font-heading)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {vessels.map((v) => (
              <option key={v.vesselId} value={v.vesselId}>
                {v.name} (IMO {v.imo}) — {v.status}
              </option>
            ))}
          </select>
        </div>

        {/* Telemetry Health Pill */}
        <div
          id="telemetry-health-pill"
          className={`badge ${
            connectionStatus === 'LIVE'
              ? 'badge-live'
              : connectionStatus === 'CONNECTING'
              ? 'badge-warning'
              : 'badge-offline'
          }`}
          title={`Gateway latency: ${(latencySec * 1000).toFixed(0)} ms`}
        >
          <span
            className={`status-dot ${
              connectionStatus === 'LIVE' ? 'live' : 'offline'
            }`}
          />
          <Radio size={12} />
          {connectionStatus === 'LIVE' ? `LIVE (${latencySec}s)` : connectionStatus}
        </div>
      </div>

      {/* Center: Live UTC Clock */}
      <div
        id="utc-clock-display"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <Clock size={15} color="var(--accent-cyan)" />
        <span>{utcTime}</span>
      </div>

      {/* Right: Simulation Controller & Role Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Simulation Controls Trigger */}
        <div style={{ position: 'relative' }}>
          <button
            id="sim-controls-btn"
            className="btn btn-ghost"
            style={{ borderColor: 'rgba(0, 240, 255, 0.3)', color: 'var(--accent-cyan)' }}
            onClick={() => setSimMenuOpen(!simMenuOpen)}
          >
            <Zap size={15} />
            <span>Simulate SCADA</span>
          </button>

          {simMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '280px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 50,
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                SCADA EVENT INJECTION: {activeVesselName.toUpperCase()}
              </div>
              <button
                id="trigger-roc-surge-btn"
                className="btn btn-danger"
                style={{ width: '100%', marginBottom: '8px', justifyContent: 'center', fontSize: '12px' }}
                onClick={() => {
                  triggerRocSpike('C05');
                  setSimMenuOpen(false);
                }}
              >
                <AlertTriangle size={14} />
                Surge C05 Pressure (+4.5 mbar ROC)
              </button>
              <button
                id="reset-sim-btn"
                className="btn"
                style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
                onClick={() => {
                  resetSimulation();
                  setSimMenuOpen(false);
                }}
              >
                <RotateCcw size={14} />
                Reset Normal Baseline
              </button>
            </div>
          )}
        </div>

        {/* User Role Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            id="user-role-switcher-btn"
            className="btn"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-medium)',
              gap: '10px',
            }}
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--accent-cyan-dim)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '11px',
              }}
            >
              {currentUser.name[0]}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '12px', fontWeight: 600 }}>{currentUser.name}</div>
              <div style={{ fontSize: '10px', color: 'var(--accent-cyan)' }}>
                {currentUser.rank}
              </div>
            </div>
          </button>

          {roleMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '280px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '8px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 50,
              }}
            >
              <div style={{ padding: '8px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                SWITCH ACTIVE ROLE &amp; AUDIT IDENTITY
              </div>
              {AVAILABLE_USERS.map((user: UserProfile) => (
                <button
                  key={user.userId}
                  id={`select-role-${user.role.toLowerCase()}`}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: currentUser.userId === user.userId ? 'var(--accent-cyan-dim)' : 'transparent',
                    border: 'none',
                    color: currentUser.userId === user.userId ? 'var(--accent-cyan)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: '4px',
                  }}
                  onClick={() => handleSwitchUser(user)}
                >
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{user.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    {user.rank} ({user.role})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
