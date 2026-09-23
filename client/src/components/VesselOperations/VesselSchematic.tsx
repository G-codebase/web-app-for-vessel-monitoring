import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { TankDrawer } from './TankDrawer';
import {
  Ship,
  Layers,
  Thermometer,
  Gauge,
  Droplets,
  Anchor,
  Compass,
  ChevronUp,
  ChevronDown,
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
    connectionStatus,
    selectedTankId,
    setSelectedTankId,
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
    };

  const selectedTank = selectedTankId ? tanks[selectedTankId] || null : null;

  const foreTanks = ['C01', 'C02', 'C03'];
  const midTanks = ['C04', 'C05', 'C06'];
  const aftTanks = ['C07', 'C08', 'C09'];
  const slopTanks = ['SLOP-P', 'SLOP-S'];

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
        onClick={() => setSelectedTankId(id)}
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
            <span className="badge badge-live">
              <span className="status-dot live" />
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
            <span>IMO {currentVessel.imo}</span>
            <span>•</span>
            <span>Data latency: {latencySec}s</span>
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
            onClick={() => onOpenTelemetryWorkspace('C05')}
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
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
            Interactive Tanker Digital Twin Schematic
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Select any cargo or slop tank to open instant telemetry diagnostics and 24h operational trends.
          </p>
        </div>

        <div className="hull-frame">
          {/* Bow Marker */}
          <div className="bow-marker">
            <ChevronUp size={22} />
            <span>BOW (FORWARD)</span>
          </div>

          {/* Fore Tanks Section */}
          <div className="section-label">FORE CARGO TANKS</div>
          <div className="tanks-grid-3">
            {foreTanks.map((id) => renderTankCard(id))}
          </div>

          {/* Mid Tanks Section */}
          <div className="section-label">MIDSHIP CARGO TANKS</div>
          <div className="tanks-grid-3">
            {midTanks.map((id) => renderTankCard(id))}
          </div>

          {/* Aft Tanks Section */}
          <div className="section-label">AFT CARGO TANKS</div>
          <div className="tanks-grid-3">
            {aftTanks.map((id) => renderTankCard(id))}
          </div>

          {/* Slop Tanks Section */}
          <div className="section-label">SLOP TANKS (PORT &amp; STARBOARD)</div>
          <div className="tanks-grid-2">
            {slopTanks.map((id) => renderTankCard(id))}
          </div>

          {/* Stern Marker */}
          <div className="stern-marker">
            <span>STERN (AFT)</span>
            <ChevronDown size={22} />
          </div>
        </div>
      </div>

      {/* Slide-out Diagnostic Drawer */}
      <TankDrawer
        tank={selectedTank}
        onClose={() => setSelectedTankId(null)}
        onOpenTelemetryWorkspace={onOpenTelemetryWorkspace}
      />
    </div>
  );
};
