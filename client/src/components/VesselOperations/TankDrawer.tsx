import React from 'react';
import { TankData } from '../../context/TelemetryContext';
import {
  X,
  Activity,
  Thermometer,
  Gauge,
  Droplets,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const TankDrawer: React.FC<{
  tank: TankData | null;
  onClose: () => void;
  onOpenTelemetryWorkspace: (tankId: string) => void;
}> = ({ tank, onClose, onOpenTelemetryWorkspace }) => {
  if (!tank) return null;

  const isWarning = tank.status === 'WARNING';
  const isCritical = tank.status === 'CRITICAL';

  return (
    <div className="tank-drawer-overlay" onClick={onClose}>
      <div className="tank-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                {tank.name}
              </span>
              <span
                className={`badge ${
                  isCritical ? 'badge-critical' : isWarning ? 'badge-warning' : 'badge-live'
                }`}
              >
                {tank.status}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Subsystem: {tank.type} • Section: {tank.section}
            </div>
          </div>

          <button
            id="close-tank-drawer-btn"
            className="btn btn-ghost"
            style={{ padding: '6px' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Primary Gauges */}
        <div className="kpi-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div className="glass-panel" style={{ padding: '14px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={13} color="var(--accent-cyan)" />
              SOUNDING LEVEL
            </div>
            <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
              {tank.currentLevelM.toFixed(2)} m
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>
              {tank.fillingPercentage.toFixed(1)}% ({tank.volumeM3.toLocaleString()} m³)
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '14px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gauge size={13} color="var(--accent-amber)" />
              ULLAGE PRESSURE
            </div>
            <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: isCritical ? 'var(--accent-rose)' : '#fff', marginTop: '4px' }}>
              {tank.pressureMbar.toFixed(1)} mbar
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Limit: 13.0 mbar
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '14px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Thermometer size={13} color="var(--accent-cyan)" />
              TEMPERATURE
            </div>
            <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
              {tank.temperatureC.toFixed(1)} °C
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Top {tank.temperatureTopC}° | Btm {tank.temperatureBtmC}°
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '14px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Droplets size={13} color="var(--accent-emerald)" />
              TRANSFER RATE
            </div>
            <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: tank.flowRateM3H !== 0 ? 'var(--accent-emerald)' : '#fff', marginTop: '4px' }}>
              {tank.flowRateM3H > 0 ? `+${tank.flowRateM3H.toFixed(1)}` : tank.flowRateM3H.toFixed(1)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              m³/h (Density: {tank.densityTM3} t/m³)
            </div>
          </div>
        </div>

        {/* Live Sparkline Simulation / Diagnostics */}
        <div className="glass-panel" style={{ marginBottom: '20px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={14} color="var(--accent-cyan)" />
              Instantaneous Trend Analysis (Last 24h)
            </span>
            <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600 }}>Normal Drift</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Temperature Profile</span>
                <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{tank.temperatureC.toFixed(2)} °C</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (tank.temperatureC / 30) * 100)}%`, height: '100%', background: 'var(--accent-cyan)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Ullage Pressure Space</span>
                <span className="mono" style={{ color: isCritical ? 'var(--accent-rose)' : 'var(--accent-amber)' }}>
                  {tank.pressureMbar.toFixed(2)} mbar
                </span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (tank.pressureMbar / 16) * 100)}%`, height: '100%', background: isCritical ? 'var(--accent-rose)' : 'var(--accent-amber)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Filling Ratio</span>
                <span className="mono" style={{ color: '#fff' }}>{tank.fillingPercentage.toFixed(1)}%</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${tank.fillingPercentage}%`, height: '100%', background: 'var(--accent-emerald)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Direct Action to Full Telemetry Workspace */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            id="open-full-telemetry-btn"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            onClick={() => {
              onOpenTelemetryWorkspace(tank.tankId);
              onClose();
            }}
          >
            <Activity size={16} />
            <span>Open Dedicated Telemetry Workspace</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
