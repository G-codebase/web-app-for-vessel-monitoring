import React, { useState, useEffect } from 'react';
import {
  Database,
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
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';
import * as api from '../../services/api';

export const CloudSessionsView: React.FC = () => {
  const { currentVesselId, vessels, testCloudHandshake, selectedDate, setSelectedDate, vpsStorageDates, vpsActiveFile, vpsOperationalContext, isLoadingDateTelemetry, isDataInitiated, initiateDataRender, resetToNotInitiated } = useTelemetry();
  const currentVessel = vessels.find((v) => v.vesselId === currentVesselId) || { name: 'MT Ocean Star' };

  const [cloudConn, setCloudConn] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingHandshake, setTestingHandshake] = useState(false);
  const [handshakeResult, setHandshakeResult] = useState<any>(null);

  // Ingestion tester state
  const [ingestPayloadText, setIngestPayloadText] = useState(
    JSON.stringify(
      [
        {
          device_id: 'line1-pc',
          tag: 'Temperature',
          state: 'HIGH',
          value: 82.5,
          limit: 80.0,
          message: 'Temperature above high limit: 82.5 °C (limit 80 °C)',
          timestamp: new Date().toISOString(),
        },
      ],
      null,
      2
    )
  );
  const [ingesting, setIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);

  // Session inspector modal state
  const [inspectingSession, setInspectingSession] = useState<any | null>(null);
  const [inspectTelemetry, setInspectTelemetry] = useState<any[]>([]);
  const [inspectLoading, setInspectLoading] = useState(false);

  const loadCloudData = async () => {
    try {
      setLoading(true);
      const [conn, sessionsRes] = await Promise.all([
        api.fetchCloudConnection(currentVesselId),
        api.fetchMonitoringSessionsApi(currentVesselId),
      ]);
      setCloudConn(conn);
      setSessions(sessionsRes.sessions || []);
    } catch (err) {
      console.error('Failed to load cloud sessions data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCloudData();
  }, [currentVesselId]);

  const handleTestHandshake = async () => {
    try {
      setTestingHandshake(true);
      const res = await testCloudHandshake();
      setHandshakeResult(res);
      await loadCloudData();
    } catch (err: any) {
      setHandshakeResult({ status: 'ERROR', message: err.message || 'Handshake failed' });
    } finally {
      setTestingHandshake(false);
    }
  };

  const handleSendIngestTest = async () => {
    try {
      setIngesting(true);
      setIngestStatus(null);
      const parsed = JSON.parse(ingestPayloadText);
      const res = await api.ingestExternalTelemetryApi(currentVesselId, parsed);
      setIngestStatus(`Success! Ingested ${res.ingestedCount} readings into database & live SCADA stream.`);
      await loadCloudData();
    } catch (err: any) {
      setIngestStatus(`Error: ${err.message || 'Failed to ingest payload'}`);
    } finally {
      setIngesting(false);
    }
  };

  const handleInspectSession = async (session: any) => {
    setInspectingSession(session);
    setInspectLoading(true);
    try {
      const data = await api.fetchMonitoringSessionDetailsApi(session.id);
      setInspectTelemetry(data.readings || []);
    } catch (err) {
      console.error('Failed to inspect session telemetry:', err);
    } finally {
      setInspectLoading(false);
    }
  };

  return (
    <div className="telemetry-view-container">
      {/* View Header */}
      <div className="view-header-row">
        <div>
          <h2 className="view-title">
            <Cloud className="text-cyan inline-icon" size={24} />
            External Cloud Connections & Historical Sessions
          </h2>
          <p className="view-subtitle">
            Manage external vessel cloud providers and review past connected monitoring watches for{' '}
            <strong className="text-white">{currentVessel.name}</strong>
          </p>
        </div>

        <div className="view-actions-bar">
          <button onClick={loadCloudData} className="btn btn-secondary btn-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Grid: Active Cloud Status + Ingestion Tester */}
      <div className="grid grid-2 mb-4">
        {/* 1. Active Cloud Connection Card */}
        <div className="panel">
          <div className="panel-header flex-between">
            <div className="flex-center gap-2">
              <CloudLightning size={18} className="text-cyan" />
              <span className="font-semibold text-white">Active Vessel Cloud Gateway</span>
            </div>
            <span
              className={`badge ${
                cloudConn?.status === 'CONNECTED'
                  ? 'badge-live'
                  : cloudConn?.status === 'ERROR'
                  ? 'badge-critical'
                  : 'badge-warning'
              }`}
            >
              <Radio size={11} className="mr-1 inline" />
              {cloudConn?.status || 'CONNECTED'}
            </span>
          </div>

          <div className="panel-body">
            <div className="cloud-meta-list">
              <div className="flex-between py-2 border-b">
                <span className="text-muted text-xs">Provider:</span>
                <strong className="text-white text-xs">{cloudConn?.providerName || 'VesselCloud SCADA Gateway'}</strong>
              </div>
              <div className="flex-between py-2 border-b">
                <span className="text-muted text-xs">Gateway Endpoint URL:</span>
                <code className="code-badge text-xs">{cloudConn?.endpointUrl || 'https://api.vesselcloud.net/v1/gateways/' + currentVesselId}</code>
              </div>
              <div className="flex-between py-2 border-b">
                <span className="text-muted text-xs">API Authentication:</span>
                <span className="font-mono text-xs">{cloudConn?.apiKeyMasked || 'vc_live_****_7f9b'}</span>
              </div>
              <div className="flex-between py-2 border-b">
                <span className="text-muted text-xs">Last Successful Sync:</span>
                <span className="text-xs text-white">
                  {cloudConn?.lastSyncAt ? new Date(cloudConn.lastSyncAt).toLocaleString() : 'Just now'}
                </span>
              </div>
              <div className="flex-between py-2 border-b">
                <span className="text-muted text-xs">Polling Cadence:</span>
                <span className="text-xs text-cyan font-mono">Every {cloudConn?.pollIntervalSec || 5} seconds</span>
              </div>
            </div>

            {handshakeResult && (
              <div className={`alert-notice-box mt-3 ${handshakeResult.status === 'ERROR' ? 'border-danger' : 'border-cyan'}`}>
                {handshakeResult.status === 'ERROR' ? (
                  <AlertTriangle size={15} className="text-danger mr-1" />
                ) : (
                  <CheckCircle2 size={15} className="text-cyan mr-1" />
                )}
                <span className="text-xs">
                  Handshake test {handshakeResult.status}: Latency {handshakeResult.latencyMs || 48} ms.
                </span>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleTestHandshake}
                disabled={testingHandshake}
                className="btn btn-primary btn-sm flex-1"
              >
                <Radio size={14} />
                <span>{testingHandshake ? 'Testing Handshake...' : 'Test Cloud Handshake'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Ingest Test Payload Sandbox */}
        <div className="panel">
          <div className="panel-header flex-between">
            <div className="flex-center gap-2">
              <Send size={18} className="text-cyan" />
              <span className="font-semibold text-white">Telemetry JSON Ingestion Sandbox</span>
            </div>
            <span className="text-xs text-muted">Test JSON Data Contract</span>
          </div>

          <div className="panel-body">
            <p className="text-xs text-muted mb-2">
              Send raw vessel cloud JSON payloads to verify normalization, DB persistence, limit comparison & live alarms.
            </p>

            <textarea
              className="code-textarea"
              rows={8}
              value={ingestPayloadText}
              onChange={(e) => setIngestPayloadText(e.target.value)}
              spellCheck={false}
            />

            {ingestStatus && (
              <div className="alert-notice-box mt-2 text-xs">
                <span>{ingestStatus}</span>
              </div>
            )}

            <div className="flex-between mt-3">
              <button
                onClick={() =>
                  setIngestPayloadText(
                    JSON.stringify(
                      [
                        {
                          device_id: 'line1-pc',
                          tag: 'Temperature',
                          state: 'HIGH',
                          value: 82.5,
                          limit: 80.0,
                          message: 'Temperature above high limit: 82.5 °C (limit 80 °C)',
                          timestamp: new Date().toISOString(),
                        },
                      ],
                      null,
                      2
                    )
                  )
                }
                className="btn btn-secondary btn-sm"
              >
                Reset to User Sample
              </button>

              <button
                onClick={handleSendIngestTest}
                disabled={ingesting}
                className="btn btn-primary btn-sm"
              >
                <Play size={14} />
                <span>{ingesting ? 'Ingesting...' : 'Ingest to Database'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      
      {/* VPS Storage Date-Allocated Telemetry Repository */}
      <div className="panel mb-4">
        <div className="panel-header flex-between">
          <div className="flex-center gap-2">
            <Database size={18} className="text-cyan" />
            <span className="font-semibold text-white">VPS Storage Allocated Telemetry Repository</span>
            <span className="badge badge-normal text-2xs">VPS-CLOUD-NODE-01</span>
          </div>
          {isDataInitiated ? (
            <div className="flex-center gap-2">
              <span className="text-xs text-muted">
                Currently Rendering: <strong className="text-cyan font-mono">{vpsActiveFile}</strong> ({selectedDate})
              </span>
              <button
                id="btn-vps-disengage"
                onClick={resetToNotInitiated}
                className="btn btn-secondary btn-2xs text-muted hover:text-white"
                title="Disengage active render and return to Not Initiated standby"
              >
                ⏹️ Disengage Render
              </button>
            </div>
          ) : (
            <span className="badge badge-warning text-2xs">
              STANDBY • TELEMETRY NOT INITIATED
            </span>
          )}
        </div>

        <div className="panel-body">
          <p className="text-xs text-muted mb-3">
            Telemetry is dynamically ingested and rendered from allocated JSON files on the VPS storage cluster. Select any date below to inspect and render that specific day's vessel telemetry snapshot on the SCADA bridge.
          </p>

          <div className="table-responsive">
            <table className="scada-table">
              <thead>
                <tr>
                  <th>Telemetry Date</th>
                  <th>Allocated File Name</th>
                  <th>File Size</th>
                  <th>Records</th>
                  <th>Operational Scenario</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {vpsStorageDates.map((item) => {
                  const isCurrent = isDataInitiated && item.date === selectedDate;
                  return (
                    <tr key={item.date} className={isCurrent ? "active-row" : ""}>
                      <td>
                        <strong className="text-white font-mono">{item.date}</strong>
                      </td>
                      <td>
                        <span className="code-badge text-xs font-mono">{item.fileName}</span>
                      </td>
                      <td className="text-xs font-mono text-muted">
                        {(item.sizeBytes / 1024).toFixed(1)} KB
                      </td>
                      <td className="text-xs font-mono text-cyan">
                        {item.recordCount} sensors
                      </td>
                      <td className="text-xs">
                        <span className="text-white block">{item.operationalContext}</span>
                      </td>
                      <td>
                        <span className={`badge ${isCurrent ? "badge-live" : "badge-normal"}`}>
                          {isCurrent ? "RENDERING" : isDataInitiated ? item.status : "STANDBY"}
                        </span>
                      </td>
                      <td>
                        {isCurrent ? (
                          <div className="flex-center gap-2">
                            <span className="text-2xs text-cyan font-semibold flex-center gap-1">
                              <CheckCircle2 size={13} />
                              <span>Active</span>
                            </span>
                            <button
                              onClick={resetToNotInitiated}
                              className="btn btn-secondary btn-2xs text-muted hover:text-white"
                              title="Disengage active render"
                            >
                              ⏹️ Disengage
                            </button>
                          </div>
                        ) : (
                          <button
                            id={'btn-render-vps-' + item.date}
                            onClick={() => setSelectedDate(item.date)}
                            disabled={isLoadingDateTelemetry}
                            className="btn btn-primary btn-xs flex-center gap-1"
                            title={`Render ${item.fileName} on live workstation`}
                          >
                            <Play size={11} />
                            <span>Render on SCADA</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Historical Monitoring Sessions List: Direct Requirement */}
      <div className="panel">
        <div className="panel-header flex-between">
          <div className="flex-center gap-2">
            <History size={18} className="text-cyan" />
            <span className="font-semibold text-white">Before Connected Vessel Clouds & Monitoring Watches</span>
          </div>
          <span className="text-xs text-muted">Historical sessions record duration, readings count, and endpoint</span>
        </div>

        <div className="panel-body">
          {sessions.length === 0 ? (
            <div className="empty-state-box">
              <History size={32} className="text-muted mb-2" />
              <p>No previous monitoring watches recorded for this vessel yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="scada-table">
                <thead>
                  <tr>
                    <th>Session Watch Label</th>
                    <th>Monitoring Period</th>
                    <th>Duration</th>
                    <th>Readings Ingested</th>
                    <th>Alarms</th>
                    <th>Cloud Endpoint</th>
                    <th>Operator</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong className="text-white block">{s.label}</strong>
                        <span className="text-xs text-muted font-mono">{s.id.slice(0, 12)}...</span>
                      </td>
                      <td className="text-xs">
                        <div>
                          <span className="text-muted">Start: </span>
                          <span>{new Date(s.startedAt).toLocaleString()}</span>
                        </div>
                        {s.endedAt && (
                          <div>
                            <span className="text-muted">End: </span>
                            <span>{new Date(s.endedAt).toLocaleString()}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-normal font-mono">{s.durationMinutes} min</span>
                      </td>
                      <td className="font-mono text-cyan font-semibold">
                        {s.readingsIngested.toLocaleString()} pts
                      </td>
                      <td>
                        {s.alarmsTriggered > 0 ? (
                          <span className="badge badge-warning">{s.alarmsTriggered} triggered</span>
                        ) : (
                          <span className="badge badge-normal">0 alerts</span>
                        )}
                      </td>
                      <td>
                        <span className="code-badge text-xs">{s.cloudEndpoint.replace('https://', '')}</span>
                      </td>
                      <td className="text-xs text-muted">{s.operatorName}</td>
                      <td>
                        <button
                          onClick={() => handleInspectSession(s)}
                          className="btn btn-secondary btn-xs"
                          title="Inspect telemetry points rendered during this session"
                        >
                          <Eye size={12} className="mr-1 inline" />
                          <span>Inspect Data</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Inspect Rendered Telemetry Points from Session */}
      {inspectingSession && (
        <div className="modal-backdrop">
          <div className="modal-content modal-lg">
            <div className="modal-header flex-between">
              <div>
                <h3 className="modal-title flex-center gap-2">
                  <Layers size={18} className="text-cyan" />
                  <span>Session Telemetry Inspector: {inspectingSession.label}</span>
                </h3>
                <span className="text-xs text-muted">
                  Vessel: {inspectingSession.vesselName} • Operator: {inspectingSession.operatorName}
                </span>
              </div>
              <button
                onClick={() => setInspectingSession(null)}
                className="btn-icon"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {inspectLoading ? (
                <div className="p-8 text-center text-muted">
                  <RefreshCw size={24} className="spin mb-2 mx-auto" />
                  <p>Loading session telemetry records from database...</p>
                </div>
              ) : inspectTelemetry.length === 0 ? (
                <div className="p-8 text-center text-muted">
                  <p>No historical telemetry rows logged during this specific time slice.</p>
                </div>
              ) : (
                <div className="table-responsive max-h-96">
                  <table className="scada-table scada-table-compact">
                    <thead>
                      <tr>
                        <th>Device</th>
                        <th>Tag</th>
                        <th>Value</th>
                        <th>Unit</th>
                        <th>State</th>
                        <th>Limit</th>
                        <th>Delta</th>
                        <th>Event Time (UTC)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspectTelemetry.map((r, i) => (
                        <tr key={i}>
                          <td className="font-mono text-xs">{r.deviceId}</td>
                          <td className="font-semibold text-white">{r.tag}</td>
                          <td className="font-mono text-cyan font-bold">{r.value.toFixed(2)}</td>
                          <td>{r.unit || '—'}</td>
                          <td>
                            <span
                              className={`badge ${
                                r.sourceState === 'HIGH' ? 'badge-critical' : 'badge-normal'
                              }`}
                            >
                              {r.sourceState || 'NORMAL'}
                            </span>
                          </td>
                          <td className="font-mono text-muted">
                            {r.sourceLimit !== null ? r.sourceLimit.toFixed(2) : '—'}
                          </td>
                          <td className="font-mono text-warning">
                            {r.differenceFromLimit !== null ? `+${r.differenceFromLimit.toFixed(2)}` : '—'}
                          </td>
                          <td className="font-mono text-xs text-muted">
                            {new Date(r.eventTimestamp).toISOString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer flex-between">
              <span className="text-xs text-muted">
                Displaying {inspectTelemetry.length} telemetry records recorded in this watch session.
              </span>
              <button
                onClick={() => setInspectingSession(null)}
                className="btn btn-secondary btn-sm"
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
