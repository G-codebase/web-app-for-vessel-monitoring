import http from 'http';
import path from 'path';
import fs from 'fs';
import os from 'os';
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

function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

app.use(cors());
app.use(express.json());

// 1. Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'tanker-vessel-monitor-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 2. Fleet Overview
app.get('/api/fleet/summary', (_req, res) => {
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
  const vessel = store.getVessel(req.params.id);
  res.json(vessel);
});

app.get('/api/vessels/:id/tanks', (req, res) => {
  const tanks = store.getTanks(req.params.id);
  res.json(Object.values(tanks));
});

// 4. Tank Telemetry & High-Frequency Analytics
app.get('/api/vessels/:id/tanks/:tankId/analytics', (req, res) => {
  const range = (req.query.range as string) || '24H';
  const analytics = analyticsService.getTankAnalytics(req.params.tankId, range, req.params.id);
  if (!analytics) {
    res.status(404).json({ error: 'Tank not found' });
    return;
  }
  res.json(analytics);
});

// 5. Draft & Hull Dynamics
app.get('/api/vessels/:id/draft', (req, res) => {
  const draft = store.getDraft(req.params.id);
  res.json(draft);
});

// 6. Manifold Piping & Pressure
app.get('/api/vessels/:id/manifolds', (req, res) => {
  const manifolds = store.getManifolds(req.params.id);
  res.json(manifolds);
});

// 7. Alarms & Rate-of-Change Engine
app.get('/api/alarms', (req, res) => {
  const vesselId = req.query.vesselId as string | undefined;
  const alarms = alarmEngine.getAlarms(vesselId);
  const stats = alarmEngine.getSummaryStats(vesselId);
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
  const action = req.query.action as string | undefined;
  res.json(auditService.getEvents(limit, action));
});

app.post('/api/audit', (req, res) => {
  const { userId, userName, userRole, action, vesselId, vesselName, targetEntity, oldValue, newValue, details } = req.body;
  const recorded = auditService.record({
    userId: userId || 'USR-OP01',
    userName: userName || 'Operator',
    userRole: userRole || 'VESSEL_OPERATOR',
    action: action || 'USER_ROLE_SWITCH',
    vesselId: vesselId || 'VESSEL-001',
    vesselName: vesselName || 'MT Ocean Star',
    targetEntity: targetEntity || 'System Console',
    oldValue,
    newValue,
    ipAddress: req.ip || '127.0.0.1',
    details: details || 'Operator action recorded.',
  });
  res.json(recorded);
});

// 9. Compliance Reports
app.get('/api/reports/daily', (req, res) => {
  const vesselId = (req.query.vesselId as string) || 'VESSEL-001';
  const report = reportsService.generateDailyVesselReport(vesselId);
  res.json(report);
});

app.get('/api/reports/daily/csv', (req, res) => {
  const vesselId = (req.query.vesselId as string) || 'VESSEL-001';
  const csv = reportsService.exportDailyReportCsv(vesselId);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${vesselId.toLowerCase()}-daily-report.csv"`);
  res.send(csv);
});

// 10. Simulation Triggers
app.post('/api/simulation/roc-spike', (req, res) => {
  const { tankId = 'C05', vesselId = 'VESSEL-001' } = req.body;
  const result = telemetrySimulator.triggerRocSpike(tankId, vesselId);
  const vessel = store.getVessel(vesselId);
  auditService.record({
    userId: 'USR-SIM',
    userName: 'SCADA Sim Controller',
    userRole: 'CHIEF_ENGINEER',
    action: 'THRESHOLD_UPDATE',
    vesselId,
    vesselName: vessel.name,
    targetEntity: `SIM: Pressure Surge on ${tankId}`,
    oldValue: 'Normal',
    newValue: 'Rapid Surge (+4.5 mbar)',
    ipAddress: '127.0.0.1',
    details: `Triggered synthetic ROC pressure surge on ${vessel.name} (${tankId}) to test operator alarm response.`,
  });
  res.json(result);
});

app.post('/api/simulation/reset', (_req, res) => {
  const result = telemetrySimulator.resetSimulation();
  res.json(result);
});

// 11. Static Frontend Serving (enables direct single-port access over LAN)
const clientDistPath = fs.existsSync(path.resolve(process.cwd(), 'client/dist'))
  ? path.resolve(process.cwd(), 'client/dist')
  : path.resolve(process.cwd(), '../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// HTTP & WebSocket Server startup
const server = http.createServer(app);
wsGateway.init(server);

server.listen(Number(PORT), '0.0.0.0', () => {
  const localIp = getLocalIp();
  console.log(`\n===============================================================`);
  console.log(`  🚢 Marine Tanker SCADA Platform — Telemetry Backend Active`);
  console.log(`  ➜  Local:     http://localhost:${PORT}`);
  console.log(`  ➜  Network:   http://${localIp}:${PORT}`);
  console.log(`  ➜  WebSocket: ws://${localIp}:${PORT}/ws/telemetry`);
  console.log(`===============================================================\n`);
  telemetrySimulator.start();
  console.log(`[Marine Tanker Simulator] Multi-vessel telemetry emitter active (1s scan cycle)`);
});
