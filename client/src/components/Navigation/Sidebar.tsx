import React from 'react';
import {
  LayoutDashboard,
  Ship,
  Thermometer,
  Gauge,
  Bell,
  Anchor,
  Layers,
  Cloud,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  Droplet,
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export type NavView =
  | 'FLEET'
  | 'VESSEL_OPERATIONS'
  | 'CARGO_TANKS'
  | 'BALLAST_TANKS'
  | 'TEMPERATURE'
  | 'PRESSURE'
  | 'ALARMS'
  | 'CLOUD_SESSIONS'
  | 'HISTORY_EXPORT'
  | 'USERS'
  | 'AUDIT';

export const Sidebar: React.FC<{
  currentView: NavView;
  setCurrentView: (view: NavView) => void;
}> = ({ currentView, setCurrentView }) => {
  const { alarmStats, currentUser } = useTelemetry();

  const isSuperOrAdmin =
    currentUser.isSuperOrAdmin ||
    currentUser.roles?.some((r) => ['SUPER_ADMIN', 'ADMIN', 'TESTER_ADMIN'].includes(r)) ||
    ['SUPER_ADMIN', 'ADMIN', 'TESTER_ADMIN'].includes(currentUser.role);

  const navItems = [
    { id: 'FLEET', label: 'Fleet Overview', icon: LayoutDashboard },
    { id: 'VESSEL_OPERATIONS', label: 'System Overview', icon: Ship },
    { id: 'CARGO_TANKS', label: 'Cargo Tanks', icon: Layers },
    { id: 'BALLAST_TANKS', label: 'Ballast Tanks', icon: Droplet },
    { id: 'TEMPERATURE', label: 'Temperature', icon: Thermometer },
    { id: 'PRESSURE', label: 'Pressure & Manifold', icon: Gauge },
    { id: 'ALARMS', label: 'Alarm Center', icon: Bell, badge: alarmStats.activeCount },
    { id: 'CLOUD_SESSIONS', label: 'Cloud & Sessions', icon: Cloud },
    { id: 'HISTORY_EXPORT', label: 'History & CSV Export', icon: FileSpreadsheet },
    ...(isSuperOrAdmin ? [{ id: 'USERS', label: 'User Directory', icon: Users }] : []),
    { id: 'AUDIT', label: 'Audit Trail', icon: ShieldCheck },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand-container">
        <div className="brand-icon">
          <Anchor size={20} className="text-cyan" />
        </div>
        <div>
          <div className="brand-title">SJV MARINE</div>
          <div className="brand-subtitle">Tanker SCADA Cloud</div>
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
      <div className="sidebar-footer-box">
        <div className="text-xs font-semibold text-white">Post-Production Build</div>
        <div className="text-2xs text-muted">PostgreSQL • Prisma 7.10</div>
      </div>
    </aside>
  );
};
