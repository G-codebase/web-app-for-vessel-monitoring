export type TankState = {
  tankId: string;
  name: string;
  section: 'FORE' | 'MID' | 'AFT' | 'SLOP';
  type: 'CARGO' | 'BALLAST' | 'FUEL';
  capacityM3: number;
  maxLevelM: number;
  currentLevelM: number;
  fillingPercentage: number;
  volumeM3: number;
  ullageM: number;
  temperatureC: number;
  temperatureTopC: number;
  temperatureMidC: number;
  temperatureBtmC: number;
  pressureMbar: number;
  densityTM3: number;
  flowRateM3H: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
  lastUpdated: string;
};

export type DraftState = {
  vesselId: string;
  foreDraftM: number;
  midPortDraftM: number;
  midStbdDraftM: number;
  aftDraftM: number;
  meanDraftM: number;
  trimM: number;
  heelDeg: number;
  displacementTons: number;
  timestamp: string;
};

export type ManifoldState = {
  pointId: string;
  name: string;
  lineType: 'CARGO_LINE' | 'VAPOUR_LINE' | 'BUNKER_LINE';
  pressureBar: number;
  temperatureC: number;
  valveStatus: 'OPEN' | 'CLOSED' | 'THROTTLED';
  valvePositionPct: number;
  flowRateM3H: number;
  alarmStatus: 'NORMAL' | 'WARNING' | 'CRITICAL';
  historical24hAvg: number;
  historicalMax: number;
  historicalMin: number;
  rateOfChangeBarPerMin: number;
};

export type TimeSeriesPoint = {
  timestamp: string;
  temp: number;
  pressure: number;
  level: number;
  volume: number;
  flowRate: number;
};

export type StoredAlarm = {
  alarmId: string;
  vesselId: string;
  sensorId: string;
  locationId: string;
  subsystem: string;
  ruleType: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  state: 'ACTIVE_UNACKNOWLEDGED' | 'ACTIVE_ACKNOWLEDGED' | 'RESOLVED';
  title: string;
  message: string;
  currentValue: number;
  thresholdValue: number;
  unit: string;
  rateOfChange?: string;
  raisedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
};

export type StoredAudit = {
  eventId: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  vesselId: string;
  vesselName: string;
  targetEntity: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  details: string;
};

export type VesselRecord = {
  vesselId: string;
  imo: number;
  name: string;
  type: string;
  flag: string;
  callSign: string;
  dwt: number;
  lengthOverallM: number;
  beamM: number;
  maxDraftM: number;
  status: 'ONLINE' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
  lastDataTimestamp: string;
  latencySec: number;
  activeAlertsCount: number;
  criticalAlertsCount: number;
  cargoVolumeM3: number;
  cargoCapacityM3: number;
  cargoFillPct: number;
  ballastVolumeM3: number;
  fuelVolumeM3: number;
  meanDraftM: number;
};

