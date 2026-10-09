import { store } from '../database/inMemoryStore.js';
import { alarmEngine } from '../modules/alarms/alarmEngine.js';
import { wsGateway } from '../websocket/gateway.js';

export class TelemetrySimulator {
  private timer: NodeJS.Timeout | null = null;
  private rocSpikeActive: { vesselId: string; tankId: string; step: number } | null = null;

  public start() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.tick();
    }, 1000);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public triggerRocSpike(tankId: string = 'C05', vesselId: string = 'VESSEL-001') {
    this.rocSpikeActive = { vesselId, tankId, step: 0 };
    return { success: true, message: `ROC surge simulation initiated on ${vesselId} -> ${tankId}` };
  }

  public resetSimulation() {
    this.rocSpikeActive = null;
    for (const vesselId of Object.keys(store.tanksByVessel)) {
      const tanks = store.tanksByVessel[vesselId];
      if (tanks['C05']) {
        tanks['C05'].pressureMbar = 13.12;
        tanks['C05'].temperatureC = 21.35;
        tanks['C05'].flowRateM3H = 32.5;
        tanks['C05'].status = 'NORMAL';
      }
    }
    return { success: true, message: 'Simulation parameters restored to standard baseline.' };
  }

  private tick() {
    const nowIso = new Date().toISOString();

    // 1. Update online vessels latency jitter and timestamps
    for (const vessel of store.vessels) {
      if (vessel.status !== 'OFFLINE') {
        const baseLatency = vessel.vesselId === 'VESSEL-001' ? 0.35 : vessel.vesselId === 'VESSEL-002' ? 0.55 : 1.6;
        vessel.latencySec = parseFloat((baseLatency + Math.random() * 0.15).toFixed(2));
        vessel.lastDataTimestamp = nowIso;
      }
    }

    // 2. Process tanks telemetry jitter & ROC for each vessel
    const vesselDataMap: Record<string, any> = {};

    for (const vesselId of Object.keys(store.tanksByVessel)) {
      const vessel = store.getVessel(vesselId);
      if (vessel.status === 'OFFLINE') {
        vesselDataMap[vesselId] = {
          tanks: store.tanksByVessel[vesselId],
          draft: store.draftByVessel[vesselId],
          manifolds: store.manifoldsByVessel[vesselId],
          latencySec: vessel.latencySec,
        };
        continue;
      }

      const tanks = store.tanksByVessel[vesselId];

      for (const tankId of Object.keys(tanks)) {
        const tank = tanks[tankId];

        // Subtle sensor noise
        const tempJitter = (Math.random() - 0.49) * 0.02;
        let pressJitter = (Math.random() - 0.49) * 0.03;

        // If synthetic ROC surge is active on this vessel and tank
        if (
          this.rocSpikeActive &&
          this.rocSpikeActive.vesselId === vesselId &&
          this.rocSpikeActive.tankId === tankId
        ) {
          this.rocSpikeActive.step++;
          // Surge pressure rapidly: +0.45 mbar per second for 10 seconds = +4.5 mbar surge
          if (this.rocSpikeActive.step <= 10) {
            pressJitter += 0.45;
          } else {
            this.rocSpikeActive = null; // surge cycle complete
          }
        }

        tank.temperatureC = parseFloat((tank.temperatureC + tempJitter).toFixed(2));
        tank.pressureMbar = parseFloat((tank.pressureMbar + pressJitter).toFixed(2));

        // Flow rate integration for active cargo transfer
        if (tank.flowRateM3H !== 0) {
          const dVol = tank.flowRateM3H / 3600;
          tank.volumeM3 = parseFloat((tank.volumeM3 + dVol).toFixed(1));
          tank.fillingPercentage = parseFloat(((tank.volumeM3 / tank.capacityM3) * 100).toFixed(2));
          tank.currentLevelM = parseFloat(((tank.fillingPercentage / 100) * tank.maxLevelM).toFixed(2));
          tank.ullageM = parseFloat((tank.maxLevelM - tank.currentLevelM).toFixed(2));
        }

        tank.lastUpdated = nowIso;

        // Evaluate alarm rules & rate of change
        const rocAlarm = alarmEngine.checkRateOfChange(tankId, tank.pressureMbar, vesselId);
        if (rocAlarm) {
          tank.status = 'CRITICAL';
          wsGateway.broadcastAlarm(rocAlarm);
        } else if (alarmEngine.hasActiveAlarm(vesselId, tankId, 'CRITICAL')) {
          tank.status = 'CRITICAL';
        } else if (alarmEngine.hasActiveAlarm(vesselId, tankId, 'WARNING')) {
          tank.status = 'WARNING';
        } else if (tank.pressureMbar > 13.5 || tank.temperatureC > 22.5) {
          tank.status = 'CRITICAL';
        } else if (tank.pressureMbar > 13.0 || tank.temperatureC > 22.0) {
          tank.status = 'WARNING';
        } else {
          tank.status = 'NORMAL';
        }

        // Add downsampled point to time series cache occasionally
        const vesselCache = store.timeSeriesCacheByVessel[vesselId];
        if (vesselCache && vesselCache[tankId] && Math.random() < 0.2) {
          const cache = vesselCache[tankId];
          cache.push({
            timestamp: nowIso,
            temp: tank.temperatureC,
            pressure: tank.pressureMbar,
            level: tank.currentLevelM,
            volume: tank.volumeM3,
            flowRate: tank.flowRateM3H,
          });
          if (cache.length > 200) cache.shift();
        }
      }

      // Update Manifolds jitter
      const manifolds = store.manifoldsByVessel[vesselId] || [];
      for (const m of manifolds) {
        const pJitter = (Math.random() - 0.5) * 0.02;
        m.pressureBar = parseFloat((m.pressureBar + pJitter).toFixed(3));
      }

      // Update Draft & Trim subtle wave motion
      const draft = store.draftByVessel[vesselId];
      if (draft) {
        const baseFore = vesselId === 'VESSEL-001' ? 4.85 : vesselId === 'VESSEL-002' ? 4.18 : 3.92;
        const baseAft = vesselId === 'VESSEL-001' ? 4.90 : vesselId === 'VESSEL-002' ? 4.24 : 3.98;
        draft.foreDraftM = parseFloat((baseFore + (Math.random() - 0.5) * 0.01).toFixed(3));
        draft.aftDraftM = parseFloat((baseAft + (Math.random() - 0.5) * 0.01).toFixed(3));
        draft.meanDraftM = parseFloat(((draft.foreDraftM + draft.aftDraftM) / 2).toFixed(3));
        draft.trimM = parseFloat((draft.aftDraftM - draft.foreDraftM).toFixed(3));
        draft.timestamp = nowIso;
      }

      vesselDataMap[vesselId] = {
        tanks: store.tanksByVessel[vesselId],
        draft: store.draftByVessel[vesselId],
        manifolds: store.manifoldsByVessel[vesselId],
        latencySec: vessel.latencySec,
      };
    }

    // 3. Broadcast live telemetry packet via WebSocket
    const defaultVessel = store.getVessel('VESSEL-001');
    const payload = {
      type: 'TELEMETRY_TICK',
      timestamp: nowIso,
      vessels: store.vessels,
      vesselData: vesselDataMap,
      // Backward compatibility for single vessel client reads:
      vesselId: 'VESSEL-001',
      latencySec: defaultVessel.latencySec,
      tanks: store.getTanks('VESSEL-001'),
      draft: store.getDraft('VESSEL-001'),
      manifolds: store.getManifolds('VESSEL-001'),
      alarmStats: alarmEngine.getSummaryStats(),
    };
    wsGateway.broadcast(payload);
  }
}

export const telemetrySimulator = new TelemetrySimulator();
