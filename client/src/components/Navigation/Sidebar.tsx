import React from 'react';
import {
  LayoutDashboard,
  Ship,
  Activity,
  Bell,
  Anchor,
  GitMerge,
  BarChart3,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export type NavView =
  | 'FLEET'
  | 'VESSEL_OPERATIONS'
  | 'TELEMETRY'
  | 'ALARMS'
  | 'DRAFT'
  | 'MANIFOLD'
  | 'ANALYTICS'
  | 'AUDIT'
  | 'REPORTS';

export const Sidebar: React.FC<{
  currentView: NavView;
  setCurrentView: (view: NavView) => void;
}> = ({ currentView, setCurrentView }) => {
  const { alarmStats } = useTelemetry();

  const navItems = [
    { id: 'FLEET', label: 'Fleet Overview', icon: LayoutDashboard },
    { id: 'VESSEL_OPERATIONS', label: 'Vessel Operations', icon: Ship },
    { id: 'TELEMETRY', label: 'Telemetry Workspace', icon: Activity },
    { id: 'ALARMS', label: 'Alarm Center', icon: Bell, badge: alarmStats.activeCount },
    { id: 'DRAFT', label: 'Draft & Hull Dynamics', icon: Anchor },
    { id: 'MANIFOLD', label: 'Manifold Topology', icon: GitMerge },
    { id: 'ANALYTICS', label: 'Operational Analytics', icon: BarChart3 },
    { id: 'AUDIT', label: 'Audit Trail', icon: ShieldCheck },
    { id: 'REPORTS', label: 'Reports & Exports', icon: FileText },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand-container">
        <div className="brand-icon">
          <Anchor size={20} />
        </div>
        <div>
          <div className="brand-title">SJV MARINE</div>
          <div className="brand-subtitle">Tanker Monitor</div>
        </div>
      </div>

      {/* Nav Menu */}
      <ul className="nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <li key={item.id}>
              <button
                id={`nav-link-${item.id.toLowerCase()}`}
                className={`nav-item-btn ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentView(item.id as NavView)}
              >
                <Icon size={18} color={isActive ? 'var(--accent-cyan)' : 'inherit'} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="nav-badge" id="sidebar-alarm-badge">{item.badge}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Footer Info */}
      <div
        style={{
          marginTop: 'auto',
          padding: '16px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>SCADA Protocol v1.0</div>
        <div>Continuous Telemetry Broker</div>
      </div>
    </aside>
  );
};
