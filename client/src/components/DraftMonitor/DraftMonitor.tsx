import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Anchor, Compass } from 'lucide-react';

export const DraftMonitor: React.FC = () => {
  const { draft, currentVesselId, vessels } = useTelemetry();

  const currentVessel = vessels.find((v) => v.vesselId === currentVesselId);
  const vesselName = currentVessel ? currentVessel.name : 'Vessel';

  const fore = draft ? draft.foreDraftM : 4.85;
  const aft = draft ? draft.aftDraftM : 4.90;
  const midPort = draft ? draft.midPortDraftM : 4.87;
  const midStbd = draft ? draft.midStbdDraftM : 4.88;
  const mean = draft ? draft.meanDraftM : 4.875;
  const trim = draft ? draft.trimM : 0.05;
  const heel = draft ? draft.heelDeg : 0.1;
  const displacement = draft ? draft.displacementTons : 68400;

  return (
    <div className="content-container">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
          {vesselName} — Draft &amp; Hull Dynamics
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Real-time hydrostatics, forward/aft draft soundings, vessel trim by stern, and hull hogging/sagging calculation.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
          <div className="kpi-title">
            <Anchor size={16} color="var(--accent-cyan)" />
            FORWARD DRAFT (BOW)
          </div>
          <div className="kpi-value">{fore.toFixed(2)} m</div>
          <div className="kpi-subtext">Sounding Sensor SENS-DRAFT-FORE</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
          <div className="kpi-title">
            <Anchor size={16} color="var(--accent-blue)" />
            MIDSHIP DRAFT (MEAN)
          </div>
          <div className="kpi-value">{((midPort + midStbd) / 2).toFixed(2)} m</div>
          <div className="kpi-subtext">Port: {midPort.toFixed(2)}m | Stbd: {midStbd.toFixed(2)}m</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
          <div className="kpi-title">
            <Anchor size={16} color="var(--accent-purple)" />
            AFT DRAFT (STERN)
          </div>
          <div className="kpi-value">{aft.toFixed(2)} m</div>
          <div className="kpi-subtext">Sounding Sensor SENS-DRAFT-AFT</div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
          <div className="kpi-title">
            <Compass size={16} color="var(--accent-emerald)" />
            CALCULATED TRIM
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            {trim > 0 ? `+${trim.toFixed(2)}` : trim.toFixed(2)} m
          </div>
          <div className="kpi-subtext">
            {trim >= 0 ? 'Trim by Stern (Optimal Propulsion)' : 'Trim by Head'}
          </div>
        </div>
      </div>

      {/* Visual Waterline Schematic */}
      <div className="glass-panel" style={{ marginTop: '20px', padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
              Hull Profile &amp; Waterline Dynamic Alignment: {vesselName}
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Mean Draft: {mean.toFixed(3)} m • Displacement: {displacement.toLocaleString()} MT • List Angle: {heel}° Starboard
            </div>
          </div>
          <span className="badge badge-live">Hydrostatic Stability Good</span>
        </div>

        <div className="draft-hull-view">
          <svg className="draft-waterline-svg" viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Water Background */}
            <defs>
              <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="hullGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>

            {/* Dynamic Waterline Wave */}
            <path
              d="M 20 140 Q 200 135, 400 140 T 780 140 L 780 230 L 20 230 Z"
              fill="url(#waterGrad)"
            />

            {/* Tanker Hull Outline */}
            <path
              d="M 80 80 L 160 80 L 680 80 Q 750 90, 760 140 L 720 190 L 130 190 Q 60 140, 80 80 Z"
              fill="url(#hullGrad)"
              stroke="#00f0ff"
              strokeWidth="2"
            />

            {/* Hull Superstructure / Bridge at Stern */}
            <rect x="620" y="30" width="70" height="50" rx="4" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
            <rect x="635" y="15" width="20" height="15" fill="#f59e0b" />

            {/* Forward Bow Draft Indicator */}
            <line x1="120" y1="50" x2="120" y2="210" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="120" cy="140" r="5" fill="#f59e0b" />
            <text x="75" y="45" fill="#f59e0b" fontSize="12" fontFamily="JetBrains Mono" fontWeight="700">
              FORE: {fore.toFixed(2)}m
            </text>

            {/* Midship Draft Indicator */}
            <line x1="400" y1="50" x2="400" y2="210" stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="400" cy="140" r="5" fill="#00f0ff" />
            <text x="360" y="45" fill="#00f0ff" fontSize="12" fontFamily="JetBrains Mono" fontWeight="700">
              MID: {mean.toFixed(2)}m
            </text>

            {/* Aft Stern Draft Indicator */}
            <line x1="700" y1="50" x2="700" y2="210" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="700" cy="140" r="5" fill="#10b981" />
            <text x="660" y="45" fill="#10b981" fontSize="12" fontFamily="JetBrains Mono" fontWeight="700">
              AFT: {aft.toFixed(2)}m
            </text>
          </svg>

          {/* Bottom Callout */}
          <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>FORWARD TRIM MARK</div>
              <div className="mono" style={{ fontSize: '16px', color: 'var(--accent-amber)', fontWeight: 700 }}>
                {fore.toFixed(2)} m
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MEAN DRAUGHT</div>
              <div className="mono" style={{ fontSize: '16px', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                {mean.toFixed(3)} m
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AFT DRAUGHT MARK</div>
              <div className="mono" style={{ fontSize: '16px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                {aft.toFixed(2)} m
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
