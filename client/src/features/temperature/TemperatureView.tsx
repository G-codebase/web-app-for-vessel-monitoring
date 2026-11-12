import React, { useState } from "react";
import {
  Thermometer,
  Radio,
  AlertTriangle,
  Clock,
  Cpu,
  Layers,
  Download,
  CheckCircle2,
} from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";
import * as api from "../../services/api";

export const TemperatureView: React.FC = () => {
  const { currentVesselId, vessels, tanks, isDataInitiated, initiateDataRender } = useTelemetry();
  const currentVessel = vessels.find((v) => v.vesselId === currentVesselId) || { name: "MT Ocean Star" };
  const [downloading, setDownloading] = useState(false);

  // Focus sensor: user sample line1-pc
  const sampleSensor = {
    deviceId: "line1-pc",
    tag: "Temperature",
    state: "HIGH",
    value: 82.5,
    limit: 80.0,
    unit: "°C",
    difference: 2.5,
    message: "Temperature above high limit: 82.5 °C (limit 80 °C)",
    sourceTimestamp: "2026-10-07T17:41:21.678Z",
    quality: "GOOD",
  };

  const handleExportCsv = async () => {
    try {
      setDownloading(true);
      await api.triggerCsvDownload(currentVesselId, { category: "Temperature" });
    } catch (err) {
      console.error("CSV export failed", err);
    } finally {
      setDownloading(false);
    }
  };

  const cargoTanksList = Object.values(tanks).filter((t) => t.type === "CARGO");

  // If telemetry stream has not been rendered / initiated from VPS storage
  if (!isDataInitiated || cargoTanksList.length === 0) {
    return (
      <div className="telemetry-view-container">
        {/* Top Header */}
        <div className="view-header-row">
          <div>
            <h2 className="view-title flex items-center gap-2">
              <Thermometer className="text-cyan" size={24} />
              <span>Temperature Surveillance</span>
            </h2>
            <p className="view-subtitle">
              Thermal monitoring of cargo lines, vapor headers, and thermal sensor probes for{" "}
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
            Thermal Stream in Standby
          </h3>
          <p className="text-muted text-xs max-w-md mx-auto mb-5 leading-relaxed">
            Temperature sensor streams have not been initiated for <strong>{currentVessel.name}</strong>.
            Please select an allocated date snapshot from VPS Storage or initiate telemetry rendering to view live primary cloud probes and multi-point tank thermal grids.
          </p>
          <button
            id="btn-temp-initiate"
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
            <Thermometer className="text-cyan" size={24} />
            <span>Temperature Surveillance</span>
          </h2>
          <p className="view-subtitle">
            Thermal monitoring of cargo lines, vapor headers, and thermal sensor probes for{" "}
            <strong className="text-white">{currentVessel.name}</strong>
          </p>
        </div>

        <div className="view-actions-bar">
          <button
            onClick={handleExportCsv}
            disabled={downloading}
            className="btn btn-secondary btn-sm flex items-center gap-2"
            title="Export all temperature readings to CSV"
          >
            <Download size={14} />
            <span>{downloading ? "Exporting..." : "Export Temperature CSV"}</span>
          </button>
        </div>
      </div>

      {/* Featured Telemetry Reading Card: External Cloud Device Sample */}
      <div className="panel card-highlight-box mb-4">
        <div className="panel-header flex-between">
          <div className="flex-center gap-2">
            <Cpu size={18} className="text-cyan" />
            <span className="font-semibold text-white">
              Primary Cloud Stream Probe: <code className="code-badge">{sampleSensor.deviceId}</code>
            </span>
            <span className="badge badge-critical font-bold">
              STATE: {sampleSensor.state}
            </span>
          </div>
          <div className="text-xs text-muted flex-center gap-1">
            <Clock size={12} />
            <span>Event Time: {new Date(sampleSensor.sourceTimestamp).toLocaleString()}</span>
          </div>
        </div>

        <div className="panel-body">
          <div className="metrics-quad-grid">
            {/* 1. Measured Value */}
            <div className="metric-tile accent-danger">
              <span className="metric-label">Current Reading</span>
              <div className="metric-value-row">
                <span className="metric-number text-danger">{sampleSensor.value.toFixed(1)}</span>
                <span className="metric-unit">{sampleSensor.unit}</span>
              </div>
              <span className="metric-subtext text-danger font-semibold">
                ▲ Exceeds High Threshold
              </span>
            </div>

            {/* 2. Safety Limit */}
            <div className="metric-tile">
              <span className="metric-label">Configured Safety Limit</span>
              <div className="metric-value-row">
                <span className="metric-number text-amber">{sampleSensor.limit.toFixed(1)}</span>
                <span className="metric-unit">{sampleSensor.unit}</span>
              </div>
              <span className="metric-subtext text-muted">
                Static High Thermal Boundary
              </span>
            </div>

            {/* 3. Difference above limit */}
            <div className="metric-tile accent-warning">
              <span className="metric-label">Difference Above Limit</span>
              <div className="metric-value-row">
                <span className="metric-number text-warning">+{sampleSensor.difference.toFixed(1)}</span>
                <span className="metric-unit">{sampleSensor.unit}</span>
              </div>
              <span className="metric-subtext text-warning font-semibold">
                +3.1% Thermal Deviation
              </span>
            </div>

            {/* 4. Quality & Device */}
            <div className="metric-tile">
              <span className="metric-label">Signal Quality & Source</span>
              <div className="metric-value-row">
                <span className="badge badge-live text-sm font-semibold flex items-center">
                  <CheckCircle2 size={13} className="mr-1 inline" /> {sampleSensor.quality}
                </span>
              </div>
              <span className="metric-subtext text-muted">
                Device: {sampleSensor.deviceId} (SCADA Line 1)
              </span>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="alert-notice-box mt-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-warning flex-shrink-0" />
            <div className="text-xs">
              <strong>Source Cloud Message:</strong> {sampleSensor.message}
            </div>
          </div>
        </div>
      </div>

      {/* Cargo Tanks Temperature Overview Grid */}
      <div className="panel">
        <div className="panel-header flex-between">
          <div className="flex-center gap-2">
            <Layers size={18} className="text-cyan" />
            <span className="font-semibold text-white">Cargo Tank Multi-Point Thermal Grid</span>
          </div>
          <span className="text-xs text-muted">Multi-strata probe telemetry (Top, Mid, Bottom)</span>
        </div>

        <div className="panel-body">
          <div className="tank-temperature-grid">
            {cargoTanksList.map((tank) => {
              const isOver = tank.temperatureC > 30;
              return (
                <div
                  key={tank.tankId}
                  className={`tank-thermal-card ${isOver ? "border-danger" : ""}`}
                >
                  <div className="flex-between mb-2">
                    <span className="font-semibold text-white">{tank.name}</span>
                    <span className={`badge ${isOver ? "badge-critical" : "badge-normal"}`}>
                      {tank.tankId}
                    </span>
                  </div>

                  <div className="thermal-readout-row flex items-center gap-2">
                    <Thermometer size={20} className={isOver ? "text-danger" : "text-cyan"} />
                    <span className={`thermal-main-deg ${isOver ? "text-danger" : "text-white"}`}>
                      {tank.temperatureC.toFixed(1)}°C
                    </span>
                  </div>

                  {/* Multi-depth strata breakdown */}
                  <div className="strata-breakdown">
                    <div className="strata-item">
                      <span className="text-muted">Top:</span>
                      <span>{(tank.temperatureTopC || tank.temperatureC - 0.4).toFixed(1)}°C</span>
                    </div>
                    <div className="strata-item">
                      <span className="text-muted">Mid:</span>
                      <span>{(tank.temperatureMidC || tank.temperatureC).toFixed(1)}°C</span>
                    </div>
                    <div className="strata-item">
                      <span className="text-muted">Btm:</span>
                      <span>{(tank.temperatureBtmC || tank.temperatureC + 0.3).toFixed(1)}°C</span>
                    </div>
                  </div>

                  <div className="tank-card-footer text-xs text-muted mt-2">
                    <span>Ullage: {tank.ullageM.toFixed(2)} m</span>
                    <span>Pressure: {tank.pressureMbar.toFixed(1)} mbar</span>
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