export class InMemoryStore {
  public vessels: VesselRecord[] = [
    {
      vesselId: 'VESSEL-001',
      imo: 9876543,
      name: 'MT Ocean Star',
      type: 'VLCC',
      flag: 'Panama',
      callSign: '3EPR9',
      dwt: 318000,
      lengthOverallM: 333.0,
      beamM: 60.0,
      maxDraftM: 22.5,
      status: 'ONLINE',
      lastDataTimestamp: new Date().toISOString(),
      latencySec: 0.42,
      activeAlertsCount: 1,
      criticalAlertsCount: 1,
      cargoVolumeM3: 638250,
      cargoCapacityM3: 881500,
      cargoFillPct: 72.4,
      ballastVolumeM3: 6420,
      fuelVolumeM3: 1080,
      meanDraftM: 4.85,
    },
    {
      vesselId: 'VESSEL-002',
      imo: 9753124,
      name: 'MT Pacific Dawn',
      type: 'SUEZMAX',
      flag: 'Liberia',
      callSign: 'A8QK4',
      dwt: 156000,
      lengthOverallM: 274.0,
      beamM: 48.0,
      maxDraftM: 17.2,
      status: 'ONLINE',
      lastDataTimestamp: new Date(Date.now() - 4000).toISOString(),
      latencySec: 0.65,
      activeAlertsCount: 1,
      criticalAlertsCount: 0,
      cargoVolumeM3: 112000,
      cargoCapacityM3: 165000,
      cargoFillPct: 67.8,
      ballastVolumeM3: 4200,
      fuelVolumeM3: 820,
      meanDraftM: 4.20,
    },
    {
      vesselId: 'VESSEL-003',
      imo: 9642819,
      name: 'MT Marine One',
      type: 'AFRAMAX',
      flag: 'Singapore',
      callSign: '9V882',
      dwt: 115000,
      lengthOverallM: 245.0,
      beamM: 44.0,
      maxDraftM: 15.0,
      status: 'WARNING',
      lastDataTimestamp: new Date(Date.now() - 15000).toISOString(),
      latencySec: 1.85,
      activeAlertsCount: 2,
      criticalAlertsCount: 1,
      cargoVolumeM3: 89400,
      cargoCapacityM3: 120000,
      cargoFillPct: 74.5,
      ballastVolumeM3: 3100,
      fuelVolumeM3: 650,
      meanDraftM: 3.95,
    },
    {
      vesselId: 'VESSEL-004',
      imo: 9531742,
      name: 'MT Southern Sea',
      type: 'PRODUCT_CARRIER',
      flag: 'Marshall Islands',
      callSign: 'V7AB2',
      dwt: 50000,
      lengthOverallM: 183.0,
      beamM: 32.2,
      maxDraftM: 11.5,
      status: 'OFFLINE',
      lastDataTimestamp: new Date(Date.now() - 36 * 60 * 1000).toISOString(),
      latencySec: 2160,
      activeAlertsCount: 1,
      criticalAlertsCount: 0,
      cargoVolumeM3: 32100,
      cargoCapacityM3: 54000,
      cargoFillPct: 59.4,
      ballastVolumeM3: 1900,
      fuelVolumeM3: 410,
      meanDraftM: 3.10,
    },
  ];

  public tanksByVessel: Record<string, Record<string, TankState>> = {};
  public draftByVessel: Record<string, DraftState> = {};
  public manifoldsByVessel: Record<string, ManifoldState[]> = {};
  public timeSeriesCacheByVessel: Record<string, Record<string, TimeSeriesPoint[]>> = {};

  public alarms: StoredAlarm[] = [];
  public audits: StoredAudit[] = [];

  constructor() {
    this.initializeAllVesselsData();
    this.initializeAlarms();
    this.initializeAudits();
    this.initializeAllTimeSeries();
  }

  // Backward compatible accessors pointing to VESSEL-001
  public get tanks(): Record<string, TankState> {
    return this.getTanks('VESSEL-001');
  }

  public get draft(): DraftState {
    return this.getDraft('VESSEL-001');
  }

  public get manifolds(): ManifoldState[] {
    return this.getManifolds('VESSEL-001');
  }

  public get timeSeriesCache(): Record<string, TimeSeriesPoint[]> {
    return this.timeSeriesCacheByVessel['VESSEL-001'] || {};
  }

  public getVessel(vesselId: string): VesselRecord {
    return this.vessels.find((v) => v.vesselId === vesselId) || this.vessels[0];
  }

  public getTanks(vesselId: string): Record<string, TankState> {
    return this.tanksByVessel[vesselId] || this.tanksByVessel['VESSEL-001'] || {};
  }

  public getDraft(vesselId: string): DraftState {
    return this.draftByVessel[vesselId] || this.draftByVessel['VESSEL-001'];
  }

  public getManifolds(vesselId: string): ManifoldState[] {
    return this.manifoldsByVessel[vesselId] || this.manifoldsByVessel['VESSEL-001'] || [];
  }

  public getTimeSeries(vesselId: string, tankId: string): TimeSeriesPoint[] {
    const vesselCache = this.timeSeriesCacheByVessel[vesselId] || this.timeSeriesCacheByVessel['VESSEL-001'] || {};
    return vesselCache[tankId] || vesselCache['C05'] || vesselCache['C01'] || [];
  }

