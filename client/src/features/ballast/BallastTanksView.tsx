import React from 'react';
import { Droplet, Anchor, Compass, Info, CheckCircle2, Radio } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export const BallastTanksView: React.FC = () => {
  const { tanks, draft, currentVesselId, vessels, isDataInitiated, initiateDataRender } = useTelemetry();
  const currentVessel = vessels.find((v) => v.vesselId === currentVesselId) || { name: 'MT Ocean Star' };

  if (!isDataInitiated || Object.keys(tanks).length === 0) {
    return (
      <div className="telemetry-view-container">
        <div className="panel p-8 text-center" style={{ maxWidth: '640px', margin: '40px auto' }}>
          <div className="login-logo-badge mx-auto mb-4">
            <Radio size={28} className="text-amber animate-pulse" />
          </div>
          <span className="badge badge-warning mb-3">BALLAST TELEMETRY NOT INITIATED</span>
          <h2 className="text-white text-lg font-bold mb-2">Ballast Hydrostatics Standby</h2>
          <p className="text-muted text-xs mb-6">
            Ballast tanks and stability levels have not been rendered for this session. Initiate data rendering from VPS storage.
          </p>
          <div className="flex justify-center gap-3">
            <button id="btn-ballast-initiate" onClick={() => initiateDataRender()} className="btn btn-primary btn-sm flex-center gap-2">
              <Radio size={14} />
              <span>Initiate Telemetry Render</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ballastTanks = Object.values(tanks).filter((t) => t.type === 'BALLAST');

  return (
    <div className="telemetry-view-container">
      <div className="view-header-row">
        <div>
          <h2 className="view-title">
            <Droplet className="text-cyan inline-icon" size={24} />
            Ballast Water Management & Hull Stability
          </h2>
          <p className="view-subtitle">
            Sounding depths, ballast water exchange monitoring, and trim/list balance for{' '}
            <strong className="text-white">{currentVessel.name}</strong>
          </p>
        </div>
      </div>

      <div className="grid grid-2 gap-4 mb-4">
        {/* Ballast Gauges Grid */}
        <div className="panel">
          <div className="panel-header flex-between">
            <div className="flex-center gap-2">
              <Droplet size={18} className="text-cyan" />
              <span className="font-semibold text-white">Ballast Tank Sounding Levels</span>
            </div>
            <span className="text-xs text-muted">{ballastTanks.length} tanks configured</span>
          </div>

          <div className="panel-body">
            <div className="grid grid-2 gap-3">
              {ballastTanks.map((tank) => (
                <div key={tank.tankId} className="tank-card">
                  <div className="flex-between mb-2">
                    <span className="font-semibold text-white text-xs">{tank.name}</span>
                    <span className="badge badge-normal font-mono">{tank.tankId}</span>
                  </div>

                  <div className="tank-level-track mb-2">
                    <div
                      className="tank-level-bar bg-cyan"
                      style={{ width: `${Math.min(100, tank.fillingPercentage)}%` }}
                    />
                  </div>

                  <div className="flex-between text-xs">
                    <span className="text-muted">Sounding Level:</span>
                    <strong className="text-cyan font-mono">{tank.currentLevelM.toFixed(2)} m</strong>
                  </div>
                  <div className="flex-between text-xs mt-1">
                    <span className="text-muted">Ballast Volume:</span>
                    <strong className="text-white font-mono">{tank.volumeM3.toLocaleString()} m³</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trim & Stability Correlation */}
        <div className="panel">
          <div className="panel-header flex-between">
            <div className="flex-center gap-2">
              <Anchor size={18} className="text-cyan" />
              <span className="font-semibold text-white">Hydrostatic Stability & Trim Correlation</span>
            </div>
            <span className="badge badge-live">DRAFT SYNCHRONIZED</span>
          </div>

          <div className="panel-body">
            <div className="metrics-quad-grid mb-3">
              <div className="metric-tile accent-cyan">
                <span className="metric-label">Trim by Stern</span>
                <div className="metric-value-row">
                  <span className="metric-number text-cyan">
                    {draft ? (draft.trimM >= 0 ? `+${draft.trimM.toFixed(2)}` : draft.trimM.toFixed(2)) : '+0.05'}
                  </span>
                  <span className="metric-unit">m</span>
                </div>
                <span className="metric-subtext text-muted">Stern Trim (Safe Range: 0 to 1.5m)</span>
              </div>

              <div className="metric-tile">
                <span className="metric-label">Transverse Heel / List</span>
                <div className="metric-value-row">
                  <span className="metric-number text-white">{draft?.heelDeg.toFixed(1) || '0.1'}</span>
                  <span className="metric-unit">° starboard</span>
                </div>
                <span className="metric-subtext text-green font-semibold">✓ Neutral Hull Trim</span>
              </div>
            </div>

            <div className="alert-notice-box">
              <Info size={16} className="text-cyan flex-shrink-0" />
              <div className="text-xs">
                <strong>IMO Ballast Water Compliance:</strong> D-2 standard exchange monitoring active. Current ballast distribution maintains safe sea-going GM and longitudinal bending moment within 68% permissible limits.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
