import { SensorType, QualityFlag, SubsystemType } from '../constants/units';

export type SensorReading = {
  sensorId: string;
  subsystem: SubsystemType;
  locationId: string; // e.g. TANK-C05, DRAFT-BOW, MANIFOLD-P1
  type: SensorType;
  position?: string; // TOP, MID, BOTTOM, ULLAGE, RADAR
  value: number;
  unit: string;
  quality: QualityFlag;
  rawAdc?: number;
  // Tank-specific calculated projections if applicable
  fillingPercentage?: number;
  volumeM3?: number;
  density?: number;
  flowRateM3H?: number;
};

export type TelemetryHealth = {
  gatewayLatencyMs: number;
  scanCycleMs: number;
  bufferRemainingPct: number;
  status: 'LIVE' | 'DELAYED' | 'STALE' | 'OFFLINE';
  lastMessageTimestamp: string;
  messagesPerMin: number;
  droppedPackets: number;
  dataAvailabilityPct: number;
};

export type VesselTelemetryPayload = {
  schemaVersion: '1.0';
  messageId: string;
  vesselId: string;
  vesselImo: number;
  vesselName: string;
  gatewayId: string;
  timestamp: string; // ISO 8601 UTC
  telemetryHealth: TelemetryHealth;
  readings: SensorReading[];
};

export type TankTelemetrySnapshot = {
  tankId: string;
  tankName: string;
  type: 'CARGO' | 'BALLAST' | 'FUEL';
  capacityM3: number;
  currentLevelM: number;
  maxLevelM: number;
  fillingPercentage: number;
  volumeM3: number;
  ullageM: number;
  temperatureC: number;
  temperatureTopC?: number;
  temperatureMidC?: number;
  temperatureBtmC?: number;
  pressureMbar: number;
  densityTM3: number;
  flowRateM3H: number;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'OFFLINE';
  lastUpdated: string;
};

export type DraftTelemetrySnapshot = {
  vesselId: string;
  foreDraftM: number;
  midPortDraftM: number;
  midStbdDraftM: number;
  aftDraftM: number;
  meanDraftM: number;
  trimM: number; // positive = stern trim, negative = head trim
  heelDeg: number; // positive = starboard list, negative = port list
  displacementTons: number;
  timestamp: string;
};

export type ManifoldPointSnapshot = {
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