  private initializeAllVesselsData() {
    // 1. VESSEL-001: MT Ocean Star (VLCC) - 11 Tanks
    this.tanksByVessel['VESSEL-001'] = this.createTanksConfig([
      { id: 'C01', name: 'Cargo Tank C01 (Fore Port)', sec: 'FORE', pct: 72.0, cap: 70000, temp: 21.1, press: 12.8, flow: 0 },
      { id: 'C02', name: 'Cargo Tank C02 (Fore Center)', sec: 'FORE', pct: 69.4, cap: 75000, temp: 21.0, press: 12.7, flow: 0 },
      { id: 'C03', name: 'Cargo Tank C03 (Fore Stbd)', sec: 'FORE', pct: 75.1, cap: 70000, temp: 21.4, press: 13.0, flow: 0 },
      { id: 'C04', name: 'Cargo Tank C04 (Mid Port)', sec: 'MID', pct: 71.2, cap: 80000, temp: 21.2, press: 12.9, flow: 0 },
      { id: 'C05', name: 'Cargo Tank C05 (Mid Center)', sec: 'MID', pct: 68.2, cap: 95000, temp: 21.35, press: 13.12, flow: 32.5 },
      { id: 'C06', name: 'Cargo Tank C06 (Mid Stbd)', sec: 'MID', pct: 68.0, cap: 80000, temp: 21.1, press: 12.85, flow: 0 },
      { id: 'C07', name: 'Cargo Tank C07 (Aft Port)', sec: 'AFT', pct: 70.5, cap: 75000, temp: 21.3, press: 12.95, flow: 0 },
      { id: 'C08', name: 'Cargo Tank C08 (Aft Center)', sec: 'AFT', pct: 67.3, cap: 80000, temp: 21.05, press: 12.7, flow: 0 },
      { id: 'C09', name: 'Cargo Tank C09 (Aft Stbd)', sec: 'AFT', pct: 74.2, cap: 75000, temp: 21.45, press: 13.05, flow: 0 },
      { id: 'SLOP-P', name: 'Slop Tank Port', sec: 'SLOP', pct: 45.0, cap: 15000, temp: 20.8, press: 11.5, flow: 0 },
      { id: 'SLOP-S', name: 'Slop Tank Stbd', sec: 'SLOP', pct: 42.0, cap: 15000, temp: 20.7, press: 11.4, flow: 0 },
    ]);

    this.draftByVessel['VESSEL-001'] = {
      vesselId: 'VESSEL-001',
      foreDraftM: 4.85,
      midPortDraftM: 4.87,
      midStbdDraftM: 4.88,
      aftDraftM: 4.90,
      meanDraftM: 4.875,
      trimM: 0.05,
      heelDeg: 0.1,
      displacementTons: 68400,
      timestamp: new Date().toISOString(),
    };

    this.manifoldsByVessel['VESSEL-001'] = this.createDefaultManifolds('VESSEL-001');

    // 2. VESSEL-002: MT Pacific Dawn (Suezmax) - 10 Tanks
    this.tanksByVessel['VESSEL-002'] = this.createTanksConfig([
      { id: 'C01', name: 'Cargo Tank C01 (Fore Port)', sec: 'FORE', pct: 68.5, cap: 18000, temp: 20.5, press: 12.2, flow: 0 },
      { id: 'C02', name: 'Cargo Tank C02 (Fore Stbd)', sec: 'FORE', pct: 68.0, cap: 18000, temp: 20.4, press: 12.1, flow: 0 },
      { id: 'C03', name: 'Cargo Tank C03 (Mid Port 1)', sec: 'MID', pct: 67.2, cap: 22000, temp: 20.6, press: 12.3, flow: 0 },
      { id: 'C04', name: 'Cargo Tank C04 (Mid Stbd 1)', sec: 'MID', pct: 66.8, cap: 22000, temp: 20.5, press: 12.2, flow: 0 },
      { id: 'C05', name: 'Cargo Tank C05 (Mid Port 2)', sec: 'MID', pct: 69.1, cap: 22000, temp: 20.8, press: 12.4, flow: 18.0 },
      { id: 'C06', name: 'Cargo Tank C06 (Mid Stbd 2)', sec: 'MID', pct: 68.5, cap: 22000, temp: 20.7, press: 12.3, flow: 0 },
      { id: 'C07', name: 'Cargo Tank C07 (Aft Port)', sec: 'AFT', pct: 65.4, cap: 18000, temp: 20.4, press: 12.0, flow: 0 },
      { id: 'C08', name: 'Cargo Tank C08 (Aft Stbd)', sec: 'AFT', pct: 65.0, cap: 18000, temp: 20.3, press: 12.0, flow: 0 },
      { id: 'SLOP-P', name: 'Slop Tank Port', sec: 'SLOP', pct: 40.0, cap: 6000, temp: 19.8, press: 11.0, flow: 0 },
      { id: 'SLOP-S', name: 'Slop Tank Stbd', sec: 'SLOP', pct: 38.0, cap: 6000, temp: 19.7, press: 10.9, flow: 0 },
    ]);

    this.draftByVessel['VESSEL-002'] = {
      vesselId: 'VESSEL-002',
      foreDraftM: 4.18,
      midPortDraftM: 4.20,
      midStbdDraftM: 4.21,
      aftDraftM: 4.24,
      meanDraftM: 4.21,
      trimM: 0.06,
      heelDeg: 0.05,
      displacementTons: 42500,
      timestamp: new Date(Date.now() - 4000).toISOString(),
    };

    this.manifoldsByVessel['VESSEL-002'] = this.createDefaultManifolds('VESSEL-002');

    // 3. VESSEL-003: MT Marine One (Aframax) - 8 Tanks
    this.tanksByVessel['VESSEL-003'] = this.createTanksConfig([
      { id: 'C01', name: 'Cargo Tank C01 (Fore Port)', sec: 'FORE', pct: 75.0, cap: 16000, temp: 22.3, press: 13.4, flow: 0 },
      { id: 'C02', name: 'Cargo Tank C02 (Fore Stbd)', sec: 'FORE', pct: 74.8, cap: 16000, temp: 22.1, press: 13.2, flow: 0 },
      { id: 'C03', name: 'Cargo Tank C03 (Mid Port)', sec: 'MID', pct: 76.2, cap: 20000, temp: 22.6, press: 13.6, flow: 25.0 },
      { id: 'C04', name: 'Cargo Tank C04 (Mid Stbd)', sec: 'MID', pct: 75.8, cap: 20000, temp: 22.4, press: 13.3, flow: 0 },
      { id: 'C05', name: 'Cargo Tank C05 (Aft Port)', sec: 'AFT', pct: 72.1, cap: 18000, temp: 21.9, press: 12.8, flow: 0 },
      { id: 'C06', name: 'Cargo Tank C06 (Aft Stbd)', sec: 'AFT', pct: 71.9, cap: 18000, temp: 21.8, press: 12.7, flow: 0 },
      { id: 'SLOP-P', name: 'Slop Tank Port', sec: 'SLOP', pct: 48.0, cap: 5000, temp: 21.0, press: 11.8, flow: 0 },
      { id: 'SLOP-S', name: 'Slop Tank Stbd', sec: 'SLOP', pct: 46.0, cap: 5000, temp: 20.9, press: 11.6, flow: 0 },
    ]);

    this.draftByVessel['VESSEL-003'] = {
      vesselId: 'VESSEL-003',
      foreDraftM: 3.92,
      midPortDraftM: 3.95,
      midStbdDraftM: 3.96,
      aftDraftM: 3.98,
      meanDraftM: 3.95,
      trimM: 0.06,
      heelDeg: 0.15,
      displacementTons: 31800,
      timestamp: new Date(Date.now() - 15000).toISOString(),
    };

    this.manifoldsByVessel['VESSEL-003'] = this.createDefaultManifolds('VESSEL-003');

    // 4. VESSEL-004: MT Southern Sea (Product Carrier) - 6 Tanks
    this.tanksByVessel['VESSEL-004'] = this.createTanksConfig([
      { id: 'C01', name: 'Cargo Tank C01 (Fore Port)', sec: 'FORE', pct: 60.0, cap: 10000, temp: 19.5, press: 11.2, flow: 0 },
      { id: 'C02', name: 'Cargo Tank C02 (Fore Stbd)', sec: 'FORE', pct: 59.5, cap: 10000, temp: 19.4, press: 11.1, flow: 0 },
      { id: 'C03', name: 'Cargo Tank C03 (Mid Port)', sec: 'MID', pct: 61.2, cap: 12000, temp: 19.8, press: 11.5, flow: 0 },
      { id: 'C04', name: 'Cargo Tank C04 (Mid Stbd)', sec: 'MID', pct: 60.5, cap: 12000, temp: 19.7, press: 11.4, flow: 0 },
      { id: 'SLOP-P', name: 'Slop Tank Port', sec: 'SLOP', pct: 35.0, cap: 3000, temp: 18.9, press: 10.5, flow: 0 },
      { id: 'SLOP-S', name: 'Slop Tank Stbd', sec: 'SLOP', pct: 34.0, cap: 3000, temp: 18.8, press: 10.4, flow: 0 },
    ]);

    this.draftByVessel['VESSEL-004'] = {
      vesselId: 'VESSEL-004',
      foreDraftM: 3.08,
      midPortDraftM: 3.10,
      midStbdDraftM: 3.10,
      aftDraftM: 3.12,
      meanDraftM: 3.10,
      trimM: 0.04,
      heelDeg: 0.0,
      displacementTons: 14200,
      timestamp: new Date(Date.now() - 36 * 60 * 1000).toISOString(),
    };

    this.manifoldsByVessel['VESSEL-004'] = this.createDefaultManifolds('VESSEL-004');
  }

