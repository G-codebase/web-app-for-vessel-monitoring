import React, { useState } from "react";
import {
  Anchor,
  Radio,
  Compass,
  ChevronUp,
  ChevronDown,
  Clock,
  ShieldCheck,
  Activity,
  Layers,
  Eye,
  Maximize2,
} from "lucide-react";
import { useTelemetry } from "../../context/TelemetryContext";

export const PersistentDraftBar: React.FC = () => {
  const {
    draft,
    currentVesselId,
    vessels,
    selectedDate,
    vpsActiveFile,
    isDataInitiated,
    initiateDataRender,
  } = useTelemetry();
  const currentVessel = vessels.find((v) => v.vesselId === currentVesselId) || {
    name: "MT Ocean Star",
  };
  const [minimized, setMinimized] = useState(false);
  const [aspectMode, setAspectMode] = useState<"DUAL" | "FRONT" | "SIDE">("DUAL");

  if (!isDataInitiated || !draft) {
    return (
      <aside
        className="persistent-draft-tray tray-not-initiated"
        aria-label="Persistent Vessel Draft Status"
      >
        <div className="draft-tray-header flex-between py-2 px-4">
          <div className="flex-center gap-3">
            <Anchor size={15} className="text-amber" />
            <span className="text-xs font-semibold text-white tracking-wider uppercase">
              Hydrostatic Draft & Hull Dynamics
            </span>
            <span className="badge badge-warning text-2xs">NOT INITIATED</span>
            <span className="text-xs text-muted hidden-mobile">
              Draft sensor stream in standby. Select an allocated date from VPS storage or render telemetry.
            </span>
          </div>
          <button
            id="btn-draft-initiate"
            onClick={() => initiateDataRender()}
            className="btn btn-primary btn-xs flex-center gap-1"
          >
            <Radio size={12} />
            <span>Initiate Telemetry Render</span>
          </button>
        </div>
      </aside>
    );
  }

  const fore = draft.foreDraftM;
  const aft = draft.aftDraftM;
  const port = draft.midPortDraftM;
  const stbd = draft.midStbdDraftM;
  const mean = draft.meanDraftM;
  const trim = draft.trimM;
  const heel = draft.heelDeg;
  const disp = draft.displacementTons;

  // Real-time spatial attitude calculation
  // 1. Heel angle (roll): clockwise = Starboard list, counter-clockwise = Port list
  const heelAngle = Math.max(-12, Math.min(12, heel));

  // 2. Trim pitch angle: clockwise = trim by stern (stern sinks, bow lifts)
  // Scaled for intuitive nautical SCADA display (1m trim ~= 0.9° tilt on 190m LOA)
  const trimPitchAngle = Math.max(-6, Math.min(6, (trim / 190) * (180 / Math.PI) * 3));

  return (
    <aside
      className={`persistent-draft-tray ${minimized ? "tray-minimized" : ""}`}
      aria-label="Persistent Vessel Draft Status"
    >
      {/* Top Docked Header Bar */}
      <div
        className="draft-tray-header flex-between"
        onClick={() => setMinimized(!minimized)}
      >
        <div className="flex-center gap-2">
          <Anchor size={15} className="text-cyan" />
          <span className="text-xs font-semibold text-white tracking-wider uppercase">
            Persistent Vessel Draft & Hull Dynamics
          </span>
          <span className="code-badge text-xs">{currentVessel.name}</span>
          <span
            className="code-badge text-2xs"
            style={{
              background: "rgba(0, 240, 255, 0.12)",
              color: "#00f0ff",
              border: "1px solid rgba(0, 240, 255, 0.3)",
            }}
            title={`Telemetry dynamically rendered from VPS Storage file ${vpsActiveFile}`}
          >
            VPS: {vpsActiveFile}
          </span>
          <span className="text-xs text-muted font-mono">
            Mean Draft: <strong className="text-cyan">{mean.toFixed(2)}m</strong>
          </span>
        </div>

        <div className="flex-center gap-3">
          <div className="text-xs text-muted flex-center gap-1">
            <Clock size={11} />
            <span>
              Telemetry:{" "}
              {draft?.timestamp
                ? new Date(draft.timestamp).toLocaleTimeString()
                : "Live"}
            </span>
          </div>
          <button
            className="btn-icon btn-xs"
            aria-label={
              minimized ? "Expand vessel draft panel" : "Collapse vessel draft panel"
            }
          >
            {minimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="draft-tray-body">
          {/* 1. UNIFIED REAL VESSEL SPATIAL PREVIEW (FRONT & SIDE ATTITUDE) */}
          <div className="draft-unified-preview-container">
            {/* Aspect Mode Toolbar */}
            <div className="preview-top-toolbar flex-between">
              <div className="flex-center gap-2">
                <span className="badge badge-live text-2xs font-bold">
                  LIVE POSITION 6-DOF
                </span>
                <span className="text-xs font-semibold text-white">
                  Real Vessel Waterline & Spatial Attitude
                </span>
              </div>

              {/* View Switcher Pills */}
              <div className="aspect-mode-pills flex gap-1">
                <button
                  type="button"
                  className={`aspect-pill-btn ${aspectMode === "DUAL" ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAspectMode("DUAL");
                  }}
                  title="Front and Side dual perspective preview"
                >
                  Dual View
                </button>
                <button
                  type="button"
                  className={`aspect-pill-btn ${aspectMode === "FRONT" ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAspectMode("FRONT");
                  }}
                  title="Front transverse view: Port & Starboard"
                >
                  Front (Port / Stbd)
                </button>
                <button
                  type="button"
                  className={`aspect-pill-btn ${aspectMode === "SIDE" ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAspectMode("SIDE");
                  }}
                  title="Side profile elevation: Bow & Stern"
                >
                  Side (Bow / Stern)
                </button>
              </div>
            </div>

            {/* Preview Display Panes */}
            <div
              className={`vessel-panes-wrapper ${
                aspectMode === "DUAL"
                  ? "panes-dual"
                  : aspectMode === "FRONT"
                  ? "panes-front-only"
                  : "panes-side-only"
              }`}
            >
              {/* PANE A: FRONT TRANSVERSE VIEW (PORT & STARBOARD) */}
              {(aspectMode === "DUAL" || aspectMode === "FRONT") && (
                <div className="vessel-preview-card">
                  <div className="vessel-card-header flex-between">
                    <div className="flex-center gap-1.5">
                      <span className="beacon-indicator beacon-port" title="Port (Red)" />
                      <span className="beacon-indicator beacon-stbd" title="Starboard (Green)" />
                      <span className="vessel-card-title text-xs font-semibold text-white">
                        FRONT VIEW • PORT & STARBOARD
                      </span>
                    </div>
                    <span className="text-2xs font-mono text-muted">
                      HEEL:{" "}
                      <strong
                        className={
                          Math.abs(heel) > 0.05 ? "text-cyan" : "text-white"
                        }
                      >
                        {Math.abs(heel).toFixed(1)}°{" "}
                        {heel > 0.05
                          ? "STBD"
                          : heel < -0.05
                          ? "PORT"
                          : "UPRIGHT"}
                      </strong>
                    </span>
                  </div>

                  <div className="svg-canvas-wrapper">
                    <svg viewBox="0 0 340 120" className="vessel-front-svg">
                      <defs>
                        <linearGradient
                          id="frontWaterGrad"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="rgba(0, 240, 255, 0.45)" />
                          <stop offset="35%" stopColor="rgba(0, 160, 255, 0.22)" />
                          <stop offset="100%" stopColor="rgba(6, 28, 56, 0.65)" />
                        </linearGradient>
                        <linearGradient
                          id="frontHullGrad"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#121e33" />
                          <stop offset="30%" stopColor="#223657" />
                          <stop offset="50%" stopColor="#2c456f" />
                          <stop offset="70%" stopColor="#223657" />
                          <stop offset="100%" stopColor="#121e33" />
                        </linearGradient>
                        <linearGradient
                          id="deckHouseGrad"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#283e66" />
                          <stop offset="100%" stopColor="#15233b" />
                        </linearGradient>
                        <filter
                          id="portGlow"
                          x="-50%"
                          y="-50%"
                          width="200%"
                          height="200%"
                        >
                          <feDropShadow
                            dx="0"
                            dy="0"
                            stdDeviation="3"
                            floodColor="#ef4444"
                          />
                        </filter>
                        <filter
                          id="stbdGlow"
                          x="-50%"
                          y="-50%"
                          width="200%"
                          height="200%"
                        >
                          <feDropShadow
                            dx="0"
                            dy="0"
                            stdDeviation="3"
                            floodColor="#10b981"
                          />
                        </filter>
                      </defs>

                      {/* Water Surface Depth */}
                      <rect
                        x="0"
                        y="72"
                        width="340"
                        height="48"
                        fill="url(#frontWaterGrad)"
                      />
                      {/* Static Waterline Datum */}
                      <line
                        x1="10"
                        y1="72"
                        x2="330"
                        y2="72"
                        stroke="#00f0ff"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                      />

                      {/* Physically Rotating Vessel Hull (Roll / List by heelAngle) */}
                      <g
                        transform={`rotate(${heelAngle.toFixed(2)}, 170, 72)`}
                        style={{
                          transformOrigin: "170px 72px",
                          transition:
                            "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        {/* Wheelhouse & Navigation Bridge */}
                        <rect
                          x="135"
                          y="18"
                          width="70"
                          height="22"
                          rx="2"
                          fill="url(#deckHouseGrad)"
                          stroke="#38bdf8"
                          strokeWidth="0.8"
                        />
                        {/* Bridge Windows */}
                        <rect
                          x="140"
                          y="22"
                          width="60"
                          height="6"
                          rx="1"
                          fill="#00f0ff"
                          opacity="0.9"
                        />
                        {/* Centerline Radar Mast */}
                        <line
                          x1="170"
                          y1="6"
                          x2="170"
                          y2="18"
                          stroke="#94a3b8"
                          strokeWidth="2"
                        />
                        <line
                          x1="160"
                          y1="9"
                          x2="180"
                          y2="9"
                          stroke="#94a3b8"
                          strokeWidth="1.5"
                        />
                        <rect
                          x="163"
                          y="5"
                          width="14"
                          height="4"
                          rx="1"
                          fill="#f59e0b"
                        />

                        {/* Navigation Lights */}
                        {/* Port Light (Red) - Port Wing */}
                        <circle
                          cx="132"
                          cy="28"
                          r="3"
                          fill="#ef4444"
                          filter="url(#portGlow)"
                        />
                        {/* Starboard Light (Green) - Starboard Wing */}
                        <circle
                          cx="208"
                          cy="28"
                          r="3"
                          fill="#10b981"
                          filter="url(#stbdGlow)"
                        />

                        {/* Transverse Tanker Hull Silhouette */}
                        <path
                          d="M 90 40 L 105 40 L 108 72 Q 112 94, 136 98 L 204 98 Q 228 94, 232 72 L 235 40 L 250 40 Q 248 48, 240 70 Q 234 97, 206 102 L 134 102 Q 106 97, 100 70 Q 92 48, 90 40 Z"
                          fill="url(#frontHullGrad)"
                          stroke="rgba(0, 240, 255, 0.65)"
                          strokeWidth="1.5"
                        />

                        {/* Forecastle Sheer Deck Line */}
                        <path
                          d="M 90 40 Q 170 36, 250 40 L 244 44 Q 170 40, 96 44 Z"
                          fill="#1e2c45"
                          stroke="#38bdf8"
                          strokeWidth="0.8"
                        />

                        {/* Bulbous Bow Teardrop beneath baseline */}
                        <ellipse
                          cx="170"
                          cy="92"
                          rx="16"
                          ry="9"
                          fill="#15243b"
                          stroke="#00f0ff"
                          strokeWidth="1"
                        />
                        <circle
                          cx="170"
                          cy="92"
                          r="3"
                          fill="#00f0ff"
                          opacity="0.5"
                        />

                        {/* Centerline Keel Axis */}
                        <line
                          x1="170"
                          y1="40"
                          x2="170"
                          y2="102"
                          stroke="rgba(255, 255, 255, 0.15)"
                          strokeWidth="0.8"
                          strokeDasharray="3 3"
                        />

                        {/* Port Sounding Ticks */}
                        <line
                          x1="94"
                          y1="58"
                          x2="104"
                          y2="58"
                          stroke="#ef4444"
                          strokeWidth="1.5"
                        />
                        <line
                          x1="94"
                          y1="72"
                          x2="104"
                          y2="72"
                          stroke="#ef4444"
                          strokeWidth="2"
                        />
                        <line
                          x1="94"
                          y1="86"
                          x2="104"
                          y2="86"
                          stroke="#ef4444"
                          strokeWidth="1.5"
                        />

                        {/* Starboard Sounding Ticks */}
                        <line
                          x1="236"
                          y1="58"
                          x2="246"
                          y2="58"
                          stroke="#10b981"
                          strokeWidth="1.5"
                        />
                        <line
                          x1="236"
                          y1="72"
                          x2="246"
                          y2="72"
                          stroke="#10b981"
                          strokeWidth="2"
                        />
                        <line
                          x1="236"
                          y1="86"
                          x2="246"
                          y2="86"
                          stroke="#10b981"
                          strokeWidth="1.5"
                        />
                      </g>

                      {/* Overlay Port & Starboard Live Sounding Cards */}
                      {/* Port Callout */}
                      <g transform="translate(10, 14)">
                        <rect
                          x="0"
                          y="0"
                          width="68"
                          height="30"
                          rx="4"
                          fill="rgba(239, 68, 68, 0.15)"
                          stroke="rgba(239, 68, 68, 0.45)"
                          strokeWidth="1"
                        />
                        <text
                          x="34"
                          y="11"
                          fill="#ef4444"
                          fontSize="8.5"
                          fontWeight="700"
                          textAnchor="middle"
                          letterSpacing="0.08em"
                        >
                          PORT DRAFT
                        </text>
                        <text
                          x="34"
                          y="24"
                          fill="#fff"
                          fontSize="12"
                          fontWeight="800"
                          fontFamily="JetBrains Mono"
                          textAnchor="middle"
                        >
                          {port.toFixed(2)} m
                        </text>
                      </g>

                      {/* Starboard Callout */}
                      <g transform="translate(262, 14)">
                        <rect
                          x="0"
                          y="0"
                          width="68"
                          height="30"
                          rx="4"
                          fill="rgba(16, 185, 129, 0.15)"
                          stroke="rgba(16, 185, 129, 0.45)"
                          strokeWidth="1"
                        />
                        <text
                          x="34"
                          y="11"
                          fill="#10b981"
                          fontSize="8.5"
                          fontWeight="700"
                          textAnchor="middle"
                          letterSpacing="0.08em"
                        >
                          STBD DRAFT
                        </text>
                        <text
                          x="34"
                          y="24"
                          fill="#fff"
                          fontSize="12"
                          fontWeight="800"
                          fontFamily="JetBrains Mono"
                          textAnchor="middle"
                        >
                          {stbd.toFixed(2)} m
                        </text>
                      </g>
                    </svg>
                  </div>
                </div>
              )}

              {/* PANE B: SIDE PROFILE VIEW (BOW & STERN) */}
              {(aspectMode === "DUAL" || aspectMode === "SIDE") && (
                <div className="vessel-preview-card">
                  <div className="vessel-card-header flex-between">
                    <div className="flex-center gap-1.5">
                      <Anchor size={12} className="text-cyan" />
                      <span className="vessel-card-title text-xs font-semibold text-white">
                        SIDE PROFILE • LONGITUDINAL DYNAMICS
                      </span>
                    </div>
                    <span className="text-2xs font-mono text-muted">
                      TRIM:{" "}
                      <strong
                        className={
                          trim >= 0 ? "text-emerald" : "text-amber"
                        }
                      >
                        {trim >= 0 ? `+${trim.toFixed(2)}` : trim.toFixed(2)}m{" "}
                        {trim > 0.05
                          ? "(STERN)"
                          : trim < -0.05
                          ? "(HEAD)"
                          : "(EVEN)"}
                      </strong>
                    </span>
                  </div>

                  <div className="svg-canvas-wrapper">
                    <svg viewBox="0 0 440 120" className="vessel-side-svg">
                      <defs>
                        <linearGradient
                          id="sideWaterGrad"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="rgba(0, 240, 255, 0.45)" />
                          <stop offset="35%" stopColor="rgba(0, 160, 255, 0.22)" />
                          <stop offset="100%" stopColor="rgba(6, 28, 56, 0.65)" />
                        </linearGradient>
                        <linearGradient
                          id="sideHullGrad"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#1e314f" />
                          <stop offset="50%" stopColor="#16253d" />
                          <stop offset="100%" stopColor="#0b121e" />
                        </linearGradient>
                        <linearGradient
                          id="superstructureGrad"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#2c436d" />
                          <stop offset="100%" stopColor="#182740" />
                        </linearGradient>
                      </defs>

                      {/* Water Depth */}
                      <rect
                        x="0"
                        y="72"
                        width="440"
                        height="48"
                        fill="url(#sideWaterGrad)"
                      />
                      {/* Waterline Datum */}
                      <line
                        x1="10"
                        y1="72"
                        x2="430"
                        y2="72"
                        stroke="#00f0ff"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                      />

                      {/* Physically Pitching Vessel Hull (Trim by trimPitchAngle) */}
                      <g
                        transform={`rotate(${trimPitchAngle.toFixed(2)}, 220, 72)`}
                        style={{
                          transformOrigin: "220px 72px",
                          transition:
                            "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        {/* Tanker Profile Outline (Bow at Left x=40, Stern at Right x=420) */}
                        <path
                          d="M 45 42 L 85 42 L 350 42 L 352 38 L 404 38 L 414 50 L 416 76 L 402 90 L 380 98 L 55 98 L 38 90 Q 28 80, 32 70 L 45 42 Z"
                          fill="url(#sideHullGrad)"
                          stroke="rgba(0, 240, 255, 0.65)"
                          strokeWidth="1.5"
                        />

                        {/* Forecastle Bow Flare */}
                        <path
                          d="M 32 70 L 45 42 L 85 42 L 80 48 L 42 48 Z"
                          fill="#24385a"
                          opacity="0.8"
                        />

                        {/* Deck Cargo Pipeline Lines & Manifold Trunks */}
                        <line
                          x1="88"
                          y1="38"
                          x2="348"
                          y2="38"
                          stroke="#38bdf8"
                          strokeWidth="1.8"
                        />
                        <rect
                          x="170"
                          y="32"
                          width="7"
                          height="6"
                          fill="#f59e0b"
                        />
                        <rect
                          x="210"
                          y="30"
                          width="14"
                          height="8"
                          rx="1"
                          fill="#00f0ff"
                          opacity="0.85"
                        />
                        <rect
                          x="260"
                          y="32"
                          width="7"
                          height="6"
                          fill="#f59e0b"
                        />

                        {/* Midship Hose Crane */}
                        <line
                          x1="217"
                          y1="20"
                          x2="217"
                          y2="38"
                          stroke="#94a3b8"
                          strokeWidth="1.8"
                        />
                        <line
                          x1="208"
                          y1="22"
                          x2="226"
                          y2="22"
                          stroke="#94a3b8"
                          strokeWidth="1.2"
                        />

                        {/* Superstructure Accommodation Block (Aft) */}
                        <rect
                          x="352"
                          y="16"
                          width="48"
                          height="22"
                          rx="2"
                          fill="url(#superstructureGrad)"
                          stroke="#38bdf8"
                          strokeWidth="0.8"
                        />
                        {/* Bridge Windows Tier */}
                        <rect
                          x="358"
                          y="9"
                          width="36"
                          height="7"
                          rx="1"
                          fill="#1b2a44"
                          stroke="#38bdf8"
                          strokeWidth="0.8"
                        />
                        <rect
                          x="360"
                          y="11"
                          width="32"
                          height="3.5"
                          fill="#00f0ff"
                          opacity="0.9"
                        />

                        {/* Funnel / Exhaust Stack */}
                        <path
                          d="M 386 5 L 398 5 L 396 16 L 384 16 Z"
                          fill="#ef4444"
                          stroke="#94a3b8"
                          strokeWidth="0.8"
                        />
                        <rect
                          x="386"
                          y="5"
                          width="10"
                          height="2.5"
                          fill="#00f0ff"
                        />

                        {/* Main Radar Mast */}
                        <line
                          x1="375"
                          y1="1"
                          x2="375"
                          y2="9"
                          stroke="#94a3b8"
                          strokeWidth="1.5"
                        />
                        <line
                          x1="370"
                          y1="3"
                          x2="380"
                          y2="3"
                          stroke="#94a3b8"
                          strokeWidth="1"
                        />

                        {/* Underwater Rudder & Propeller */}
                        <rect
                          x="404"
                          y="78"
                          width="5"
                          height="16"
                          fill="#1e293b"
                          stroke="#38bdf8"
                          strokeWidth="0.8"
                        />
                        <ellipse
                          cx="394"
                          cy="88"
                          rx="3.5"
                          ry="6"
                          fill="#f59e0b"
                          opacity="0.8"
                        />

                        {/* Forward & Aft Sounding Gauge Marks */}
                        <circle cx="50" cy="72" r="3" fill="#f59e0b" />
                        <line
                          x1="50"
                          y1="54"
                          x2="50"
                          y2="90"
                          stroke="#f59e0b"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />

                        <circle cx="400" cy="72" r="3" fill="#10b981" />
                        <line
                          x1="400"
                          y1="54"
                          x2="400"
                          y2="90"
                          stroke="#10b981"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                      </g>

                      {/* Overlay Bow & Stern Live Sounding Cards */}
                      {/* Bow Callout (Left) */}
                      <g transform="translate(10, 14)">
                        <rect
                          x="0"
                          y="0"
                          width="68"
                          height="30"
                          rx="4"
                          fill="rgba(245, 158, 11, 0.15)"
                          stroke="rgba(245, 158, 11, 0.45)"
                          strokeWidth="1"
                        />
                        <text
                          x="34"
                          y="11"
                          fill="#f59e0b"
                          fontSize="8.5"
                          fontWeight="700"
                          textAnchor="middle"
                          letterSpacing="0.08em"
                        >
                          BOW (FORE)
                        </text>
                        <text
                          x="34"
                          y="24"
                          fill="#fff"
                          fontSize="12"
                          fontWeight="800"
                          fontFamily="JetBrains Mono"
                          textAnchor="middle"
                        >
                          {fore.toFixed(2)} m
                        </text>
                      </g>

                      {/* Stern Callout (Right) */}
                      <g transform="translate(362, 14)">
                        <rect
                          x="0"
                          y="0"
                          width="68"
                          height="30"
                          rx="4"
                          fill="rgba(16, 185, 129, 0.15)"
                          stroke="rgba(16, 185, 129, 0.45)"
                          strokeWidth="1"
                        />
                        <text
                          x="34"
                          y="11"
                          fill="#10b981"
                          fontSize="8.5"
                          fontWeight="700"
                          textAnchor="middle"
                          letterSpacing="0.08em"
                        >
                          STERN (AFT)
                        </text>
                        <text
                          x="34"
                          y="24"
                          fill="#fff"
                          fontSize="12"
                          fontWeight="800"
                          fontFamily="JetBrains Mono"
                          textAnchor="middle"
                        >
                          {aft.toFixed(2)} m
                        </text>
                      </g>
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. HYDROSTATIC TELEMETRY METRICS PANEL (MIDPORT & MIDSTBD REPLACED BY VESSEL PREVIEW) */}
          <div className="draft-metrics-panel">
            <div className="draft-metric-block">
              <span className="text-muted text-xs font-semibold">
                Forward (Bow) Draft
              </span>
              <div className="flex-between">
                <strong className="text-amber font-mono text-base font-bold">
                  {fore.toFixed(2)} m
                </strong>
                <span className="text-2xs text-muted font-mono">FORE MARK</span>
              </div>
            </div>

            <div className="draft-metric-block">
              <span className="text-muted text-xs font-semibold">
                Aft (Stern) Draft
              </span>
              <div className="flex-between">
                <strong className="text-emerald font-mono text-base font-bold">
                  {aft.toFixed(2)} m
                </strong>
                <span className="text-2xs text-muted font-mono">AFT MARK</span>
              </div>
            </div>

            <div className="draft-metric-block">
              <span className="text-muted text-xs font-semibold">
                Mean Hydrostatic Draft
              </span>
              <div className="flex-between">
                <strong className="text-cyan font-mono text-base font-bold">
                  {mean.toFixed(2)} m
                </strong>
                <span className="text-2xs text-muted font-mono">STABILITY</span>
              </div>
            </div>

            <div className="draft-metric-block">
              <span className="text-muted text-xs font-semibold">
                Calculated Trim
              </span>
              <div className="flex-between">
                <strong
                  className={`font-mono text-base font-bold ${
                    trim >= 0 ? "text-emerald" : "text-amber"
                  }`}
                >
                  {trim >= 0 ? `+${trim.toFixed(2)} m` : `${trim.toFixed(2)} m`}
                </strong>
                <span
                  className={`badge text-2xs ${
                    trim >= 0 ? "badge-good" : "badge-warning"
                  }`}
                >
                  {trim > 0.05
                    ? "BY STERN"
                    : trim < -0.05
                    ? "BY HEAD"
                    : "EVEN KEEL"}
                </span>
              </div>
            </div>

            <div className="draft-metric-block">
              <span className="text-muted text-xs font-semibold">
                Dynamic Heel / List
              </span>
              <div className="flex-between">
                <strong
                  className={`font-mono text-base font-bold ${
                    Math.abs(heel) > 0.05 ? "text-cyan" : "text-white"
                  }`}
                >
                  {Math.abs(heel).toFixed(1)}°
                </strong>
                <span
                  className={`badge text-2xs ${
                    Math.abs(heel) > 0.05 ? "badge-normal" : "badge-offline"
                  }`}
                >
                  {heel > 0.05
                    ? "STARBOARD"
                    : heel < -0.05
                    ? "PORT"
                    : "UPRIGHT"}
                </span>
              </div>
            </div>

            <div className="draft-metric-block">
              <span className="text-muted text-xs font-semibold">
                Total Displacement
              </span>
              <div className="flex-between">
                <strong className="text-white font-mono text-base font-bold">
                  {disp.toLocaleString()} T
                </strong>
                <span className="text-2xs text-muted font-mono">TONS DWT</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
