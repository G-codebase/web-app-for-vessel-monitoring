import http from 'http';
import express from 'express';
import cors from 'cors';
import { store } from './database/inMemoryStore.js';
import { alarmEngine } from './modules/alarms/alarmEngine.js';
import { analyticsService } from './modules/analytics/analyticsService.js';
import { auditService } from './modules/audit/auditService.js';
import { reportsService } from './modules/reports/reportsService.js';
import { wsGateway } from './websocket/gateway.js';
import { telemetrySimulator } from './simulator/telemetrySimulator.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'tanker-vessel-monitor-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 2. Fleet Overview
app.get('/api/fleet/summary', (req, res) => {
  const online = store.vessels.filter((v) => v.status === 'ONLINE').length;
  const warning = store.vessels.filter((v) => v.status === 'WARNING').length;
  const critical = store.vessels.filter((v) => v.status === 'CRITICAL').length;
  const offline = store.vessels.filter((v) => v.status === 'OFFLINE').length;

  res.json({
    timestamp: new Date().toISOString(),
    counts: {
      total: store.vessels.length,
      online,
      warning,
      critical,
      offline,
    },
    vessels: store.vessels,
  });
});

// 3. Vessel Digital Twin & Tanks
app.get('/api/vessels/:id', (req, res) => {
  const vessel = store.vessels.find((v) => v.vesselId === req.params.id) || store.vessels[0];
  res.json(vessel);
});

app.get('/api/vessels/:id/tanks', (req, res) => {
  res.json(Object.values(store.tanks));
});

// 4. Tank Telemetry & High-Frequency Analytics
app.get('/api/vessels/:id/tanks/:tankId/analytics', (req, res) => {
  const range = (req.query.range as string) || '24H';
  const analytics = analyticsService.getTankAnalytics(req.params.tankId, range);
  if (!analytics) {
    res.status(404).json({ error: 'Tank not found' });
    return;
  }
  res.json(analytics);
});

// 5. Draft & Hull Dynamics
app.get('/api/vessels/:id/draft', (req, res) => {
  res.json(store.draft);
});

// 6. Manifold Piping & Pressure
app.get('/api/vessels/:id/manifolds', (req, res) => {
  res.json(store.manifolds);
});

// 7. Alarms & Rate-of-Change Engine
app.get('/api/alarms', (req, res) => {
  const alarms = alarmEngine.getAlarms(req.query.vesselId as string);
  const stats = alarmEngine.getSummaryStats();
  res.json({ alarms, stats });
});

app.post('/api/alarms/:id/acknowledge', (req, res) => {
  const { user, notes } = req.body;
  const updated = alarmEngine.acknowledgeAlarm(
    req.params.id,
    user || { userId: 'USR-OP01', name: 'John Deck', role: 'VESSEL_OPERATOR' },
    notes
  );
  if (!updated) {
    res.status(404).json({ error: 'Alarm not found' });
    return;
  }
  wsGateway.broadcast({
    type: 'ALARM_UPDATED',
    alarm: updated,
    alarmStats: alarmEngine.getSummaryStats(),
  });
  res.json(updated);
});

app.post('/api/alarms/:id/resolve', (req, res) => {
  const { user, notes } = req.body;
  const updated = alarmEngine.resolveAlarm(
    req.params.id,
    user || { userId: 'USR-OP01', name: 'John Deck', role: 'VESSEL_OPERATOR' },
    notes
  );
  if (!updated) {
    res.status(404).json({ error: 'Alarm not found' });
    return;
  }
  wsGateway.broadcast({
    type: 'ALARM_UPDATED',
    alarm: updated,
    alarmStats: alarmEngine.getSummaryStats(),
  });
  res.json(updated);
});

// 8. Immutable Audit Trail
app.get('/api/audit', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const action = req.query.action as string;
  res.json(auditService.getEvents(limit, action));
});

// 9. Compliance Reports
app.get('/api/reports/daily', (req, res) => {
  const report = reportsService.generateDailyVesselReport(req.query.vesselId as string);
  res.json(report);
});

app.get('/api/reports/daily/csv', (req, res) => {
  const csv = reportsService.exportDailyReportCsv(req.query.vesselId as string);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="vessel-daily-report.csv"');
  res.send(csv);
});

// 10. Simulation Triggers
app.post('/api/simulation/roc-spike', (req, res) => {
  const { tankId = 'C05' } = req.body;
  const result = telemetrySimulator.triggerRocSpike(tankId);
  auditService.record({
    userId: 'USR-SIM',
    userName: 'SCADA Sim Controller',
    userRole: 'CHIEF_ENGINEER',
    action: 'THRESHOLD_UPDATE',
    vesselId: 'VESSEL-001',
    vesselName: 'MT Ocean Star',
    targetEntity: `SIM: Pressure Surge on ${tankId}`,
    oldValue: 'Normal',
    newValue: 'Rapid Surge (+4.0 mbar)',
    ipAddress: '127.0.0.1',
    details: 'Triggered synthetic ROC pressure spike to test operator alarm response.',
  });
  res.json(result);
});

app.post('/api/simulation/reset', (req, res) => {
  const result = telemetrySimulator.resetSimulation();
  res.json(result);
});

// HTTP & WebSocket Server startup
const server = http.createServer(app);
wsGateway.init(server);

server.listen(PORT, () => {
  console.log(`[Marine Tanker Backend] HTTP & WebSocket Server running on port ${PORT}`);
  telemetrySimulator.start();
  console.log(`[Marine Tanker Simulator] Telemetry emitter active (1s scan cycle)`);
});