  private createTanksConfig(list: Array<{ id: string; name: string; sec: string; pct: number; cap: number; temp: number; press: number; flow: number }>): Record<string, TankState> {
    const res: Record<string, TankState> = {};
    for (const c of list) {
      const maxLvl = 22.0;
      const lvl = (c.pct / 100) * maxLvl;
      const vol = (c.pct / 100) * c.cap;
      const isWarn = c.press > 13.0 || c.temp > 22.0;
      const isCrit = c.press > 13.5 || c.temp > 22.5;

      res[c.id] = {
        tankId: c.id,
        name: c.name,
        section: c.sec as any,
        type: 'CARGO',
        capacityM3: c.cap,
        maxLevelM: maxLvl,
        currentLevelM: parseFloat(lvl.toFixed(2)),
        fillingPercentage: c.pct,
        volumeM3: parseFloat(vol.toFixed(0)),
        ullageM: parseFloat((maxLvl - lvl).toFixed(2)),
        temperatureC: c.temp,
        temperatureTopC: parseFloat((c.temp + 0.3).toFixed(2)),
        temperatureMidC: c.temp,
        temperatureBtmC: parseFloat((c.temp - 0.4).toFixed(2)),
        pressureMbar: c.press,
        densityTM3: 0.900,
        flowRateM3H: c.flow,
        status: isCrit ? 'CRITICAL' : isWarn ? 'WARNING' : 'NORMAL',
        lastUpdated: new Date().toISOString(),
      };
    }
    return res;
  }

