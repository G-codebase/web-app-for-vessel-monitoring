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

export class InMemoryStore {
  public vessels = [
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
      status: 'ONLINE' as const,
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
      status: 'ONLINE' as const,
      lastDataTimestamp: new Date(Date.now() - 4000).toISOString(),
      latencySec: 0.65,
      activeAlertsCount: 2,
      criticalAlertsCount: 0,
      cargoVolumeM3: 112000,
      cargoCapacityM3: 165000,
      cargoFillPct: 67.8,
      ballastVolumeM3: 4200,
      fuelVolumeM3: 820,
      meanDraftM: 4.2,
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
      status: 'WARNING' as const,
      lastDataTimestamp: new Date(Date.now() - 15000).toISOString(),
      latencySec: 2.1,
      activeAlertsCount: 4,
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
      status: 'OFFLINE' as const,
      lastDataTimestamp: new Date(Date.now() - 36 * 60 * 1000).toISOString(),
      latencySec: 2160,
      activeAlertsCount: 1,
      criticalAlertsCount: 0,
      cargoVolumeM3: 32100,
      cargoCapacityM3: 54000,
      cargoFillPct: 59.4,
      ballastVolumeM3: 1900,
      fuelVolumeM3: 410,
      meanDraftM: 3.1,
    },
  ];

  public tanks: Record<string, TankState> = {};
  public draft: DraftState;
  public manifolds: ManifoldState[] = [];
  public alarms: StoredAlarm[] = [];
  public audits: StoredAudit[] = [];
  public timeSeriesCache: Record<string, TimeSeriesPoint[]> = {};

  constructor() {
    this.initializeTanks();
    this.initializeDraft();
    this.initializeManifolds();
    this.initializeAlarms();
    this.initializeAudits();
    this.initializeTimeSeriesCache();
  }

  private initializeTanks() {
    const defaultCargo = [
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
    ];

    for (const c of defaultCargo) {
      const maxLvl = 22.0;
      const lvl = (c.pct / 100) * maxLvl;
      const vol = (c.pct / 100) * c.cap;
      this.tanks[c.id] = {
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
        status: c.id === 'C05' ? 'WARNING' : 'NORMAL',
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  private initializeDraft() {
    this.draft = {
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
  }

  private initializeManifolds() {
    this.manifolds = [
      {
        pointId: 'P1',
        name: 'Cargo Manifold P1 (Port Outer)',
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
        name: 'Cargo Manifold P2 (Port Inner)',
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
        name: 'Cargo Manifold P3 (Stbd Inner)',
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
        name: 'Cargo Manifold P4 (Stbd Outer)',
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
        name: 'Vapour Recovery Line V1 (Port)',
        lineType: 'VAPOUR_LINE',
        pressureBar: 0.0105, // 10.5 mbar
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
        name: 'Vapour Recovery Line V2 (Stbd)',
        lineType: 'VAPOUR_LINE',
        pressureBar: 0.0102, // 10.2 mbar
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

  private initializeTimeSeriesCache() {
    // Generate realistic 24-hour downsampled points (every 10 minutes = 144 points)
    const now = Date.now();
    for (const tankId of Object.keys(this.tanks)) {
      const points: TimeSeriesPoint[] = [];
      const baseTemp = this.tanks[tankId].temperatureC;
      const basePress = this.tanks[tankId].pressureMbar;
      const baseLevel = this.tanks[tankId].currentLevelM;
      const baseVol = this.tanks[tankId].volumeM3;

      for (let i = 144; i >= 0; i--) {
        const time = new Date(now - i * 10 * 60 * 1000).toISOString();
        // subtle diurnal variation + realistic noise
        const sinFactor = Math.sin((i / 144) * Math.PI * 2);
        const temp = parseFloat((baseTemp + sinFactor * 0.7 + (Math.random() - 0.5) * 0.15).toFixed(2));
        const press = parseFloat((basePress + sinFactor * 0.5 + (Math.random() - 0.5) * 0.2).toFixed(2));
        const level = parseFloat((baseLevel + (tankId === 'C05' ? (144 - i) * 0.003 : 0)).toFixed(2));
        const volume = parseFloat((baseVol + (tankId === 'C05' ? (144 - i) * 15 : 0)).toFixed(0));
        const flowRate = tankId === 'C05' ? 32.5 : 0;

        points.push({
          timestamp: time,
          temp,
          pressure: press,
          level,
          volume,
          flowRate,
        });
      }
      this.timeSeriesCache[tankId] = points;
    }
  }
}

export const store = new InMemoryStore();
