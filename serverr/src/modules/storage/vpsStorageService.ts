import fs from "fs";
import path from "path";
import { store, TankState, DraftState, ManifoldState, StoredAlarm } from "../../database/inMemoryStore.js";
import { wsGateway } from "../../websocket/gateway.js";
import { auditService } from "../audit/auditService.js";

export interface VpsDateRecord {
  date: string;
  fileName: string;
  sizeBytes: number;
  recordCount: number;
  operationalContext: string;
  status: "SYNCHRONIZED" | "ARCHIVED";
  lastModified: string;
  storageCluster: string;
}

export interface VpsTelemetryPayload {
  vesselId: string;
  vesselName: string;
  date: string;
  allocatedFileName: string;
  storageCluster: string;
  operationalContext: string;
  timestamp: string;
  summary: {
    totalCargoVolumeM3: number;
    meanDraftM: number;
    trimM: number;
    heelDeg: number;
    activeAlarmsCount: number;
    criticalAlarmsCount: number;
  };
  tanks: Record<string, TankState>;
  draft: DraftState;
  manifolds: ManifoldState[];
  alarms: StoredAlarm[];
  telemetryReadings: any[];
}

export class VpsStorageService {
  private baseStorageDir: string;

  constructor() {
    this.baseStorageDir = path.resolve(process.cwd(), "serverr", "storage", "vps");
    if (!fs.existsSync(this.baseStorageDir)) {
      fs.mkdirSync(this.baseStorageDir, { recursive: true });
    }
    this.ensureSeedDataForVessels();
  }

