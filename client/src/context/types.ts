
export type VpsDateRecord = {
  date: string;
  fileName: string;
  sizeBytes: number;
  recordCount: number;
  operationalContext: string;
  status: "SYNCHRONIZED" | "ARCHIVED";
  lastModified: string;
  storageCluster: string;
};
import { UserProfile } from '../types/user';

export type TankData = {
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

export type DraftData = {
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

export type ManifoldData = {
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

export type AlarmItem = {
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

export type TelemetryContextType = {
  // Authentication & Security
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;

  // Cloud & Gateway Health
  connectionStatus: 'LIVE' | 'CONNECTING' | 'OFFLINE';
  cloudStatus: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'ERROR';
  latencySec: number;
  lastDataTimestamp: string;

  // Vessels
  vessels: any[];
  currentVesselId: string;
  setCurrentVesselId: (id: string) => void;

  // Telemetry Models
  tanks: Record<string, TankData>;
  draft: DraftData | null;
  manifolds: ManifoldData[];
  alarms: AlarmItem[];
  alarmStats: {
    criticalCount: number;
    warningCount: number;
    activeCount: number;
    acknowledgedCount: number;
  };
  selectedTankId: string | null;
  setSelectedTankId: (id: string | null) => void;

  // Operations
  acknowledgeAlarm: (alarmId: string, notes?: string) => Promise<void>;
  resolveAlarm: (alarmId: string, notes?: string) => Promise<void>;
  triggerRocSpike: (tankId?: string) => Promise<void>;
  resetSimulation: () => Promise<void>;
  refreshAlarms: () => Promise<void>;
  refreshAll: () => Promise<void>;
  testCloudHandshake: () => Promise<any>;
  connectCloud: (vesselId?: string) => Promise<any>;
  disconnectCloud: (vesselId?: string) => Promise<void>;

  // VPS Storage & Date-Allocated Telemetry
  selectedDate: string;
  setSelectedDate: (date: string) => Promise<void>;
  vpsStorageDates: VpsDateRecord[];
  vpsActiveFile: string;
  vpsOperationalContext: string;
  isLoadingDateTelemetry: boolean;
  loadVpsStorageDates: (vesselId?: string) => Promise<void>;
  isDataInitiated: boolean;
  initiateDataRender: (vesselId?: string, date?: string) => Promise<void>;
  resetToNotInitiated: () => void;
};

