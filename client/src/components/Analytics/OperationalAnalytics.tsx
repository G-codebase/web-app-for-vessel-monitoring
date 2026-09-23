import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { BarChart3, TrendingUp, ShieldCheck, Activity, Cpu, CheckCircle } from 'lucide-react';

export const OperationalAnalytics: React.FC = () => {
  const { tanks } = useTelemetry();
  const tankList = Object.values(tanks);

  return (
    <div className="content-container">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
          Operational Intelligence &amp; Analytics
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Predictive trend analysis, sensor quality health flags, cargo thermal expansion rates, and operational variance.
        </p>
      </div>

      {/* Intelligence Grid */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
          <div className="kpi-title">
            <Activity size={16} color="var(--accent-cyan)" />
            SYSTEM AVAILABILITY INDEX
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-cyan)' }}>99.98%</div>
          <div className="kpi-subtext">Zero dropped telemetry packets</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
          <div className="kpi-title">
            <CheckCircle size={16} color="var(--accent-emerald)" />
            SENSOR CALIBRATION HEALTH
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>48 / 48</div>
          <div className="kpi-subtext">100% sensors reporting QUALITY: GOOD</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-amber)' }}>
          <div className="kpi-title">
            <TrendingUp size={16} color="var(--accent-amber)" />
            MEAN THERMAL DRIFT
          </div>
          <div className="kpi-value">+0.05 °C/h</div>
          <div className="kpi-subtext">Within IMO solar radiation safety zone</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
          <div className="kpi-title">
            <Cpu size={16} color="var(--accent-purple)" />
            SCADA GATEWAY LATENCY
          </div>
          <div className="kpi-value">420 ms</div>
          <div className="kpi-subtext">MQTT over Inmarsat-C satellite link</div>
        </div>
      </div>

      {/* Tank Compartment Analytics Table */}
      <div className="glass-panel" style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
          Tank Compartment Intelligence Breakdown
        </h2>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tank Compartment</th>
                <th>Cargo Fill %</th>
                <th>Temp Top / Mid / Btm</th>
                <th>Ullage Pressure</th>
                <th>24h Volume Drift</th>
                <th>Quality Flag</th>
                <th>Analytical Status</th>
              </tr>
            </thead>
            <tbody>
              {tankList.map((tank) => (
                <tr key={tank.tankId}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{tank.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Section: {tank.section}</div>
                  </td>
                  <td>
                    <div className="mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                      {tank.fillingPercentage.toFixed(1)}%
                    </div>
                  </td>
                  <td className="mono" style={{ fontSize: '12px' }}>
                    {tank.temperatureTopC}° / {tank.temperatureMidC}° / {tank.temperatureBtmC}° C
                  </td>
                  <td className="mono" style={{ fontSize: '12px', color: tank.pressureMbar > 13.0 ? 'var(--accent-rose)' : 'var(--accent-amber)' }}>
                    {tank.pressureMbar.toFixed(1)} mbar
                  </td>
                  <td className="mono" style={{ fontSize: '12px' }}>
                    {tank.flowRateM3H !== 0 ? `+${(tank.flowRateM3H * 24).toFixed(0)} m³/day` : 'Stable (0.0 m³)'}
                  </td>
                  <td>
                    <span className="badge badge-live">GOOD</span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        tank.status === 'CRITICAL'
                          ? 'badge-critical'
                          : tank.status === 'WARNING'
                          ? 'badge-warning'
                          : 'badge-live'
                      }`}
                    >
                      {tank.status === 'CRITICAL' ? 'SURGE EVENT' : tank.status === 'WARNING' ? 'ELEVATED' : 'NOMINAL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
