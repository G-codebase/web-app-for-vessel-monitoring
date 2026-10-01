import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Ship, AlertCircle, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const FleetOverview: React.FC<{ onSelectVessel: (vesselId: string) => void }> = ({
  onSelectVessel,
}) => {
  const { vessels } = useTelemetry();

  const totalVessels = vessels.length;
  const onlineCount = vessels.filter((v) => v.status === 'ONLINE').length;
  const warningCount = vessels.filter((v) => v.status === 'WARNING').length;
  const criticalCount = vessels.filter((v) => v.status === 'CRITICAL').length;

  return (
    <div className="content-container">
      {/* Fleet Monitoring Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
            Fleet Telemetry &amp; Operations
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Live status, communication latency, and autonomous alert monitoring across commercial tanker fleet.
          </p>
        </div>
      </div>

      {/* Fleet KPI Banner */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
          <div className="kpi-title">
            <Ship size={16} color="var(--accent-cyan)" />
            Total Monitored Fleet
          </div>
          <div className="kpi-value">{totalVessels}</div>
          <div className="kpi-subtext">Commercial Tankers Active</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
          <div className="kpi-title">
            <CheckCircle2 size={16} color="var(--accent-emerald)" />
            Online &amp; Streaming
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            {onlineCount}
          </div>
          <div className="kpi-subtext">Sub-second telemetry active</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-amber)' }}>
          <div className="kpi-title">
            <AlertCircle size={16} color="var(--accent-amber)" />
            Warning Condition
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-amber)' }}>
            {warningCount}
          </div>
          <div className="kpi-subtext">Parameter deviation detected</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-rose)' }}>
          <div className="kpi-title">
            <ShieldAlert size={16} color="var(--accent-rose)" />
            Critical Alarms
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-rose)' }}>
            {criticalCount}
          </div>
          <div className="kpi-subtext">Requires immediate intervention</div>
        </div>
      </div>

      {/* Vessels Data Grid */}
      <div className="glass-panel" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>Monitored Tanker Fleet</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {vessels.length} commercial vessels with active SCADA telemetry gateways
          </span>
        </div>

        <div className="data-table-container">
          <table className="data-table" id="fleet-vessels-table">
            <thead>
              <tr>
                <th>Vessel Identity</th>
                <th>Class / Type</th>
                <th>Status</th>
                <th>Last Telemetry</th>
                <th>Latency</th>
                <th>Cargo Load</th>
                <th>Active Alerts</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {vessels.map((vessel) => {
                const isOnline = vessel.status === 'ONLINE';
                const isWarning = vessel.status === 'WARNING';
                const isCritical = vessel.status === 'CRITICAL';

                return (
                  <tr key={vessel.vesselId} id={`vessel-row-${vessel.vesselId.toLowerCase()}`}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Ship size={18} color="var(--accent-cyan)" />
                        <div>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{vessel.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            IMO {vessel.imo} • {vessel.flag}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {vessel.type}
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {vessel.dwt.toLocaleString()} DWT
                      </div>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          isCritical
                            ? 'badge-critical'
                            : isOnline
                            ? 'badge-live'
                            : isWarning
                            ? 'badge-warning'
                            : 'badge-offline'
                        }`}
                      >
                        <span className={`status-dot ${isCritical ? 'critical' : isOnline ? 'live' : isWarning ? 'warning' : 'offline'}`} />
                        {vessel.status}
                      </span>
                    </td>

                    <td className="mono" style={{ fontSize: '12px' }}>
                      {new Date(vessel.lastDataTimestamp).toISOString().slice(11, 19)} UTC
                    </td>

                    <td className="mono" style={{ fontSize: '12px', color: vessel.latencySec > 2 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                      {vessel.latencySec > 60 ? `${Math.round(vessel.latencySec / 60)} min` : `${vessel.latencySec}s`}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '6px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '3px',
                            overflow: 'hidden',
                            minWidth: '60px',
                          }}
                        >
                          <div
                            style={{
                              width: `${vessel.cargoFillPct}%`,
                              height: '100%',
                              background: 'var(--accent-amber)',
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                        <span className="mono" style={{ fontSize: '12px', minWidth: '40px' }}>
                          {vessel.cargoFillPct}%
                        </span>
                      </div>
                    </td>

                    <td>
                      {vessel.activeAlertsCount > 0 ? (
                        <span
                          className={`badge ${vessel.criticalAlertsCount > 0 ? 'badge-critical' : 'badge-warning'}`}
                        >
                          {vessel.activeAlertsCount} Alerts
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--accent-emerald)' }}>0 Alerts</span>
                      )}
                    </td>

                    <td>
                      <button
                        id={`open-vessel-${vessel.vesselId.toLowerCase()}`}
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => onSelectVessel(vessel.vesselId)}
                      >
                        <span>Inspect Vessel</span>
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
