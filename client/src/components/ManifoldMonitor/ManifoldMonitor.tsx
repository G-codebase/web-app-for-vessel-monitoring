import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { CheckCircle } from 'lucide-react';

export const ManifoldMonitor: React.FC = () => {
  const { manifolds, currentVesselId, vessels } = useTelemetry();
  const [selectedPointId, setSelectedPointId] = useState<string>('P1');

  const currentVessel = vessels.find((v) => v.vesselId === currentVesselId);
  const vesselName = currentVessel ? currentVessel.name : 'Vessel';

  const cargoPoints = manifolds.filter((m) => m.lineType === 'CARGO_LINE');
  const vapourPoints = manifolds.filter((m) => m.lineType === 'VAPOUR_LINE');
  const activePoint = manifolds.find((m) => m.pointId === selectedPointId) || manifolds[0];

  return (
    <div className="content-container">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
          {vesselName} — Digital Manifold Piping Topology
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Cargo discharge and vapor recovery line pressure dynamics, valve telemetry, and instantaneous flow monitoring.
        </p>
      </div>

      {/* Selected Manifold Point Diagnostic Inspector */}
      {activePoint && (
        <div className="glass-panel" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span className="badge badge-live" style={{ marginBottom: '6px' }}>
                SELECTED MANIFOLD POINT
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>
                {activePoint.name} ({activePoint.pointId})
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <span className="badge badge-live">
                <CheckCircle size={12} />
                Valve: {activePoint.valveStatus} ({activePoint.valvePositionPct}%)
              </span>
              <span className="badge badge-live">Normal Pressure Envelope</span>
            </div>
          </div>

          <div className="kpi-grid" style={{ marginBottom: 0 }}>
            <div className="glass-panel" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CURRENT PRESSURE</div>
              <div className="mono" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                {activePoint.lineType === 'VAPOUR_LINE'
                  ? `${(activePoint.pressureBar * 1000).toFixed(1)} mbar`
                  : `${activePoint.pressureBar.toFixed(2)} bar`}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                24h Avg: {activePoint.lineType === 'VAPOUR_LINE' ? `${(activePoint.historical24hAvg * 1000).toFixed(1)} mbar` : `${activePoint.historical24hAvg} bar`}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PRESSURE RANGE (24H)</div>
              <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                {activePoint.historicalMin} → {activePoint.historicalMax} bar
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Peak variance: ±0.4 bar</div>
            </div>

            <div className="glass-panel" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TEMPERATURE</div>
              <div className="mono" style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                {activePoint.temperatureC.toFixed(1)} °C
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Thermal drift: +0.2 °C</div>
            </div>

            <div className="glass-panel" style={{ padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TRANSFER FLOW</div>
              <div className="mono" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '4px' }}>
                {activePoint.flowRateM3H.toLocaleString()} m³/h
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Rate of Change: {activePoint.rateOfChangeBarPerMin} bar/min
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Piping Topology Layout */}
      <div className="glass-panel">
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
          MAIN CARGO LINE MANIFOLDS
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Select a node along the piping array to inspect real-time line dynamics.
        </p>

        <div className="manifold-canvas">
          <div className="pipe-line cargo-line">
            {cargoPoints.map((point) => {
              const isSelected = selectedPointId === point.pointId;
              return (
                <div
                  key={point.pointId}
                  id={`manifold-node-${point.pointId.toLowerCase()}`}
                  className="manifold-node"
                  style={{
                    borderColor: isSelected ? 'var(--accent-cyan)' : 'rgba(245, 158, 11, 0.4)',
                    boxShadow: isSelected ? 'var(--accent-cyan-glow)' : 'none',
                  }}
                  onClick={() => setSelectedPointId(point.pointId)}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                    {point.pointId}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {point.name.split('(')[1]?.replace(')', '') || 'Manifold'}
                  </div>
                  <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-amber)', margin: '6px 0' }}>
                    {point.pressureBar.toFixed(2)} bar
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                    {point.flowRateM3H} m³/h
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '50px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
              VAPOUR RECOVERY &amp; INERT GAS LINE
            </h3>
            <div className="pipe-line vapour-line">
              {vapourPoints.map((point) => {
                const isSelected = selectedPointId === point.pointId;
                return (
                  <div
                    key={point.pointId}
                    id={`manifold-node-${point.pointId.toLowerCase()}`}
                    className="manifold-node"
                    style={{
                      borderColor: isSelected ? 'var(--accent-cyan)' : 'rgba(0, 240, 255, 0.4)',
                      boxShadow: isSelected ? 'var(--accent-cyan-glow)' : 'none',
                    }}
                    onClick={() => setSelectedPointId(point.pointId)}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                      {point.pointId}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {point.name}
                    </div>
                    <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-cyan)', margin: '6px 0' }}>
                      {(point.pressureBar * 1000).toFixed(1)} mbar
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      Valve: {point.valvePositionPct}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
