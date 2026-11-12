import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { TankDrawer } from './TankDrawer';
import {
  Layers,
  Thermometer,
  Gauge,
  Droplets,
  Anchor,
  Compass,
  ChevronUp,
  ChevronDown,
  Radio,
  Calendar,
  Database,
  Play,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Ship,
} from 'lucide-react';

export const VesselSchematic: React.FC<{
  onOpenTelemetryWorkspace: (tankId: string) => void;
}> = ({ onOpenTelemetryWorkspace }) => {
  const {
    tanks,
    draft,
    vessels,
    currentVesselId,
    latencySec,
    selectedTankId,
    setSelectedTankId,
    isDataInitiated,
    initiateDataRender,
    setSelectedDate,
    vpsStorageDates,
    selectedDate,
  } = useTelemetry();

  const currentVessel =
    vessels.find((v) => v.vesselId === currentVesselId) || vessels[0] || {
      name: 'MT Ocean Star',
      imo: 9876543,
      type: 'VLCC',
      flag: 'Panama',
      cargoVolumeM3: 638250,
      cargoFillPct: 72.4,
      ballastVolumeM3: 6420,
      fuelVolumeM3: 1080,
      status: 'ONLINE',
    };

  // Standby State: When telemetry is not initiated, display SCADA Standby Console
  if (!isDataInitiated || Object.keys(tanks).length === 0) {
    const defaultDates = [
      { date: '2026-10-12', file: '2026-10-12.json', label: 'Live Sea Passage', desc: 'Transit at 14.2 knots, 0 active alarms, baseline draft 4.88m' },
      { date: '2026-10-11', file: '2026-10-11.json', label: 'Rough Weather Swell', desc: 'Trim +0.45m, swell oscillation, Ballast Tank B02 warning' },
      { date: '2026-10-10', file: '2026-10-10.json', label: 'Cargo Discharge & High Temp', desc: 'line1-pc 82.5°C HIGH, 2 Critical Alarms, manifold active' },
      { date: '2026-10-09', file: '2026-10-09.json', label: 'Moored Jurong Berth B-4', desc: 'Mooring line tension, manifold connection verification' },
      { date: '2026-10-08', file: '2026-10-08.json', label: 'Pre-Voyage IG Purge', desc: 'Inert gas purge verification and class surveyor baseline' },
    ];

    const displayDates = vpsStorageDates.length > 0
      ? vpsStorageDates.map(v => ({ date: v.date, file: v.fileName, label: v.operationalContext.slice(0, 36), desc: v.operationalContext }))
      : defaultDates;

    return (
      <div className="vessel-schematic-view">
        <div className="vessel-meta-bar flex-between">
          <div className="flex-center gap-3">
            <div className="vessel-flag-badge">🏁</div>
            <div>
              <div className="text-sm font-bold text-white flex-center gap-2">
                <span>{currentVessel?.name || 'Vessel ' + currentVesselId}</span>
                <span className="badge badge-warning text-2xs">NOT INITIATED</span>
              </div>
              <div className="text-xs text-muted font-mono">
                IMO: {currentVessel?.imo || 'Pending Ingestion'} • Telemetry Stream: STANDBY
              </div>
            </div>
          </div>
          <button
            id="btn-schematic-initiate-top"
            onClick={() => initiateDataRender()}
            className="btn btn-primary btn-sm flex-center gap-1 pulse-animation"
          >
            <Radio size={14} />
            <span>Initiate Telemetry Render</span>
          </button>
        </div>

        <div className="panel p-8 my-6 text-center" style={{ maxWidth: '820px', margin: '30px auto' }}>
          <div className="login-logo-badge mx-auto mb-4">
            <Radio size={32} className="text-amber animate-pulse" />
          </div>
          <span className="badge badge-warning mb-2">SCADA WORKSTATION STANDBY</span>
          <h2 className="text-white text-xl font-bold mb-2">Vessel Telemetric Preview Not Initiated</h2>
          <p className="text-muted text-xs mb-6 max-w-lg mx-auto">
            No telemetric stream or tank gauging dataset is currently rendered in this workstation session.
            Select an allocated telemetry file from VPS Storage below to render liquid cargo levels, thermal gradients, and stability data.
          </p>

          <div className="flex-center gap-3 justify-center mb-8">
            <button
              id="btn-schematic-render-latest"
              onClick={() => initiateDataRender()}
              className="btn btn-primary btn-md flex-center gap-2"
            >
              <Play size={16} />
              <span>Render Active VPS Telemetry (2026-10-12)</span>
            </button>
          </div>

          <div className="text-left border-t pt-4">
            <div className="text-xs font-semibold text-white uppercase tracking-wider mb-3 flex-center gap-2">
              <Database size={14} className="text-cyan" />
              <span>Allocated VPS Storage Date Snapshots (1-Click Render)</span>
            </div>
            <div className="grid grid-2 gap-3">
              {displayDates.map((item) => (
                <div
                  key={item.date}
                  className="p-3 border rounded flex-between hover:border-cyan transition-colors"
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  <div>
                    <div className="flex-center gap-2">
                      <Calendar size={13} className="text-cyan" />
                      <strong className="text-white text-xs">{item.date}</strong>
                      <span className="code-badge text-2xs">{item.file}</span>
                    </div>
                    <div className="text-2xs text-muted mt-1 leading-tight">{item.desc}</div>
                  </div>
                  <button
                    id={'btn-render-card-' + item.date}
                    onClick={() => setSelectedDate(item.date)}
                    className="btn btn-secondary btn-xs flex-center gap-1 hover:border-cyan text-cyan ml-2 shrink-0"
                  >
                    <Play size={11} />
                    <span>Render</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedTank = selectedTankId ? tanks[selectedTankId] || null : null;

  // Group tanks dynamically by section for any vessel type
  const tankIds = Object.keys(tanks);
  const foreTanks = tankIds.filter((id) => tanks[id].section === 'FORE');
  const midTanks = tankIds.filter((id) => tanks[id].section === 'MID');
  const aftTanks = tankIds.filter((id) => tanks[id].section === 'AFT');
  const slopTanks = tankIds.filter((id) => tanks[id].section === 'SLOP');

  const renderTankCard = (id: string) => {
    const tank = tanks[id];
    if (!tank) return null;

    const isWarning = tank.status === 'WARNING';
    const isCritical = tank.status === 'CRITICAL';
    const isSelected = selectedTankId === id;

    return (
      <div
        key={id}
        id={`tank-cell-${id.toLowerCase()}`}
        className={`tank-card-interactive ${isSelected ? 'active-selected' : ''}`}
        style={{
          borderColor: isCritical
            ? 'var(--accent-rose)'
            : isWarning
            ? 'var(--accent-amber)'
            : isSelected
            ? 'var(--accent-cyan)'
            : 'var(--border-medium)',
          boxShadow: isCritical
            ? 'var(--accent-rose-glow)'
            : isWarning
            ? 'var(--accent-amber-glow)'
            : 'none',
        }}
        onClick={() => { setSelectedTankId(id); setDrawerOpen(true); }}
      >
        {/* Dynamic Liquid Level Animation */}
        <div
          className={`tank-liquid-fill ${
            isCritical
              ? 'status-critical'
              : isWarning
              ? 'status-warning'
              : ''
          }`}
          style={{ height: `${tank.fillingPercentage}%` }}
        />

        {/* Content Overlay */}
        <div className="tank-content">
          <div className="tank-top-row">
            <div>
              <div className="tank-id-tag">{tank.tankId}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                {tank.type}
              </div>
            </div>
            <div className="tank-fill-tag">{tank.fillingPercentage.toFixed(1)}%</div>
          </div>

          <div style={{ margin: '4px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Level:</span>
              <span className="mono" style={{ color: '#fff' }}>{tank.currentLevelM.toFixed(2)} m</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Volume:</span>
              <span className="mono" style={{ color: '#fff' }}>{Math.round(tank.volumeM3).toLocaleString()} m³</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '4px' }}>
            <div className="tank-metric-row">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Thermometer size={11} color="var(--accent-cyan)" />
                {tank.temperatureC.toFixed(1)} °C
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Gauge size={11} color={isCritical ? 'var(--accent-rose)' : 'var(--accent-amber)'} />
                {tank.pressureMbar.toFixed(1)} mbar
              </span>
            </div>

            {tank.flowRateM3H !== 0 && (
              <div
                style={{
                  marginTop: '2px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '4px',
                }}
              >
                <Droplets size={10} />
                +{tank.flowRateM3H.toFixed(1)} m³/h
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Orientation state: defaults to HORIZONTAL as requested
  const [orientation, setOrientation] = useState<"HORIZONTAL" | "VERTICAL">("HORIZONTAL");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Total Cargo On Board calculations for load distribution preview
  const totalVolume = Object.values(tanks).reduce((sum, t) => sum + (t.volumeM3 || 0), 0);
  const totalCapacity = Object.values(tanks).reduce((sum, t) => sum + (t.capacityM3 || 0), 0);
  const overallFillPct = totalCapacity > 0 ? (totalVolume / totalCapacity) * 100 : 72.5;

  const foreVol = foreTanks.reduce((s, id) => s + (tanks[id]?.volumeM3 || 0), 0);
  const midVol = midTanks.reduce((s, id) => s + (tanks[id]?.volumeM3 || 0), 0);
  const aftVol = aftTanks.reduce((s, id) => s + (tanks[id]?.volumeM3 || 0), 0);
  const slopVol = slopTanks.reduce((s, id) => s + (tanks[id]?.volumeM3 || 0), 0);

  // Dynamically partition tanks into Longitudinal Bay Columns from Fore (Bow) to Aft (Stern)
  const buildBayColumns = () => {
    const bays: {
      key: string;
      title: string;
      subtitle: string;
      tanks: { port?: string; center?: string; stbd?: string };
    }[] = [];

    const assignBay = (key: string, title: string, subtitle: string, ids: string[]) => {
      if (ids.length === 0) return;
      if (ids.length === 2) {
        bays.push({
          key,
          title,
          subtitle,
          tanks: { port: ids[0], stbd: ids[1] },
        });
      } else if (ids.length === 3) {
        bays.push({
          key,
          title,
          subtitle,
          tanks: { port: ids[0], center: ids[1], stbd: ids[2] },
        });
      } else if (ids.length === 4) {
        bays.push({
          key: `${key}-1`,
          title: `${title} 1`,
          subtitle: `${subtitle} (Fwd)`,
          tanks: { port: ids[0], stbd: ids[1] },
        });
        bays.push({
          key: `${key}-2`,
          title: `${title} 2`,
          subtitle: `${subtitle} (Aft)`,
          tanks: { port: ids[2], stbd: ids[3] },
        });
      } else {
        bays.push({
          key,
          title,
          subtitle,
          tanks: { port: ids[0], stbd: ids[1] },
        });
      }
    };

    assignBay("FORE", "FORE", "BOW BAY", foreTanks);
    assignBay("MID", "MIDSHIP", "CARGO BAY", midTanks);
    assignBay("AFT", "AFT", "STERN BAY", aftTanks);
    assignBay("SLOP", "SLOP TANKS", "SETTLING BAY", slopTanks);

    return bays;
  };

  const bayColumns = buildBayColumns();

  const firstTankId = tankIds[0] || "C01";

  return (
    <div className="content-container">
      {/* Vessel Operations Center Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff' }}>
              {currentVessel.name.toUpperCase()}
            </h1>
            <span
              className={`badge ${
                currentVessel.status === 'ONLINE'
                  ? 'badge-live'
                  : currentVessel.status === 'WARNING'
                  ? 'badge-warning'
                  : currentVessel.status === 'CRITICAL'
                  ? 'badge-critical'
                  : 'badge-offline'
              }`}
            >
              <span
                className={`status-dot ${
                  currentVessel.status === 'ONLINE'
                    ? 'live'
                    : currentVessel.status === 'WARNING'
                    ? 'warning'
                    : currentVessel.status === 'CRITICAL'
                    ? 'critical'
                    : 'offline'
                }`}
              />
              {currentVessel.status || 'ONLINE'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '16px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginTop: '4px',
            }}
          >
            <span>Class: {currentVessel.type}</span>
            <span>•</span>
            <span>IMO {currentVessel.imo}</span>
            <span>•</span>
            <span>Latency: {latencySec}s</span>
            <span>•</span>
            <span>
              Last telemetry: {new Date().toISOString().slice(11, 19)} UTC
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            id="quick-telemetry-btn"
            className="btn btn-primary"
            onClick={() => onOpenTelemetryWorkspace(selectedTankId || firstTankId)}
          >
            <Gauge size={15} />
            <span>Open Telemetry Workspace</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Summary Cards */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-amber)' }}>
          <div className="kpi-title">
            <Layers size={16} color="var(--accent-amber)" />
            CARGO VOLUME
          </div>
          <div className="kpi-value">{currentVessel.cargoVolumeM3?.toLocaleString()} m³</div>
          <div className="kpi-subtext" style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
            {currentVessel.cargoFillPct}% Capacity
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
          <div className="kpi-title">
            <Droplets size={16} color="var(--accent-cyan)" />
            BALLAST
          </div>
          <div className="kpi-value">{currentVessel.ballastVolumeM3?.toLocaleString()} m³</div>
          <div className="kpi-subtext" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
            54.2% Capacity
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
          <div className="kpi-title">
            <Compass size={16} color="var(--accent-purple)" />
            FUEL OIL
          </div>
          <div className="kpi-value">{currentVessel.fuelVolumeM3?.toLocaleString()} m³</div>
          <div className="kpi-subtext" style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>
            61.3% Capacity
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
          <div className="kpi-title">
            <Anchor size={16} color="var(--accent-emerald)" />
            DRAFT &amp; TRIM
          </div>
          <div className="kpi-value">{draft ? draft.meanDraftM.toFixed(2) : '4.85'} m</div>
          <div className="kpi-subtext" style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
            Trim: {draft ? `${draft.trimM > 0 ? '+' : ''}${draft.trimM.toFixed(2)} m (Stern)` : '+0.05 m'}
          </div>
        </div>
      </div>

            {/* Central Vessel Visualization Schematic */}
      <div className="schematic-wrapper">
        <div className="flex-between mb-3" style={{ alignItems: "center" }}>
          <div>
            <h2 className="view-title flex-center gap-2 mb-1" style={{ fontSize: "18px" }}>
              <Ship className="text-cyan" size={20} />
              <span>{currentVessel.name} Digital Twin Compartment Layout</span>
              <span className="badge badge-normal text-2xs font-bold">{currentVessel.type}</span>
            </h2>
            <p className="view-subtitle mb-0">
              Panoramic deck view • Select any cargo or slop compartment to open instant telemetry diagnostics and 24h operational trends.
            </p>
          </div>

          {/* Orientation Switcher Pill */}
          <div className="flex-center gap-2">
            <div className="aspect-mode-pills flex gap-1">
              <button
                type="button"
                className={`aspect-pill-btn ${orientation === "HORIZONTAL" ? "active" : ""}`}
                onClick={() => setOrientation("HORIZONTAL")}
                title="Horizontal Panoramic Deck View"
              >
                ↔ Horizontal Layout
              </button>
              <button
                type="button"
                className={`aspect-pill-btn ${orientation === "VERTICAL" ? "active" : ""}`}
                onClick={() => setOrientation("VERTICAL")}
                title="Vertical Bow-to-Stern Layout"
              >
                ↕ Vertical Layout
              </button>
            </div>
          </div>
        </div>

        {/* 1. HORIZONTAL VESSEL LOAD PREVIEW BAR */}
        <div className="horizontal-load-preview-card">
          <div className="flex-between mb-2">
            <div className="flex-center gap-2">
              <Layers size={14} className="text-amber" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Vessel Longitudinal Cargo Load Distribution
              </span>
              <span className="badge badge-live text-2xs font-bold">
                {overallFillPct.toFixed(1)}% OVERALL LOAD
              </span>
            </div>

            <div className="flex-center gap-3 text-xs font-mono">
              <span>
                Total Liquid Cargo: <strong className="text-amber">{Math.round(totalVolume).toLocaleString()} m³</strong>
              </span>
              <span className="text-muted">•</span>
              <span>
                Available Ullage: <strong className="text-cyan">{Math.round(Math.max(0, totalCapacity - totalVolume)).toLocaleString()} m³</strong>
              </span>
            </div>
          </div>

          {/* Segmented Load Distribution Progress Track */}
          <div className="load-distribution-bar-track">
            <div
              className="load-segment seg-fore"
              style={{ flex: foreTanks.length || 1 }}
              title={`Fore Cargo Load: ${Math.round(foreVol).toLocaleString()} m³`}
            >
              <span className="seg-label">
                FORE ({foreTanks.length > 0 ? ((foreVol / (totalVolume || 1)) * 100).toFixed(0) : 0}%)
              </span>
              <div
                className="seg-fill-level"
                style={{
                  width: `${foreTanks.length > 0 ? Math.min(100, tanks[foreTanks[0]]?.fillingPercentage || 70) : 0}%`,
                }}
              />
            </div>

            <div
              className="load-segment seg-mid"
              style={{ flex: midTanks.length || 1 }}
              title={`Midship Cargo Load: ${Math.round(midVol).toLocaleString()} m³`}
            >
              <span className="seg-label">
                MIDSHIP ({midTanks.length > 0 ? ((midVol / (totalVolume || 1)) * 100).toFixed(0) : 0}%)
              </span>
              <div
                className="seg-fill-level"
                style={{
                  width: `${midTanks.length > 0 ? Math.min(100, tanks[midTanks[0]]?.fillingPercentage || 70) : 0}%`,
                }}
              />
            </div>

            <div
              className="load-segment seg-aft"
              style={{ flex: aftTanks.length || 1 }}
              title={`Aft Cargo Load: ${Math.round(aftVol).toLocaleString()} m³`}
            >
              <span className="seg-label">
                AFT ({aftTanks.length > 0 ? ((aftVol / (totalVolume || 1)) * 100).toFixed(0) : 0}%)
              </span>
              <div
                className="seg-fill-level"
                style={{
                  width: `${aftTanks.length > 0 ? Math.min(100, tanks[aftTanks[0]]?.fillingPercentage || 70) : 0}%`,
                }}
              />
            </div>

            {slopTanks.length > 0 && (
              <div
                className="load-segment seg-slop"
                style={{ flex: 1 }}
                title={`Slop Tanks Load: ${Math.round(slopVol).toLocaleString()} m³`}
              >
                <span className="seg-label">
                  SLOP ({slopTanks.length > 0 ? ((slopVol / (totalVolume || 1)) * 100).toFixed(0) : 0}%)
                </span>
                <div
                  className="seg-fill-level"
                  style={{
                    width: `${slopTanks.length > 0 ? Math.min(100, tanks[slopTanks[0]]?.fillingPercentage || 45) : 0}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* 2. HORIZONTAL OR VERTICAL DIGITAL TWIN COMPARTMENT LAYOUT */}
        {orientation === "HORIZONTAL" ? (
          <div className="horizontal-digital-twin-container">
            {/* Top Longitudinal Guide: PORT SIDE */}
            <div className="transverse-guide-strip port-guide flex-between">
              <div className="flex-center gap-2">
                <span className="beacon-indicator beacon-port" />
                <span className="text-xs font-bold text-danger tracking-wider">PORT COMPARTMENTS (P)</span>
                <span className="text-2xs text-muted font-mono">
                  • RED NAVIGATION SECTOR • MID PORT DRAFT {draft?.midPortDraftM?.toFixed(2) || "4.87"}m
                </span>
              </div>
              <span className="text-2xs text-muted font-mono uppercase">
                SCADA TELEMETRY SYNC: ACTIVE
              </span>
            </div>

            {/* Main Horizontal Hull Frame */}
            <div className="hull-frame-horizontal">
              {/* Bow Cap (Left) */}
              <div className="bow-horizontal-cap">
                <div className="bow-tip-icon">
                  <ChevronLeft size={22} className="text-cyan animate-pulse" />
                </div>
                <div className="bow-vertical-text">
                  <span>BOW</span>
                  <span className="text-2xs text-muted font-mono">FORWARD</span>
                </div>
                <div className="bow-draft-badge" title="Forward Draft Sounding">
                  {draft?.foreDraftM?.toFixed(2) || "4.85"}m
                </div>
              </div>

              {/* Compartments Bay Columns */}
              <div className="horizontal-bays-grid" style={{ gridTemplateColumns: `repeat(${bayColumns.length}, minmax(170px, 1fr))` }}>
                {bayColumns.map((bay) => (
                  <div key={bay.key} className="bay-column-unit">
                    <div className="bay-column-header flex-between">
                      <span className="bay-title">{bay.title}</span>
                      <span className="bay-subtitle">{bay.subtitle}</span>
                    </div>

                    <div className="bay-tanks-stack">
                      {bay.tanks.port && renderTankCard(bay.tanks.port)}

                      <div className="manifold-centerline-corridor">
                        <span className="manifold-pipe-line" />
                        <div className="manifold-valve-node" title="Crossover Cargo Manifold Valve">
                          <span className="valve-icon">⧖</span>
                        </div>
                        <span className="manifold-pipe-line" />
                      </div>

                      {bay.tanks.center && (
                        <>
                          {renderTankCard(bay.tanks.center)}
                          <div className="manifold-centerline-corridor">
                            <span className="manifold-pipe-line" />
                            <div className="manifold-valve-node" title="Center Tank Crossover Valve">
                              <span className="valve-icon">⧖</span>
                            </div>
                            <span className="manifold-pipe-line" />
                          </div>
                        </>
                      )}

                      {bay.tanks.stbd && renderTankCard(bay.tanks.stbd)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Stern Cap (Right) */}
              <div className="stern-horizontal-cap">
                <div className="stern-superstructure-box">
                  <div className="bridge-tag">BRIDGE</div>
                  <div className="funnel-dot" />
                </div>
                <div className="stern-vertical-text">
                  <span>STERN</span>
                  <span className="text-2xs text-muted font-mono">AFT</span>
                </div>
                <div className="stern-tip-icon">
                  <ChevronRight size={22} className="text-muted" />
                </div>
                <div className="stern-draft-badge" title="Aft Draft Sounding">
                  {draft?.aftDraftM?.toFixed(2) || "4.90"}m
                </div>
              </div>
            </div>

            {/* Bottom Longitudinal Guide: STARBOARD SIDE */}
            <div className="transverse-guide-strip stbd-guide flex-between">
              <div className="flex-center gap-2">
                <span className="beacon-indicator beacon-stbd" />
                <span className="text-xs font-bold text-emerald tracking-wider">STARBOARD COMPARTMENTS (S)</span>
                <span className="text-2xs text-muted font-mono">
                  • GREEN NAVIGATION SECTOR • MID STBD DRAFT {draft?.midStbdDraftM?.toFixed(2) || "4.88"}m
                </span>
              </div>
              <div className="text-2xs text-muted font-mono">
                TRIM:{" "}
                <strong className="text-cyan">
                  {draft ? `${draft.trimM >= 0 ? "+" : ""}${draft.trimM.toFixed(2)}m` : "+0.05m"}
                </strong>{" "}
                • HEEL:{" "}
                <strong className="text-cyan">
                  {draft ? `${draft.heelDeg.toFixed(1)}°` : "0.1°"}
                </strong>
              </div>
            </div>
          </div>
        ) : (
          /* VERTICAL FALLBACK LAYOUT */
          <div className="hull-frame">
            <div className="bow-marker">
              <ChevronUp size={22} />
              <span>BOW (FORWARD)</span>
            </div>
            {foreTanks.length > 0 && (
              <>
                <div className="section-label">FORE CARGO COMPARTMENTS</div>
                <div className={foreTanks.length > 2 ? "tanks-grid-3" : "tanks-grid-2"}>
                  {foreTanks.map((id) => renderTankCard(id))}
                </div>
              </>
            )}
            {midTanks.length > 0 && (
              <>
                <div className="section-label">MIDSHIP CARGO COMPARTMENTS</div>
                <div className={midTanks.length > 2 ? "tanks-grid-3" : "tanks-grid-2"}>
                  {midTanks.map((id) => renderTankCard(id))}
                </div>
              </>
            )}
            {aftTanks.length > 0 && (
              <>
                <div className="section-label">AFT CARGO COMPARTMENTS</div>
                <div className={aftTanks.length > 2 ? "tanks-grid-3" : "tanks-grid-2"}>
                  {aftTanks.map((id) => renderTankCard(id))}
                </div>
              </>
            )}
            {slopTanks.length > 0 && (
              <>
                <div className="section-label">SLOP TANKS (PORT &amp; STARBOARD)</div>
                <div className="tanks-grid-2">
                  {slopTanks.map((id) => renderTankCard(id))}
                </div>
              </>
            )}
            <div className="stern-marker">
              <span>STERN (AFT)</span>
              <ChevronDown size={22} />
            </div>
          </div>
        )}
      </div>

{/* Slide-out Diagnostic Drawer */}
      <TankDrawer
        tank={drawerOpen && selectedTank ? selectedTank : null}
        onClose={() => setDrawerOpen(false)}
        onOpenTelemetryWorkspace={onOpenTelemetryWorkspace}
      />
    </div>
  );
};