  private createDefaultManifolds(vesselId: string): ManifoldState[] {
    return [
      {
        pointId: 'P1',
        name: `Cargo Manifold P1 (Port Outer)`,
        lineType: 'CARGO_LINE',
        pressureBar: 12.1,
        temperatureC: 21.2,
        valveStatus: 'OPEN',
        valvePositionPct: 100,
        flowRateM3H: 1450,
        alarmStatus: 'NORMAL',
        historical24hAvg: 11.9,
        historicalMax: 12.8,
        historicalMin: 10.5,
        rateOfChangeBarPerMin: 0.02,
      },
      {
        pointId: 'P2',
        name: `Cargo Manifold P2 (Port Inner)`,
        lineType: 'CARGO_LINE',
        pressureBar: 11.8,
        temperatureC: 21.1,
        valveStatus: 'OPEN',
        valvePositionPct: 100,
        flowRateM3H: 1420,
        alarmStatus: 'NORMAL',
        historical24hAvg: 11.7,
        historicalMax: 12.5,
        historicalMin: 10.4,
        rateOfChangeBarPerMin: -0.01,
      },
      {
        pointId: 'P3',
        name: `Cargo Manifold P3 (Stbd Inner)`,
        lineType: 'CARGO_LINE',
        pressureBar: 11.9,
        temperatureC: 21.3,
        valveStatus: 'OPEN',
        valvePositionPct: 100,
        flowRateM3H: 1440,
        alarmStatus: 'NORMAL',
        historical24hAvg: 11.8,
        historicalMax: 12.6,
        historicalMin: 10.6,
        rateOfChangeBarPerMin: 0.01,
      },
      {
        pointId: 'P4',
        name: `Cargo Manifold P4 (Stbd Outer)`,
        lineType: 'CARGO_LINE',
        pressureBar: 12.3,
        temperatureC: 21.4,
        valveStatus: 'OPEN',
        valvePositionPct: 100,
        flowRateM3H: 1470,
        alarmStatus: 'NORMAL',
        historical24hAvg: 12.0,
        historicalMax: 12.9,
        historicalMin: 10.7,
        rateOfChangeBarPerMin: 0.03,
      },
      {
        pointId: 'V1',
        name: `Vapour Recovery Line V1 (Port)`,
        lineType: 'VAPOUR_LINE',
        pressureBar: 0.0105,
        temperatureC: 19.8,
        valveStatus: 'OPEN',
        valvePositionPct: 80,
        flowRateM3H: 350,
        alarmStatus: 'NORMAL',
        historical24hAvg: 0.0102,
        historicalMax: 0.0115,
        historicalMin: 0.0095,
        rateOfChangeBarPerMin: 0.0001,
      },
      {
        pointId: 'V2',
        name: `Vapour Recovery Line V2 (Stbd)`,
        lineType: 'VAPOUR_LINE',
        pressureBar: 0.0102,
        temperatureC: 19.7,
        valveStatus: 'OPEN',
        valvePositionPct: 80,
        flowRateM3H: 340,
        alarmStatus: 'NORMAL',
        historical24hAvg: 0.0100,
        historicalMax: 0.0112,
        historicalMin: 0.0094,
        rateOfChangeBarPerMin: -0.0001,
      },
    ];
  }

