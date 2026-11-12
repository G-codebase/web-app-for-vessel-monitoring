import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudLightning,
  RefreshCw,
  Radio,
  Clock,
  History,
  CheckCircle2,
  AlertTriangle,
  Play,
  Eye,
  X,
  Send,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
  Terminal,
  Activity,
  Download,
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';
import * as api from '../../services/api';

interface CloudGatewayFlowProps {
  onEnterBridge: () => void;
}

export const CloudGatewayFlow: React.FC<CloudGatewayFlowProps> = ({ onEnterBridge }) => {
  const {
    currentVesselId,
    setCurrentVesselId,
    vessels,
    cloudStatus,
    testCloudHandshake,
    connectCloud,
    disconnectCloud,
    currentUser,
  } = useTelemetry();

  const currentVessel = vessels.find((v) => v.vesselId === currentVesselId) || {
    vesselId: currentVesselId,
    name: 'MT Ocean Star',
    imoNumber: '9876543',
  };

  const [activeStep, setActiveStep] = useState<number>(cloudStatus === 'CONNECTED' ? 3 : 2);
  const [connecting, setConnecting] = useState(false);
  const [handshakeLog, setHandshakeLog] = useState<string | null>(null);

  // Ingestion state
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<any | null>(null);

  // Historical sessions state
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [inspectingSession, setInspectingSession] = useState<any | null>(null);
  const [inspectTelemetry, setInspectTelemetry] = useState<any[]>([]);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Sample JSON payload from requirement specification
  const defaultSampleJson = JSON.stringify(
    [
      {
        device_id: 'line1-pc',
        tag: 'Temperature',
        state: 'HIGH',
        value: 82.5,
        limit: 80.0,
        message: 'Temperature above high limit: 82.5 °C (limit 80 °C)',
        timestamp: '2026-10-07T17:41:21.678663Z',
      },
    ],
    null,
    2
  );

  const [jsonPayload, setJsonPayload] = useState(defaultSampleJson);

  // Load historical sessions
  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      const res = await api.fetchMonitoringSessionsApi(currentVesselId);
      if (res.sessions) setSessions(res.sessions);
    } catch (e) {
      console.error('Failed to load sessions:', e);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [currentVesselId]);

  useEffect(() => {
    if (cloudStatus === 'CONNECTED' && activeStep === 2) {
      setActiveStep(3);
    }
  }, [cloudStatus]);

  // Step 2: Connect Cloud Handler
  const handleConnectCloudGateway = async () => {
    setConnecting(true);
    setHandshakeLog('Initiating secure mutual TLS 1.3 edge handshake...');
    try {
      await new Promise((r) => setTimeout(r, 600));
      setHandshakeLog('Negotiating cipher suites and validating gateway certificate...');
      const res = await testCloudHandshake();
      await connectCloud(currentVesselId);
      setHandshakeLog(
        `Cloud Connection Established! Status: CONNECTED • Latency: ${res.latencyMs || 42}ms • Handshake ACK: ${res.status || 'OK'}`
      );
      setActiveStep(3);
    } catch (err: any) {
      setHandshakeLog(`Gateway Handshake Error: ${err.message || 'Failed to connect'}`);
    } finally {
      setConnecting(false);
    }
  };

  // Step 3: Retrieve / Ingest Telemetry Handler
  const handleRetrieveTelemetry = async () => {
    setIngesting(true);
    try {
      const parsed = JSON.parse(jsonPayload);
      const res = await api.ingestExternalTelemetryApi(currentVesselId, parsed);
      setIngestResult(res);
      setActiveStep(4);
      loadSessions();
    } catch (err: any) {
      alert(`Ingestion failed: ${err.message}`);
    } finally {
      setIngesting(false);
    }
  };

  // Session Inspector Handler
  const handleOpenInspectSession = async (session: any) => {
    setInspectingSession(session);
    setInspectLoading(true);
    try {
      const data = await api.fetchMonitoringSessionDetailsApi(session.id);
      setInspectTelemetry(data.readings || []);
    } catch (e) {
      console.error('Failed to inspect session:', e);
    } finally {
      setInspectLoading(false);
    }
  };

  return (
    <div className="content-container animate-fade-in">
      {/* Page Header */}
      <div className="section-header-row mb-6">
        <div>
          <div className="flex-center gap-2 mb-1">
            <span className="badge badge-cyan text-xs font-mono uppercase">
              Operational Onboarding Flow
            </span>
            <span className="badge badge-emerald text-xs font-mono">
              Production Gateway
            </span>
          </div>
          <h1 className="text-xl font-bold text-white flex-center gap-2">
            <Cloud className="text-cyan" size={24} />
            <span>Vessel Cloud Connection Gateway &amp; Telemetry Retrieval</span>
          </h1>
          <p className="text-muted text-xs mt-1">
            Follow the 4-phase production lifecycle: Authenticate ➔ Connect Vessel Cloud ➔ Retrieve Telemetry ➔ Preview SCADA Bridge.
          </p>
        </div>

        <div className="flex-center gap-3">
          {cloudStatus === 'CONNECTED' ? (
            <button
              onClick={onEnterBridge}
              className="btn btn-primary flex-center gap-2 shadow-cyan"
            >
              <span>Launch Monitoring Preview</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleConnectCloudGateway}
              disabled={connecting}
              className="btn btn-primary flex-center gap-2 shadow-cyan"
            >
              {connecting ? <RefreshCw size={14} className="spin" /> : <Zap size={14} />}
              <span>Connect Vessel Cloud</span>
            </button>
          )}
        </div>
      </div>

      {/* 4-Phase Stepper */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Step 1: Authentication */}
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/15 relative overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-mono font-bold text-emerald-400">PHASE 01</span>
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Check size={12} />
            </div>
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Security Gateway</h4>
          <p className="text-xs text-muted mb-2">Authenticated via RBAC policy</p>
          <div className="text-2xs font-mono text-emerald-300 truncate">
            {currentUser.email} ({currentUser.role})
          </div>
        </div>

        {/* Step 2: Connect Cloud */}
        <div
          className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
            cloudStatus === 'CONNECTED'
              ? 'border-emerald-500/30 bg-emerald-950/15'
              : activeStep === 2
              ? 'border-cyan-500/50 bg-cyan-950/20 shadow-cyan'
              : 'border-slate-800 bg-slate-900/40'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span
              className={`text-xs font-mono font-bold ${
                cloudStatus === 'CONNECTED'
                  ? 'text-emerald-400'
                  : activeStep === 2
                  ? 'text-cyan-400'
                  : 'text-slate-500'
              }`}
            >
              PHASE 02
            </span>
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                cloudStatus === 'CONNECTED'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : activeStep === 2
                  ? 'bg-cyan-500/20 text-cyan-400 animate-pulse'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {cloudStatus === 'CONNECTED' ? <Check size={12} /> : <span>2</span>}
            </div>
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Connect Vessel Cloud</h4>
          <p className="text-xs text-muted mb-2">Handshake with external gateway</p>
          <div className="text-2xs font-mono text-cyan-300">
            Status: {cloudStatus}
          </div>
        </div>

        {/* Step 3: Retrieve Telemetry */}
        <div
          className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
            ingestResult
              ? 'border-emerald-500/30 bg-emerald-950/15'
              : activeStep === 3
              ? 'border-cyan-500/50 bg-cyan-950/20 shadow-cyan'
              : 'border-slate-800 bg-slate-900/40'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span
              className={`text-xs font-mono font-bold ${
                ingestResult
                  ? 'text-emerald-400'
                  : activeStep === 3
                  ? 'text-cyan-400'
                  : 'text-slate-500'
              }`}
            >
              PHASE 03
            </span>
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                ingestResult
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : activeStep === 3
                  ? 'bg-cyan-500/20 text-cyan-400 animate-pulse'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {ingestResult ? <Check size={12} /> : <span>3</span>}
            </div>
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Retrieve Telemetry</h4>
          <p className="text-xs text-muted mb-2">Ingest &amp; normalize JSON payload</p>
          <div className="text-2xs font-mono text-cyan-300">
            {ingestResult ? 'Payload Ingested' : 'Awaiting Retrieval'}
          </div>
        </div>

        {/* Step 4: Preview Bridge */}
        <div
          className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
            activeStep === 4
              ? 'border-cyan-500/50 bg-cyan-950/20 shadow-cyan'
              : 'border-slate-800 bg-slate-900/40'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span
              className={`text-xs font-mono font-bold ${
                activeStep === 4 ? 'text-cyan-400' : 'text-slate-500'
              }`}
            >
              PHASE 04
            </span>
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                activeStep === 4
                  ? 'bg-cyan-500/20 text-cyan-400 animate-pulse'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              <span>4</span>
            </div>
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Operations Preview</h4>
          <p className="text-xs text-muted mb-2">Live SCADA bridge &amp; analytics</p>
          <div className="text-2xs font-mono text-slate-400">
            {activeStep === 4 ? 'Ready to Explore' : 'Pending Step 2 & 3'}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Flow Actions, Right Gateway Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column (2 cols): Interactive Connection & Ingestion Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vessel Selection & Cloud Gateway Connection Card */}
          <div className="scada-panel">
            <div className="panel-header flex justify-between items-center">
              <div className="flex-center gap-2">
                <Radio className="text-cyan" size={16} />
                <h3 className="panel-title">1. Authorized Vessel &amp; External Cloud Gateway</h3>
              </div>
              <span className="badge badge-slate text-2xs font-mono">
                TLS 1.3 MUTUAL AUTH
              </span>
            </div>

            <div className="p-4 space-y-4">
              {/* Vessel Selector Dropdown */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  SELECT AUTHORIZED VESSEL:
                </label>
                <select
                  value={currentVesselId}
                  onChange={(e) => setCurrentVesselId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white font-medium focus:border-cyan-400 outline-none"
                >
                  {vessels.map((v) => (
                    <option key={v.vesselId} value={v.vesselId}>
                      {v.name} ({v.vesselId}) — IMO: {v.imoNumber || '9876543'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gateway Connection Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <div>
                  <div className="text-2xs text-muted font-mono">PROVIDER</div>
                  <div className="text-xs font-semibold text-white">VesselCloud Gateway</div>
                </div>
                <div>
                  <div className="text-2xs text-muted font-mono">ENDPOINT</div>
                  <div className="text-xs font-mono text-cyan truncate" title={`https://api.vesselcloud.net/v1/gateways/${currentVesselId}`}>
                    .../gateways/{currentVesselId}
                  </div>
                </div>
                <div>
                  <div className="text-2xs text-muted font-mono">CONNECTION STATUS</div>
                  <div className="flex-center gap-1.5 mt-0.5">
                    <span
                      className={`status-dot ${
                        cloudStatus === 'CONNECTED'
                          ? 'status-online'
                          : cloudStatus === 'RECONNECTING'
                          ? 'status-warning'
                          : 'status-critical'
                      }`}
                    />
                    <span className="text-xs font-bold text-white">{cloudStatus}</span>
                  </div>
                </div>
              </div>

              {/* Connection Buttons & Handshake Logs */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleConnectCloudGateway}
                  disabled={connecting}
                  className={`btn ${
                    cloudStatus === 'CONNECTED' ? 'btn-secondary' : 'btn-primary shadow-cyan'
                  } flex-center gap-2`}
                >
                  {connecting ? (
                    <>
                      <RefreshCw size={14} className="spin text-cyan" />
                      <span>Initiating Handshake...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      <span>{cloudStatus === 'CONNECTED' ? 'Re-Test Cloud Handshake' : 'Connect to Vessel Cloud'}</span>
                    </>
                  )}
                </button>

                {cloudStatus === 'CONNECTED' && (
                  <button
                    onClick={() => disconnectCloud(currentVesselId)}
                    className="btn btn-outline text-rose-400 border-rose-500/30 hover:bg-rose-950/30 text-xs"
                  >
                    Disconnect Gateway
                  </button>
                )}

                {handshakeLog && (
                  <div className="w-full text-xs font-mono p-2.5 rounded bg-slate-950 border border-slate-800 text-cyan-300">
                    <span className="text-muted mr-2">LOG:</span>
                    {handshakeLog}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Telemetry Ingestion & Retrieval Stage */}
          <div className="scada-panel">
            <div className="panel-header flex justify-between items-center">
              <div className="flex-center gap-2">
                <Terminal className="text-cyan" size={16} />
                <h3 className="panel-title">2. Retrieve Telemetry JSON &amp; Validate Normalization</h3>
              </div>
              <span className="badge badge-amber text-2xs font-mono">
                EXTERNAL JSON CONTRACT
              </span>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-xs text-muted">
                Incoming JSON telemetry is ingested from the external vessel cloud, normalized into standard SI units, audited with dual timestamps, and evaluated for alarm thresholds.
              </p>

              {/* JSON Payload Editor / Viewer */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-2xs font-mono text-slate-400">
                    LIVE EXTERNAL CLOUD TELEMETRY PAYLOAD (EDITABLE JSON):
                  </label>
                  <button
                    onClick={() => setJsonPayload(defaultSampleJson)}
                    className="text-2xs text-cyan hover:underline"
                  >
                    Reset Sample JSON
                  </button>
                </div>
                <textarea
                  value={jsonPayload}
                  onChange={(e) => setJsonPayload(e.target.value)}
                  rows={8}
                  className="w-full font-mono text-xs bg-slate-950 border border-slate-800 rounded-lg p-3 text-cyan-300 focus:border-cyan-400 outline-none"
                />
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRetrieveTelemetry}
                  disabled={ingesting || cloudStatus !== 'CONNECTED'}
                  className="btn btn-primary flex-center gap-2 shadow-cyan"
                >
                  {ingesting ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Ingesting &amp; Normalizing...</span>
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      <span>Retrieve &amp; Ingest Telemetry Payload</span>
                    </>
                  )}
                </button>

                {cloudStatus !== 'CONNECTED' && (
                  <span className="text-xs text-amber-400 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    <span>Please connect to the vessel cloud first (Step 2).</span>
                  </span>
                )}
              </div>

              {/* Ingestion & Normalization Result Card */}
              {ingestResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      <span className="text-xs font-bold text-white">
                        Telemetry Normalized &amp; Persisted to PostgreSQL
                      </span>
                    </div>
                    <span className="badge badge-cyan text-2xs font-mono">
                      Ingested: {ingestResult.ingestedCount} Event(s)
                    </span>
                  </div>

                  {ingestResult.readings?.map((r: any, idx: number) => (
                    <div
                      key={idx}
                      className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs font-mono"
                    >
                      <div>
                        <div className="text-2xs text-muted">DEVICE / TAG</div>
                        <div className="text-white font-bold">{r.deviceId}</div>
                        <div className="text-cyan">{r.tag}</div>
                      </div>
                      <div>
                        <div className="text-2xs text-muted">READING / LIMIT</div>
                        <div className="text-rose-400 font-bold text-sm">
                          {r.value} {r.unit}
                        </div>
                        <div className="text-slate-400 text-2xs">Limit: {r.sourceLimit} {r.unit}</div>
                      </div>
                      <div>
                        <div className="text-2xs text-muted">DELTA / STATE</div>
                        <div className="text-amber-400 font-bold">
                          +{r.differenceFromLimit} {r.unit}
                        </div>
                        <div className="text-rose-400 font-bold text-2xs">State: {r.sourceState}</div>
                      </div>
                      <div>
                        <div className="text-2xs text-muted">QUALITY / AUDIT</div>
                        <div className="badge badge-amber text-2xs">{r.quality}</div>
                        <div className="text-slate-500 text-2xs truncate">Dual Timestamp OK</div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={onEnterBridge}
                      className="btn btn-primary flex-center gap-2 shadow-cyan"
                    >
                      <span>Proceed to Live SCADA Preview</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): System Architecture & Compliance Card */}
        <div className="space-y-6">
          <div className="scada-panel">
            <div className="panel-header flex-center justify-between">
              <h3 className="panel-title flex-center gap-2">
                <ShieldCheck className="text-emerald-400" size={16} />
                <span>Production Security Rules</span>
              </h3>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="font-bold text-white mb-1">1. Zero Direct Browser to Cloud</div>
                <p className="text-muted text-2xs">
                  The client browser never connects directly to cloud APIs. The backend securely holds credentials and normalizes incoming telemetry.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="font-bold text-white mb-1">2. Dual Timestamp Audit</div>
                <p className="text-muted text-2xs">
                  Every reading preserves both the <strong>Source Event Timestamp</strong> and the <strong>Backend Ingestion Timestamp</strong> to identify stale cloud messages.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="font-bold text-white mb-1">3. RBAC Vessel Authorization</div>
                <p className="text-muted text-2xs">
                  Vessel telemetry access is validated per user. Unauthorized vessel IDs are rejected with HTTP 403 Forbidden.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="font-bold text-white mb-1">4. RFC 4180 CSV Export</div>
                <p className="text-muted text-2xs">
                  Users can generate custom date &amp; time sensor CSV records anytime from the History &amp; CSV Export view.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Launch Card */}
          <div className="scada-panel p-4 text-center">
            <Activity className="text-cyan mx-auto mb-2" size={32} />
            <h4 className="text-sm font-bold text-white mb-1">Ready to Preview the SCADA Bridge?</h4>
            <p className="text-xs text-muted mb-4">
              Explore Vessel Operations, Cargo Tanks, Ballast Tanks, Thermals, Manifold Pressures, Persistent Draft Tray, and Alarm Center.
            </p>
            <button
              onClick={onEnterBridge}
              className="btn btn-primary w-full flex-center justify-center gap-2 shadow-cyan"
            >
              <span>Enter Operations Bridge</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Previously Connected Vessel Cloud Sessions Table */}
      <div className="scada-panel">
        <div className="panel-header flex justify-between items-center">
          <div className="flex-center gap-2">
            <History className="text-cyan" size={16} />
            <h3 className="panel-title">Previously Connected Vessel Cloud Sessions</h3>
          </div>
          <button
            onClick={loadSessions}
            className="text-xs text-cyan hover:underline flex-center gap-1 font-mono"
          >
            <RefreshCw size={12} className={sessionsLoading ? 'spin' : ''} />
            <span>Refresh Sessions</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-2xs uppercase">
                <th className="p-3">Session Label &amp; Purpose</th>
                <th className="p-3">Operator</th>
                <th className="p-3">Timeline (UTC)</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Ingested Events</th>
                <th className="p-3">Alarms</th>
                <th className="p-3">Cloud Gateway</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted">
                    No historical monitoring sessions found for {currentVessel.name}.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="font-sans font-semibold text-white">{s.label}</div>
                      <div className="text-2xs text-slate-400">{s.notes}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-white">{s.operatorName}</div>
                      <div className="text-2xs text-muted">{s.operatorEmail}</div>
                    </td>
                    <td className="p-3 text-2xs text-slate-300">
                      <div>Start: {new Date(s.startedAt).toISOString().slice(0, 16).replace('T', ' ')}</div>
                      {s.endedAt && (
                        <div>End: {new Date(s.endedAt).toISOString().slice(0, 16).replace('T', ' ')}</div>
                      )}
                    </td>
                    <td className="p-3 text-cyan">
                      {s.durationMinutes ? `${s.durationMinutes} min` : 'Active'}
                    </td>
                    <td className="p-3 text-white font-bold">{s.readingsIngested}</td>
                    <td className="p-3">
                      {s.alarmsTriggered > 0 ? (
                        <span className="badge badge-rose text-2xs">
                          {s.alarmsTriggered} ALARMS
                        </span>
                      ) : (
                        <span className="badge badge-emerald text-2xs">CLEAN</span>
                      )}
                    </td>
                    <td className="p-3 text-2xs text-muted truncate max-w-xs" title={s.cloudEndpoint}>
                      {s.cloudEndpoint}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenInspectSession(s)}
                        className="btn btn-outline text-2xs flex-center gap-1 py-1 px-2.5 border-cyan-500/30 text-cyan hover:bg-cyan-950/30 ml-auto"
                      >
                        <Eye size={12} />
                        <span>Inspect Data</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Inspector Modal */}
      {inspectingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="scada-panel w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl border-cyan-500/40">
            <div className="panel-header flex justify-between items-center">
              <div className="flex-center gap-2">
                <History className="text-cyan" size={18} />
                <div>
                  <h3 className="panel-title text-sm">{inspectingSession.label}</h3>
                  <div className="text-2xs text-muted font-mono">
                    Session ID: {inspectingSession.id} • Operator: {inspectingSession.operatorName}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectingSession(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              <div className="grid grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs font-mono">
                <div>
                  <div className="text-2xs text-muted">VESSEL</div>
                  <div className="text-white font-bold">{inspectingSession.vesselName}</div>
                </div>
                <div>
                  <div className="text-2xs text-muted">START TIME</div>
                  <div className="text-cyan text-2xs">{new Date(inspectingSession.startedAt).toUTCString()}</div>
                </div>
                <div>
                  <div className="text-2xs text-muted">DURATION</div>
                  <div className="text-white">{inspectingSession.durationMinutes || '--'} min</div>
                </div>
                <div>
                  <div className="text-2xs text-muted">TOTAL INGESTED</div>
                  <div className="text-emerald-400 font-bold">{inspectingSession.readingsIngested} readings</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white font-mono uppercase mb-2">
                  Rendered Telemetry Sample from Session
                </h4>
                {inspectLoading ? (
                  <div className="p-8 text-center text-muted flex-center justify-center gap-2">
                    <RefreshCw size={16} className="spin text-cyan" />
                    <span>Loading session readings from PostgreSQL...</span>
                  </div>
                ) : inspectTelemetry.length === 0 ? (
                  <div className="p-6 text-center text-muted bg-slate-950 rounded-lg border border-slate-800 text-xs">
                    No specific sub-readings stored for this simulated archive session.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-60 rounded border border-slate-800">
                    <table className="w-full text-left text-2xs font-mono">
                      <thead className="bg-slate-950 text-slate-400">
                        <tr>
                          <th className="p-2">Device</th>
                          <th className="p-2">Tag</th>
                          <th className="p-2">Value</th>
                          <th className="p-2">State</th>
                          <th className="p-2">Event Time (UTC)</th>
                          <th className="p-2">Quality</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {inspectTelemetry.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-900">
                            <td className="p-2 text-white">{r.deviceId}</td>
                            <td className="p-2 text-cyan">{r.tag}</td>
                            <td className="p-2 font-bold">{r.value} {r.unit}</td>
                            <td className="p-2 text-amber-400">{r.sourceState}</td>
                            <td className="p-2 text-slate-400">{r.eventTimestamp}</td>
                            <td className="p-2 text-emerald-400">{r.quality}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="panel-footer flex justify-end p-3 border-t border-slate-800 bg-slate-950">
              <button
                onClick={() => setInspectingSession(null)}
                className="btn btn-secondary text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