  private getVesselDir(vesselId: string): string {
    const dir = path.join(this.baseStorageDir, vesselId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  public ensureSeedDataForVessels() {
    const vessels = [
      { id: "VESSEL-001", name: "MT Ocean Star" },
      { id: "VESSEL-002", name: "MT Pacific Dawn" },
      { id: "VESSEL-003", name: "MT Marine One" },
      { id: "VESSEL-004", name: "MT Southern Sea" },
    ];

    for (const v of vessels) {
      this.ensureDateFiles(v.id, v.name);
    }
  }

  private ensureDateFiles(vesselId: string, vesselName: string) {
    const vDir = this.getVesselDir(vesselId);

    const datesConfig = [
      {
        date: "2026-10-12",
        context: "Live Sea Passage — Stable Open Ocean Transit at 14.2 knots",
        draft: { fore: 4.85, aft: 4.90, trim: 0.05, heel: 0.1, disp: 68400 },
        c05Temp: 21.35,
        c05Press: 13.12,
        c05Status: "NORMAL" as const,
        alarms: [],
      },
      {
        date: "2026-10-11",
        context: "Rough Weather Navigation — Heavy Swell & Ballast Transfer Active",
        draft: { fore: 4.60, aft: 5.05, trim: 0.45, heel: 1.2, disp: 69200 },
        c05Temp: 22.80,
        c05Press: 13.85,
        c05Status: "WARNING" as const,
        alarms: [
          {
            alarmId: `ALM-VPS-${vesselId}-1011-01`,
            vesselId,
            sensorId: "SNS-B01-LVL",
            locationId: "TANK-B01",
            subsystem: "BALLAST",
            ruleType: "HIGH_LEVEL",
            severity: "WARNING" as const,
            state: "ACTIVE_UNACKNOWLEDGED" as const,
            title: "Ballast Tank B01 High Level Warning",
            message: "Ballast DB Tank 1P filling at 88.4%, exceeds high limit 85.0%",
            currentValue: 88.4,
            thresholdValue: 85.0,
            unit: "%",
            raisedAt: "2026-10-11T14:22:00.000Z",
          },
        ],
      },
      {
        date: "2026-10-10",
        context: "Cargo Discharge Terminal Operations — High Thermal Line Surge Event",
        draft: { fore: 4.10, aft: 4.70, trim: 0.60, heel: 0.4, disp: 64500 },
        c05Temp: 82.50,
        c05Press: 14.15,
        c05Status: "CRITICAL" as const,
        alarms: [
          {
            alarmId: `ALM-VPS-${vesselId}-1010-01`,
            vesselId,
            sensorId: "SNS-LINE1-TEMP",
            locationId: "line1-pc",
            subsystem: "TEMPERATURE",
            ruleType: "HIGH_TEMPERATURE",
            severity: "CRITICAL" as const,
            state: "ACTIVE_UNACKNOWLEDGED" as const,
            title: "line1-pc: 82.5°C HIGH (Safety Threshold: 80.0°C)",
            message: "Discharge line temperature surged to 82.5°C exceeding max allowable 80.0°C (+2.5°C difference)",
            currentValue: 82.5,
            thresholdValue: 80.0,
            unit: "°C",
            raisedAt: "2026-10-10T09:14:32.000Z",
          },
          {
            alarmId: `ALM-VPS-${vesselId}-1010-02`,
            vesselId,
            sensorId: "SNS-C05-PRESS",
            locationId: "TANK-C05",
            subsystem: "CARGO",
            ruleType: "OVERPRESSURE",
            severity: "CRITICAL" as const,
            state: "ACTIVE_UNACKNOWLEDGED" as const,
            title: "Cargo Tank C05 Vapour Overpressure",
            message: "Vapour pressure at 14.15 mbar exceeds vent threshold 13.50 mbar",
            currentValue: 14.15,
            thresholdValue: 13.50,
            unit: "mbar",
            raisedAt: "2026-10-10T09:18:15.000Z",
          },
        ],
      },
      {
        date: "2026-10-09",
        context: "Moored Jurong Berth B-4 — Manifold Discharge Connection Baseline",
        draft: { fore: 4.95, aft: 5.00, trim: 0.05, heel: 0.0, disp: 71200 },
        c05Temp: 20.80,
        c05Press: 12.90,
        c05Status: "NORMAL" as const,
        alarms: [],
      },
      {
        date: "2026-10-08",
        context: "Pre-Voyage Cargo Tanks Inert Gas Purge & Class Inspection",
        draft: { fore: 4.88, aft: 4.92, trim: 0.04, heel: 0.1, disp: 68900 },
        c05Temp: 20.40,
        c05Press: 13.05,
        c05Status: "NORMAL" as const,
        alarms: [],
      },
    ];

    for (const item of datesConfig) {
      const filePath = path.join(vDir, `${item.date}.json`);
      if (!fs.existsSync(filePath)) {
        const payload = this.generatePayload(vesselId, vesselName, item);
        fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
      }
    }
  }

  private generatePayload(
    vesselId: string,
    vesselName: string,
    config: {
      date: string;
      context: string;
      draft: { fore: number; aft: number; trim: number; heel: number; disp: number };
      c05Temp: number;
      c05Press: number;
      c05Status: "NORMAL" | "WARNING" | "CRITICAL";
      alarms: any[];
    }
  ): VpsTelemetryPayload {
    const baselineTanks = JSON.parse(JSON.stringify(store.getTanks(vesselId)));
    if (baselineTanks["C05"]) {
      baselineTanks["C05"].temperatureC = config.c05Temp;
      baselineTanks["C05"].pressureMbar = config.c05Press;
      baselineTanks["C05"].status = config.c05Status;
      baselineTanks["C05"].lastUpdated = `${config.date}T12:00:00.000Z`;
    }

    const draftState: DraftState = {
      vesselId,
      foreDraftM: config.draft.fore,
      midPortDraftM: parseFloat(((config.draft.fore + config.draft.aft) / 2 - 0.01).toFixed(3)),
      midStbdDraftM: parseFloat(((config.draft.fore + config.draft.aft) / 2).toFixed(3)),
      aftDraftM: config.draft.aft,
      meanDraftM: parseFloat(((config.draft.fore + config.draft.aft) / 2).toFixed(3)),
      trimM: config.draft.trim,
      heelDeg: config.draft.heel,
      displacementTons: config.draft.disp,
      timestamp: `${config.date}T12:00:00.000Z`,
    };

    const manifolds = JSON.parse(JSON.stringify(store.getManifolds(vesselId)));
    for (const m of manifolds) {
      m.lastUpdated = `${config.date}T12:00:00.000Z`;
      if (config.c05Status === "CRITICAL" && m.pointId === "MAN-01") {
        m.temperatureC = 82.5;
        m.alarmStatus = "CRITICAL";
      }
    }

    let totalVol = 0;
    for (const t of Object.values(baselineTanks as Record<string, TankState>)) {
      totalVol += t.volumeM3 || 0;
    }

    const readings = [
      {
        device_id: "manifold-discharge-1",
        tag: "line1-pc",
        value: config.c05Temp,
        unit: "°C",
        limit: 80.0,
        state: config.c05Temp > 80.0 ? "HIGH" : "NORMAL",
        timestamp: `${config.date}T12:00:00.000Z`,
      },
      {
        device_id: "tank-gauge-c05",
        tag: "press-c05",
        value: config.c05Press,
        unit: "mbar",
        limit: 13.5,
        state: config.c05Press > 13.5 ? "HIGH" : "NORMAL",
        timestamp: `${config.date}T12:00:00.000Z`,
      },
    ];

    return {
      vesselId,
      vesselName,
      date: config.date,
      allocatedFileName: `${config.date}.json`,
      storageCluster: "VPS-CLOUD-STORAGE-NODE-01 (Singapore / Primary)",
      operationalContext: config.context,
      timestamp: `${config.date}T12:00:00.000Z`,
      summary: {
        totalCargoVolumeM3: Math.round(totalVol),
        meanDraftM: draftState.meanDraftM,
        trimM: draftState.trimM,
        heelDeg: draftState.heelDeg,
        activeAlarmsCount: config.alarms.length,
        criticalAlarmsCount: config.alarms.filter((a) => a.severity === "CRITICAL").length,
      },
      tanks: baselineTanks,
      draft: draftState,
      manifolds,
      alarms: config.alarms,
      telemetryReadings: readings,
    };
  }

  public listAvailableDates(vesselId: string): VpsDateRecord[] {
    const vDir = this.getVesselDir(vesselId);
    this.ensureDateFiles(vesselId, vesselId);

    const files = fs.readdirSync(vDir).filter((f) => f.endsWith(".json"));
    const records: VpsDateRecord[] = [];

    for (const f of files) {
      const fullPath = path.join(vDir, f);
      const stat = fs.statSync(fullPath);
      const datePart = f.replace(".json", "");

      let context = "Archived Vessel Telemetry File";
      let recCount = 48;
      try {
        const raw = JSON.parse(fs.readFileSync(fullPath, "utf8"));
        if (raw.operationalContext) context = raw.operationalContext;
        if (raw.telemetryReadings) recCount = raw.telemetryReadings.length + Object.keys(raw.tanks || {}).length;
      } catch {
        // ignore
      }

      records.push({
        date: datePart,
        fileName: f,
        sizeBytes: stat.size,
        recordCount: recCount,
        operationalContext: context,
        status: "SYNCHRONIZED",
        lastModified: stat.mtime.toISOString(),
        storageCluster: "VPS-CLOUD-STORAGE-NODE-01 (Singapore / Primary)",
      });
    }

    // Sort descending by date
    records.sort((a, b) => b.date.localeCompare(a.date));
    return records;
  }

  public getTelemetryForDate(vesselId: string, requestedDate: string): VpsTelemetryPayload {
    const vDir = this.getVesselDir(vesselId);
    let date = requestedDate ? requestedDate.trim() : "2026-10-12";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      date = "2026-10-12";
    }

    const filePath = path.join(vDir, `${date}.json`);
    let payload: VpsTelemetryPayload;

    if (fs.existsSync(filePath)) {
      payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } else {
      // Synthesize and allocate new date file on VPS storage
      const v = store.getVessel(vesselId);
      payload = this.generatePayload(vesselId, v.name, {
        date,
        context: `Custom Allocated VPS Telemetry Snapshot for ${date}`,
        draft: { fore: 4.80, aft: 4.88, trim: 0.08, heel: 0.1, disp: 68000 },
        c05Temp: 21.5,
        c05Press: 13.1,
        c05Status: "NORMAL",
        alarms: [],
      });
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
    }

    // Apply this date's snapshot to live store so subsequent queries/WebSocket are in sync
    store.tanksByVessel[vesselId] = payload.tanks;
    store.draftByVessel[vesselId] = payload.draft;
    store.manifoldsByVessel[vesselId] = payload.manifolds;

    // Broadcast update to all connected clients
    wsGateway.broadcast({
      type: "VPS_STORAGE_RENDERED",
      vesselId,
      date,
      allocatedFile: payload.allocatedFileName,
      timestamp: payload.timestamp,
      tanks: payload.tanks,
      draft: payload.draft,
      manifolds: payload.manifolds,
      alarms: payload.alarms,
      summary: payload.summary,
    });

    return payload;
  }

  public allocateCustomDate(
    actor: { id: string; name: string; role: string },
    vesselId: string,
    data: {
      date: string;
      operationalContext?: string;
      c05Temp?: number;
      c05Press?: number;
      c05Status?: "NORMAL" | "WARNING" | "CRITICAL";
      draftFore?: number;
      draftAft?: number;
    }
  ): VpsTelemetryPayload {
    const vDir = this.getVesselDir(vesselId);
    const date = data.date.trim();
    const filePath = path.join(vDir, `${date}.json`);
    const v = store.getVessel(vesselId);

    const fore = data.draftFore ?? 4.85;
    const aft = data.draftAft ?? 4.90;

    const payload = this.generatePayload(vesselId, v.name, {
      date,
      context: data.operationalContext || `Manual VPS Allocation for ${date}`,
      draft: { fore, aft, trim: parseFloat((aft - fore).toFixed(3)), heel: 0.1, disp: 68400 },
      c05Temp: data.c05Temp ?? 21.35,
      c05Press: data.c05Press ?? 13.12,
      c05Status: data.c05Status ?? "NORMAL",
      alarms: [],
    });

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");

    auditService.record({
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action: "VPS_FILE_ALLOCATED",
      vesselId,
      vesselName: v.name,
      targetEntity: `VPS:${date}.json`,
      ipAddress: "127.0.0.1",
      details: `Operator allocated new VPS telemetry file ${date}.json.`,
    });

    return payload;
  }
}

export const vpsStorageService = new VpsStorageService();