  private initializeAlarms() {
    this.alarms = [
      {
        alarmId: 'AL-101',
        vesselId: 'VESSEL-001',
        sensorId: 'SENS-C05-PRESS-ULLAGE',
        locationId: 'C05',
        subsystem: 'CARGO',
        ruleType: 'STATIC_HIGH',
        severity: 'CRITICAL',
        state: 'ACTIVE_UNACKNOWLEDGED',
        title: 'C05 Ullage Pressure High',
        message: 'Tank C05 pressure exceeded warning limit (13.0 mbar)',
        currentValue: 13.9,
        thresholdValue: 13.0,
        unit: 'mbar',
        rateOfChange: '+0.8 mbar / min',
        raisedAt: new Date(Date.now() - 180000).toISOString(),
      },
      {
        alarmId: 'AL-102',
        vesselId: 'VESSEL-001',
        sensorId: 'SENS-B07-LEVEL',
        locationId: 'B07',
        subsystem: 'BALLAST',
        ruleType: 'RATE_OF_CHANGE',
        severity: 'WARNING',
        state: 'ACTIVE_UNACKNOWLEDGED',
        title: 'B07 Level Rapid Change',
        message: 'Ballast Tank B07 level changing faster than normal operating limits',
        currentValue: 12.5,
        thresholdValue: 10.0,
        unit: 'm³/h',
        rateOfChange: '+12.5 m³/h in 2m',
        raisedAt: new Date(Date.now() - 360000).toISOString(),
      },
      {
        alarmId: 'AL-103',
        vesselId: 'VESSEL-001',
        sensorId: 'SENS-C02-TEMP-TOP',
        locationId: 'C02',
        subsystem: 'CARGO',
        ruleType: 'STATIC_HIGH',
        severity: 'WARNING',
        state: 'ACTIVE_ACKNOWLEDGED',
        title: 'C02 Top Temperature Rising',
        message: 'Cargo Tank C02 top layer temperature reached 22.1 °C',
        currentValue: 22.1,
        thresholdValue: 22.0,
        unit: '°C',
        raisedAt: new Date(Date.now() - 720000).toISOString(),
        acknowledgedAt: new Date(Date.now() - 300000).toISOString(),
        acknowledgedBy: 'Chief Officer John',
        notes: 'Inert gas purge active, monitoring thermal gradient.',
      },
      {
        alarmId: 'AL-201',
        vesselId: 'VESSEL-002',
        sensorId: 'SENS-C05-FLOW',
        locationId: 'C05',
        subsystem: 'CARGO',
        ruleType: 'STATIC_HIGH',
        severity: 'WARNING',
        state: 'ACTIVE_UNACKNOWLEDGED',
        title: 'C05 Cargo Flow Deviation',
        message: 'Discharge flow rate fluctuating beyond nominal envelope',
        currentValue: 18.0,
        thresholdValue: 15.0,
        unit: 'm³/h',
        raisedAt: new Date(Date.now() - 480000).toISOString(),
      },
      {
        alarmId: 'AL-301',
        vesselId: 'VESSEL-003',
        sensorId: 'SENS-C03-PRESS',
        locationId: 'C03',
        subsystem: 'CARGO',
        ruleType: 'STATIC_HIGH',
        severity: 'CRITICAL',
        state: 'ACTIVE_UNACKNOWLEDGED',
        title: 'C03 High Ullage Pressure',
        message: 'Cargo Tank C03 pressure reached 13.6 mbar',
        currentValue: 13.6,
        thresholdValue: 13.0,
        unit: 'mbar',
        raisedAt: new Date(Date.now() - 240000).toISOString(),
      },
      {
        alarmId: 'AL-401',
        vesselId: 'VESSEL-004',
        sensorId: 'SENS-COMM-SAT',
        locationId: 'BRIDGE-SAT',
        subsystem: 'COMMUNICATION',
        ruleType: 'COMMUNICATION_LOSS',
        severity: 'WARNING',
        state: 'ACTIVE_UNACKNOWLEDGED',
        title: 'Telemetry Carrier Degraded',
        message: 'Primary Inmarsat-C satellite terminal signal lost (Offline)',
        currentValue: 2160,
        thresholdValue: 60,
        unit: 's',
        raisedAt: new Date(Date.now() - 36 * 60 * 1000).toISOString(),
      },
    ];
  }

