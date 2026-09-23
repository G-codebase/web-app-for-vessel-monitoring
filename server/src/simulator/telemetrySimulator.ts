import { store } from '../database/inMemoryStore.js';
import { alarmEngine } from '../modules/alarms/alarmEngine.js';
import { wsGateway } from '../websocket/gateway.js';

export class TelemetrySimulator {
  private timer: NodeJS.Timeout | null = null;
  private rocSpikeActive: { tankId: string; step: number } | null = null;

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

  public triggerRocSpike(tankId: string = 'C05') {
    this.rocSpikeActive = { tankId, step: 0 };
    return { success: true, message: `ROC surge simulation initiated on ${tankId}` };
  }

  public resetSimulation() {
    this.rocSpikeActive = null;
    const c05 = store.tanks['C05'];
    if (c05) {
      c05.pressureMbar = 13.12;
      c05.temperatureC = 21.35;
      c05.flowRateM3H = 32.5;
      c05.status = 'NORMAL';
    }
    return { success: true, message: 'Simulation parameters restored to standard baseline.' };
  }

  private tick() {
    const nowIso = new Date().toISOString();

    // 1. Update MT Ocean Star latency jitter
    const v1 = store.vessels[0];
    v1.latencySec = parseFloat((0.35 + Math.random() * 0.15).toFixed(2));
    v1.lastDataTimestamp = nowIso;

    // 2. Process tanks telemetry jitter & ROC
    for (const tankId of Object.keys(store.tanks)) {
      const tank = store.tanks[tankId];

      // Subtle noise
      const tempJitter = (Math.random() - 0.49) * 0.02;
      let pressJitter = (Math.random() - 0.49) * 0.03;

      // If ROC surge is active on this tank
      if (this.rocSpikeActive && this.rocSpikeActive.tankId === tankId) {
        this.rocSpikeActive.step++;
        // Surge pressure rapidly: +0.4 mbar per second for 10 seconds = +4.0 mbar surge!
        if (this.rocSpikeActive.step <= 10) {
          pressJitter += 0.4;
        } else {
          this.rocSpikeActive = null; // surge complete
        }
      }

      tank.temperatureC = parseFloat((tank.temperatureC + tempJitter).toFixed(2));
      tank.pressureMbar = parseFloat((tank.pressureMbar + pressJitter).toFixed(2));

      // Flow rate integration for active tanks
      if (tank.flowRateM3H !== 0) {
        // volume change in 1 second
        const dVol = (tank.flowRateM3H / 3600);
        tank.volumeM3 = parseFloat((tank.volumeM3 + dVol).toFixed(1));
        tank.fillingPercentage = parseFloat(((tank.volumeM3 / tank.capacityM3) * 100).toFixed(2));
        tank.currentLevelM = parseFloat(((tank.fillingPercentage / 100) * tank.maxLevelM).toFixed(2));
        tank.ullageM = parseFloat((tank.maxLevelM - tank.currentLevelM).toFixed(2));
      }

      tank.lastUpdated = nowIso;

      // Evaluate alarm rules & rate of change
      const rocAlarm = alarmEngine.checkRateOfChange(tankId, tank.pressureMbar);
      if (rocAlarm) {
        tank.status = 'CRITICAL';
        wsGateway.broadcastAlarm(rocAlarm);
      } else if (tank.pressureMbar > 13.5 || tank.temperatureC > 22.5) {
        tank.status = 'CRITICAL';
      } else if (tank.pressureMbar > 13.0 || tank.temperatureC > 22.0) {
        tank.status = 'WARNING';
      } else {
        tank.status = 'NORMAL';
      }

      // Add downsampled point to time series cache occasionally
      const cache = store.timeSeriesCache[tankId];
      if (cache && Math.random() < 0.2) {
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

    // 3. Update Manifolds jitter
    for (const m of store.manifolds) {
      const pJitter = (Math.random() - 0.5) * 0.02;
      m.pressureBar = parseFloat((m.pressureBar + pJitter).toFixed(3));
    }

    // 4. Update Draft & Trim slightly
    store.draft.foreDraftM = parseFloat((4.85 + (Math.random() - 0.5) * 0.01).toFixed(3));
    store.draft.aftDraftM = parseFloat((4.90 + (Math.random() - 0.5) * 0.01).toFixed(3));
    store.draft.meanDraftM = parseFloat(((store.draft.foreDraftM + store.draft.aftDraftM) / 2).toFixed(3));
    store.draft.trimM = parseFloat((store.draft.aftDraftM - store.draft.foreDraftM).toFixed(3));
    store.draft.timestamp = nowIso;

    // 5. Broadcast live telemetry packet via WebSocket
    const payload = {
      type: 'TELEMETRY_TICK',
      timestamp: nowIso,
      vesselId: 'VESSEL-001',
      latencySec: v1.latencySec,
      tanks: store.tanks,
      draft: store.draft,
      manifolds: store.manifolds,
      alarmStats: alarmEngine.getSummaryStats(),
    };
    wsGateway.broadcast(payload);
  }
}

export const telemetrySimulator = new TelemetrySimulator();
