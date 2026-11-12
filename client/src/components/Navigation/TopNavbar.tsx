import React, { useState, useEffect } from "react";
import {
  Ship,
  Radio,
  Clock,
  CloudLightning,
  AlertTriangle,
  Download,
  Database,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";
import { AccountMenu } from "./AccountMenu";

interface TopNavbarProps {
  onNavigateToHistory?: () => void;
  onNavigateToCloud?: () => void;
  onNavigateToUsers?: () => void;
  onNavigateToAudit?: () => void;
  onNavigateToAlarms?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onNavigateToHistory,
  onNavigateToCloud,
  onNavigateToUsers,
  onNavigateToAudit,
  onNavigateToAlarms,
}) => {
  const {
    cloudStatus,
    vessels,
    currentVesselId,
    setCurrentVesselId,
    alarmStats,
    selectedDate,
    setSelectedDate,
    vpsStorageDates,
    vpsActiveFile,
    vpsOperationalContext,
    isLoadingDateTelemetry,
    isDataInitiated,
    initiateDataRender,
    resetToNotInitiated,
  } = useTelemetry();

  const currentVessel = vessels.find((v) => v.vesselId === currentVesselId) || vessels[0];
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toISOString().slice(11, 19);
      setUtcTime(`${timeStr} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="top-navbar-container">
      {/* 1. LEFT ZONE: Streamlined Vessel Twin & Connection Gate */}
      <div className="top-navbar-left">
        {/* Vessel Switcher */}
        <div className="vessel-selector-widget" title="Active Fleet Digital Twin">
          <Ship size={15} className="text-cyan shrink-0" />
          <select
            id="vessel-select-dropdown"
            value={currentVesselId}
            onChange={(e) => setCurrentVesselId(e.target.value)}
            className="vessel-header-select"
            title="Switch Active Vessel Digital Twin"
          >
            {vessels.map((v) => (
              <option key={v.vesselId} value={v.vesselId}>
                {v.name}
              </option>
            ))}
          </select>
          {currentVessel && <span className="vessel-imo-tag">IMO {currentVessel.imo || "9876543"}</span>}
          <ChevronDown size={12} className="text-muted pointer-events-none" />
        </div>

        {/* Unified Cloud & Telemetry Gateway Pill */}
        <button
          type="button"
          onClick={onNavigateToCloud}
          className={`system-status-pill ${
            cloudStatus === "CONNECTED"
              ? isDataInitiated
                ? "status-rendered"
                : "status-online"
              : cloudStatus === "ERROR"
              ? "status-error"
              : "status-standby"
          }`}
          title={
            isDataInitiated
              ? `Telemetry Live: Rendering [${vpsActiveFile}]. Click for Cloud details.`
              : `Cloud ${cloudStatus}. Click to inspect Cloud Ingestion gateway.`
          }
        >
          <span
            className={`status-dot ${
              cloudStatus === "CONNECTED" ? "live" : "offline"
            }`}
          />
          {cloudStatus === "CONNECTED" ? (
            isDataInitiated ? (
              <>
                <Radio size={11} className="text-cyan animate-pulse" />
                <span>STREAMING</span>
              </>
            ) : (
              <>
                <CloudLightning size={11} />
                <span>CLOUD LIVE</span>
              </>
            )
          ) : (
            <>
              <CloudLightning size={11} />
              <span>CLOUD: {cloudStatus}</span>
            </>
          )}
        </button>
      </div>

      {/* 2. CENTER ZONE: Compact VPS Date Controller Capsule */}
      <div className="top-navbar-center">
        <div className="vps-controller-card" title={vpsOperationalContext || "VPS Telemetry Repository"}>
          <Database size={13} className="text-cyan shrink-0" />
          <span className="text-muted text-2xs font-semibold uppercase tracking-wider hidden-mobile">
            VPS:
          </span>

          {/* Compact Date Snapshot Select */}
          <select
            id="vps-date-select"
            className="vps-dropdown-select"
            value={selectedDate || ""}
            disabled={isLoadingDateTelemetry}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(e.target.value);
            }}
          >
            {!isDataInitiated && <option value="">Select Date...</option>}
            {vpsStorageDates.length > 0 ? (
              vpsStorageDates.map((item) => (
                <option key={item.date} value={item.date}>
                  {item.date} ({item.operationalContext.split("—")[0].trim()})
                </option>
              ))
            ) : (
              <>
                <option value="2026-10-12">2026-10-12 (Live Passage)</option>
                <option value="2026-10-11">2026-10-11 (Rough Swell)</option>
                <option value="2026-10-10">2026-10-10 (Cargo Alert)</option>
                <option value="2026-10-09">2026-10-09 (Moored Berth)</option>
                <option value="2026-10-08">2026-10-08 (IG Purge)</option>
              </>
            )}
          </select>

          {/* Render or Standby Action Button */}
          {isLoadingDateTelemetry ? (
            <div className="flex-center px-2">
              <RefreshCw size={12} className="text-cyan spin" />
            </div>
          ) : isDataInitiated ? (
            <button
              id="btn-topbar-standby"
              type="button"
              onClick={resetToNotInitiated}
              className="vps-action-btn btn-standby"
              title="Return to Standby mode"
            >
              <span>⏹ Standby</span>
            </button>
          ) : (
            <button
              id="btn-topbar-initiate"
              type="button"
              onClick={() => initiateDataRender()}
              className="vps-action-btn btn-render"
              title="Render selected VPS date snapshot"
            >
              <Radio size={11} />
              <span>⚡ Render</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. RIGHT ZONE: Critical Alarms, UTC Clock, & Executive Account Management */}
      <div className="top-navbar-right">
        {/* Critical Alarms Counter */}
        {alarmStats.criticalCount > 0 && (
          <button
            type="button"
            onClick={onNavigateToAlarms}
            className="alarm-counter-pill pulse-critical"
            title={`${alarmStats.criticalCount} Critical active alarms`}
          >
            <AlertTriangle size={12} />
            <span>{alarmStats.criticalCount} CRIT</span>
          </button>
        )}

        {/* Discreet UTC Clock */}
        <div className="utc-clock-badge hidden-mobile" title="Coordinated Universal Time">
          <Clock size={11} className="text-cyan" />
          <span>{utcTime}</span>
        </div>

        {/* Quick CSV Export */}
        {onNavigateToHistory && (
          <button
            type="button"
            onClick={onNavigateToHistory}
            className="header-icon-btn hidden-mobile"
            title="Export Vessel Telemetry CSV"
          >
            <Download size={13} className="text-cyan" />
          </button>
        )}

        {/* PROMINENT ACCOUNT MANAGEMENT COMPONENT */}
        <AccountMenu
          onNavigateToUsers={onNavigateToUsers}
          onNavigateToAudit={onNavigateToAudit}
          onNavigateToHistory={onNavigateToHistory}
        />
      </div>
    </header>
  );
};