  private initializeAudits() {
    this.audits = [
      {
        eventId: 'AUD-001',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        userId: 'USR-8821',
        userName: 'John Mate',
        userRole: 'VESSEL_OPERATOR',
        action: 'THRESHOLD_UPDATE',
        vesselId: 'VESSEL-001',
        vesselName: 'MT Ocean Star',
        targetEntity: 'Rule-C05-PRESS-WARN',
        oldValue: '12.5 mbar',
        newValue: '13.0 mbar',
        ipAddress: '192.168.10.45',
        details: 'Adjusted Ullage pressure warning setpoint prior to cargo discharge cycle.',
      },
      {
        eventId: 'AUD-002',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        userId: 'USR-8821',
        userName: 'John Mate',
        userRole: 'VESSEL_OPERATOR',
        action: 'ALARM_ACKNOWLEDGE',
        vesselId: 'VESSEL-001',
        vesselName: 'MT Ocean Star',
        targetEntity: 'AL-103 (C02 Temp Rising)',
        oldValue: 'ACTIVE_UNACKNOWLEDGED',
        newValue: 'ACTIVE_ACKNOWLEDGED',
        ipAddress: '192.168.10.45',
        details: 'Acknowledged C02 top temperature alert. Thermal gradient verified.',
      },
      {
        eventId: 'AUD-003',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        userId: 'USR-9004',
        userName: 'Sarah Fleet',
        userRole: 'FLEET_MANAGER',
        action: 'REPORT_GENERATION',
        vesselId: 'VESSEL-001',
        vesselName: 'MT Ocean Star',
        targetEntity: 'Vessel Daily Operations Report',
        ipAddress: '10.200.4.12',
        details: 'Generated 24-hour compliance operational report.',
      },
    ];
  }

  private initializeAllTimeSeries() {
    const now = Date.now();
    for (const vesselId of Object.keys(this.tanksByVessel)) {
      this.timeSeriesCacheByVessel[vesselId] = {};
      const vesselTanks = this.tanksByVessel[vesselId];

      for (const tankId of Object.keys(vesselTanks)) {
        const points: TimeSeriesPoint[] = [];
        const baseTemp = vesselTanks[tankId].temperatureC;
        const basePress = vesselTanks[tankId].pressureMbar;
        const baseLevel = vesselTanks[tankId].currentLevelM;
        const baseVol = vesselTanks[tankId].volumeM3;

        for (let i = 144; i >= 0; i--) {
          const time = new Date(now - i * 10 * 60 * 1000).toISOString();
          const sinFactor = Math.sin((i / 144) * Math.PI * 2);
          const temp = parseFloat((baseTemp + sinFactor * 0.7 + (Math.random() - 0.5) * 0.15).toFixed(2));
          const press = parseFloat((basePress + sinFactor * 0.5 + (Math.random() - 0.5) * 0.2).toFixed(2));
          const level = parseFloat((baseLevel + (tankId === 'C05' ? (144 - i) * 0.003 : 0)).toFixed(2));
          const volume = parseFloat((baseVol + (tankId === 'C05' ? (144 - i) * 15 : 0)).toFixed(0));
          const flowRate = vesselTanks[tankId].flowRateM3H;

          points.push({
            timestamp: time,
            temp,
            pressure: press,
            level,
            volume,
            flowRate,
          });
        }
        this.timeSeriesCacheByVessel[vesselId][tankId] = points;
      }
    }
  }
}

export const store = new InMemoryStore();
