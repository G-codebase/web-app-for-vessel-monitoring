import React, { useState } from 'react';
import { Layers, Radio, Thermometer, Gauge, ArrowUpRight, Droplets, Info } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export const CargoTanksView: React.FC = () => {
  const { tanks, currentVesselId, vessels, isDataInitiated, initiateDataRender } = useTelemetry();
  const currentVessel = vessels.find((v) => v.vesselId === currentVesselId) || { name: 'MT Ocean Star' };
  const [activeTankId, setActiveTankId] = useState<string | null>('C05');

  if (!isDataInitiated || Object.keys(tanks).length === 0) {
    return (
      <div className="telemetry-view-container">
        <div className="panel p-8 text-center" style={{ maxWidth: '640px', margin: '40px auto' }}>
          <div className="login-logo-badge mx-auto mb-4">
            <Radio size={28} className="text-amber animate-pulse" />
          </div>
          <span className="badge badge-warning mb-3">CARGO SURVEILLANCE NOT INITIATED</span>
          <h2 className="text-white text-lg font-bold mb-2">Ullage Gauging & Cargo Telemetry Standby</h2>
          <p className="text-muted text-xs mb-6">
            Liquid hydrocarbon cargo tanks and vapor pressures have not been rendered for this session. Initiate data rendering from VPS storage to inspect tank levels.
          </p>
          <div className="flex justify-center gap-3">
            <button
              id="btn-cargo-initiate"
              onClick={() => initiateDataRender()}
              className="btn btn-primary btn-sm flex-center gap-2"
            >
              <Radio size={14} />
              <span>Initiate Telemetry Render</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cargoTanks = Object.values(tanks).filter((t) => t.type === 'CARGO');
  const selectedTank = activeTankId ? tanks[activeTankId] : cargoTanks[0];

  return (
    <div className="telemetry-view-container">
      <div className="view-header-row">
        <div>
          <h2 className="view-title">
            <Layers className="text-cyan inline-icon" size={24} />
            Cargo Tank Surveillance & Ullage Gauging
          </h2>
          <p className="view-subtitle">
            Liquid hydrocarbon cargo tanks, multi-strata thermals, and vapor pressure on{' '}
            <strong className="text-white">{currentVessel.name}</strong>
          </p>
        </div>
      </div>

      <div className="grid grid-3 gap-4 mb-4">
        {cargoTanks.map((tank) => {
          const isSelected = activeTankId === tank.tankId;
          const isCritical = tank.status === 'CRITICAL';
          const fill = tank.fillingPercentage;

          return (
            <div
              key={tank.tankId}
              onClick={() => setActiveTankId(tank.tankId)}
              className={`tank-card clickable ${isSelected ? 'active-tank-card' : ''} ${
                isCritical ? 'border-danger' : ''
              }`}
            >
              <div className="flex-between mb-2">
                <div>
                  <h4 className="text-white font-bold text-sm">{tank.name}</h4>
                  <span className="text-xs text-muted font-mono">{tank.tankId}</span>
                </div>
                <span
                  className={`badge ${
                    isCritical ? 'badge-critical' : fill > 90 ? 'badge-warning' : 'badge-normal'
                  }`}
                >
                  {fill.toFixed(1)}% Fill
                </span>
              </div>

              {/* Graphical level bar */}
              <div className="tank-level-track mb-3">
                <div
                  className={`tank-level-bar ${isCritical ? 'bg-danger' : fill > 90 ? 'bg-warning' : 'bg-cyan'}`}
                  style={{ width: `${Math.min(100, fill)}%` }}
                />
              </div>

              <div className="grid grid-2 gap-2 text-xs">
                <div>
                  <span className="text-muted block">Volume:</span>
                  <strong className="text-white font-mono">{tank.volumeM3.toLocaleString()} m³</strong>
                </div>
                <div>
                  <span className="text-muted block">Ullage:</span>
                  <strong className="text-cyan font-mono">{tank.ullageM.toFixed(2)} m</strong>
                </div>
                <div>
                  <span className="text-muted block">Temp:</span>
                  <strong className={tank.temperatureC > 30 ? 'text-danger font-mono' : 'text-white font-mono'}>
                    {tank.temperatureC.toFixed(1)}°C
                  </strong>
                </div>
                <div>
                  <span className="text-muted block">Pressure:</span>
                  <strong className="text-white font-mono">{tank.pressureMbar.toFixed(1)} mbar</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Tank Detail Drawer */}
      {selectedTank && (
        <div className="panel">
          <div className="panel-header flex-between">
            <div className="flex-center gap-2">
              <Info size={18} className="text-cyan" />
              <span className="font-semibold text-white">
                Selected Tank Telemetry Blueprint: {selectedTank.name} ({selectedTank.tankId})
              </span>
            </div>
            <span className="badge badge-live font-mono">Status: {selectedTank.status}</span>
          </div>

          <div className="panel-body">
            <div className="metrics-quad-grid">
              <div className="metric-tile accent-cyan">
                <span className="metric-label">Filling Level</span>
                <div className="metric-value-row">
                  <span className="metric-number text-cyan">{selectedTank.currentLevelM.toFixed(2)}</span>
                  <span className="metric-unit">/ {selectedTank.maxLevelM.toFixed(2)} m</span>
                </div>
                <span className="metric-subtext text-muted">
                  Max Tank Height: {selectedTank.maxLevelM} m
                </span>
              </div>

              <div className="metric-tile">
                <span className="metric-label">Cargo Volume / Capacity</span>
                <div className="metric-value-row">
                  <span className="metric-number text-white">{selectedTank.volumeM3.toLocaleString()}</span>
                  <span className="metric-unit">/ {selectedTank.capacityM3.toLocaleString()} m³</span>
                </div>
                <span className="metric-subtext text-muted">
                  Filling Percentage: {selectedTank.fillingPercentage.toFixed(1)}%
                </span>
              </div>

              <div className="metric-tile accent-danger">
                <span className="metric-label">Core Temperature</span>
                <div className="metric-value-row">
                  <span className={`metric-number ${selectedTank.temperatureC > 30 ? 'text-danger' : 'text-white'}`}>
                    {selectedTank.temperatureC.toFixed(1)}
                  </span>
                  <span className="metric-unit">°C</span>
                </div>
                <span className="metric-subtext text-muted">
                  Top: {(selectedTank.temperatureTopC || selectedTank.temperatureC - 0.5).toFixed(1)}°C • Btm: {(selectedTank.temperatureBtmC || selectedTank.temperatureC + 0.3).toFixed(1)}°C
                </span>
              </div>

              <div className="metric-tile accent-warning">
                <span className="metric-label">Vapor Ullage Pressure</span>
                <div className="metric-value-row">
                  <span className="metric-number text-warning">{selectedTank.pressureMbar.toFixed(1)}</span>
                  <span className="metric-unit">mbar</span>
                </div>
                <span className="metric-subtext text-muted">
                  P/V Valve High Setpoint: 25.0 mbar
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
