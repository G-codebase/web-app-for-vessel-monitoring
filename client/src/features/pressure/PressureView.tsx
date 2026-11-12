import React, { useState } from "react";
import {
  Gauge,
  Radio,
  Activity,
  Play,
  RotateCcw,
  Download,
  Cpu,
  Clock,
} from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";
import * as api from "../../services/api";

export const PressureView: React.FC = () => {
  const {
    currentVesselId,
    vessels,
    manifolds,
    triggerRocSpike,
    resetSimulation,
    isDataInitiated,
    initiateDataRender,
  } = useTelemetry();
  const currentVessel = vessels.find((v) => v.vesselId === currentVesselId) || { name: "MT Ocean Star" };
  const [downloading, setDownloading] = useState(false);
  const [triggering, setTriggering] = useState(false);

  const samplePressureSensor = {
    deviceId: "line1-press-pc",
    tag: "Pressure",
    state: "NORMAL",
    value: 12.4,
    limit: 14.0,
    unit: "bar",
    difference: -1.6,
    message: "Main cargo line pressure within operational boundaries.",
    sourceTimestamp: new Date().toISOString(),
    quality: "GOOD",
  };

  const handleExportCsv = async () => {
    try {
      setDownloading(true);
      await api.triggerCsvDownload(currentVesselId, { category: "Pressure" });
    } catch (err) {
      console.error("Pressure CSV export failed", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleTriggerSpike = async () => {
    try {
      setTriggering(true);
      await triggerRocSpike("C05");
    } finally {
      setTriggering(false);
    }
  };

  // If telemetry stream has not been rendered / initiated from VPS storage
  if (!isDataInitiated || manifolds.length === 0) {
    return (
      <div className="telemetry-view-container">
        {/* Top Header */}
        <div className="view-header-row">
          <div>
            <h2 className="view-title flex items-center gap-2">
              <Gauge className="text-cyan" size={24} />
              <span>Pressure Dynamics & Manifold Surveillance</span>
            </h2>
            <p className="view-subtitle">
              Cargo line pressure, vapor recovery ullage, and rate-of-change surge protection on{" "}
              <strong className="text-white">{currentVessel.name}</strong>
            </p>
          </div>
        </div>

        {/* Standby Not Initiated Panel */}
        <div className="standby-notice-card">
          <div className="standby-icon-badge">
            <Radio size={30} className="text-amber animate-pulse" />
          </div>
          <span className="badge badge-warning text-xs mb-2">TELEMETRY NOT INITIATED</span>
          <h3 className="text-white font-bold text-lg mb-2">
            Pressure & Manifold Telemetry in Standby
          </h3>
          <p className="text-muted text-xs max-w-md mx-auto mb-5 leading-relaxed">
            Hydraulic line pressure and manifold transducers have not been initiated for <strong>{currentVessel.name}</strong>.
            Please select an allocated date snapshot from VPS Storage or initiate telemetry rendering to view active manifold transducers and surge protection dynamics.
          </p>
          <button
            id="btn-pressure-initiate"
            type="button"
            onClick={() => initiateDataRender()}
            className="btn btn-primary flex-center gap-2"
          >
            <Radio size={14} />
            <span>Initiate Telemetry Render</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="telemetry-view-container">
      {/* Top Header */}
      <div className="view-header-row">
        <div>
          <h2 className="view-title flex items-center gap-2">
            <Gauge className="text-cyan" size={24} />
            <span>Pressure Dynamics & Manifold Surveillance</span>
          </h2>
          <p className="view-subtitle">
            Cargo line pressure, vapor recovery ullage, and rate-of-change surge protection on{" "}
            <strong className="text-white">{currentVessel.name}</strong>
          </p>
        </div>

        <div className="view-actions-bar">
          <button
            onClick={handleTriggerSpike}
            disabled={triggering}
            className="btn btn-warning btn-sm flex items-center gap-1.5"
            title="Inject synthetic rapid pressure surge into Cargo Tank C05"
          >
            <Play size={14} />
            <span>{triggering ? "Surging..." : "Simulate Surge (+4.5 mbar)"}</span>
          </button>

          <button
            onClick={resetSimulation}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
            title="Reset telemetry simulation to nominal state"
          >
            <RotateCcw size={14} />
            <span>Reset SCADA</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={downloading}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>{downloading ? "Exporting..." : "Export Pressure CSV"}</span>
          </button>
        </div>
      </div>

      {/* Featured Pressure Probe */}
      <div className="panel card-highlight-box mb-4">
        <div className="panel-header flex-between">
          <div className="flex-center gap-2">
            <Cpu size={18} className="text-cyan" />
            <span className="font-semibold text-white">
              Manifold Transducer: <code className="code-badge">{samplePressureSensor.deviceId}</code>
            </span>
            <span className="badge badge-live font-bold">STATE: {samplePressureSensor.state}</span>
          </div>
          <div className="text-xs text-muted flex-center gap-1">
            <Clock size={12} />
            <span>Last Scan: {new Date(samplePressureSensor.sourceTimestamp).toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="panel-body">
          <div className="metrics-quad-grid">
            <div className="metric-tile accent-cyan">
              <span className="metric-label">Line Hydraulic Pressure</span>
              <div className="metric-value-row">
                <span className="metric-number text-cyan">{samplePressureSensor.value.toFixed(2)}</span>
                <span className="metric-unit">{samplePressureSensor.unit}</span>
              </div>
              <span className="metric-subtext text-muted">Nominal Operating Range (6 - 14 bar)</span>
            </div>

            <div className="metric-tile">
              <span className="metric-label">High Safety Trip Threshold</span>
              <div className="metric-value-row">
                <span className="metric-number text-amber">{samplePressureSensor.limit.toFixed(2)}</span>
                <span className="metric-unit">{samplePressureSensor.unit}</span>
              </div>
              <span className="metric-subtext text-muted">High-Pressure Alarm Setpoint</span>
            </div>

            <div className="metric-tile">
              <span className="metric-label">Margin to Trip Limit</span>
              <div className="metric-value-row">
                <span className="metric-number text-green">{Math.abs(samplePressureSensor.difference).toFixed(2)}</span>
                <span className="metric-unit">bar margin</span>
              </div>
              <span className="metric-subtext text-green font-semibold">✓ Safe Hydraulic Margin</span>
            </div>

            <div className="metric-tile">
              <span className="metric-label">Rate-of-Change Engine</span>
              <div className="metric-value-row">
                <span className="metric-number text-white font-mono">+0.12</span>
                <span className="metric-unit">bar/min</span>
              </div>
              <span className="metric-subtext text-muted">Trip Rule: ≥ 3.0 mbar/min rise</span>
            </div>
          </div>
        </div>
      </div>

      {/* Manifold Array Cards */}
      <div className="panel mb-4">
        <div className="panel-header flex-between">
          <div className="flex-center gap-2">
            <Activity size={18} className="text-cyan" />
            <span className="font-semibold text-white">Vessel Manifold Transducers</span>
          </div>
          <span className="text-xs text-muted">{manifolds.length} active manifold monitoring points</span>
        </div>

        <div className="panel-body">
          <div className="grid grid-3">
            {manifolds.map((m) => {
              const isCrit = m.alarmStatus === "CRITICAL";
              return (
                <div key={m.pointId} className={`card ${isCrit ? "border-danger" : ""}`}>
                  <div className="card-header flex-between">
                    <div>
                      <h4 className="card-title text-sm">{m.name}</h4>
                      <span className="text-xs text-muted font-mono">{m.pointId}</span>
                    </div>
                    <span className={`badge ${isCrit ? "badge-critical" : "badge-normal"}`}>
                      {m.valveStatus}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="flex-between py-2 border-b">
                      <span className="text-xs text-muted">Line Pressure:</span>
                      <strong className={`font-mono text-base ${isCrit ? "text-danger" : "text-cyan"}`}>
                        {m.pressureBar.toFixed(2)} bar
                      </strong>
                    </div>

                    <div className="flex-between py-2 border-b">
                      <span className="text-xs text-muted">Flow Rate:</span>
                      <strong className="font-mono text-sm text-white">
                        {m.flowRateM3H.toFixed(0)} m³/h
                      </strong>
                    </div>

                    <div className="flex-between py-2">
                      <span className="text-xs text-muted">Rate of Change:</span>
                      <span
                        className={`font-mono text-xs font-semibold ${
                          Math.abs(m.rateOfChangeBarPerMin) > 2 ? "text-danger" : "text-green"
                        }`}
                      >
                        {m.rateOfChangeBarPerMin > 0 ? "+" : ""}
                        {m.rateOfChangeBarPerMin.toFixed(2)} bar/min
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
