import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

export type UserRole =
  | 'FLEET_MANAGER'
  | 'VESSEL_OPERATOR'
  | 'CHIEF_ENGINEER'
  | 'AUDITOR';

export type UserProfile = {
  userId: string;
  name: string;
  role: UserRole;
  rank: string;
  email: string;
};

export const AVAILABLE_USERS: UserProfile[] = [
  { userId: 'USR-8821', name: 'John Mate', role: 'VESSEL_OPERATOR', rank: 'Chief Officer', email: 'john.mate@oceanstar.marine' },
  { userId: 'USR-9004', name: 'Sarah Fleet', role: 'FLEET_MANAGER', rank: 'Fleet Superintendent', email: 'sarah.fleet@sjv-shipping.com' },
  { userId: 'USR-7732', name: 'Vikram Singh', role: 'CHIEF_ENGINEER', rank: 'Chief Engineer', email: 'v.singh@oceanstar.marine' },
  { userId: 'USR-5510', name: 'Elena Rostova', role: 'AUDITOR', rank: 'Class Surveyor / Vetting', email: 'elena.rostova@dnv.com' },
];

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
  connectionStatus: 'LIVE' | 'CONNECTING' | 'OFFLINE';
  latencySec: number;
  vessels: any[];
  currentVesselId: string;
  setCurrentVesselId: (id: string) => void;
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
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  selectedTankId: string | null;
  setSelectedTankId: (id: string | null) => void;
  acknowledgeAlarm: (alarmId: string, notes?: string) => Promise<void>;
  resolveAlarm: (alarmId: string, notes?: string) => Promise<void>;
  triggerRocSpike: (tankId?: string) => Promise<void>;
  resetSimulation: () => Promise<void>;
  refreshAlarms: () => Promise<void>;
};

const TelemetryContext = createContext<TelemetryContextType | null>(null);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<'LIVE' | 'CONNECTING' | 'OFFLINE'>('CONNECTING');
  const [latencySec, setLatencySec] = useState<number>(0.42);
  const [vessels, setVessels] = useState<any[]>([]);
  const [currentVesselId, setCurrentVesselId] = useState<string>('VESSEL-001');
  const [tanks, setTanks] = useState<Record<string, TankData>>({});
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [manifolds, setManifolds] = useState<ManifoldData[]>([]);
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [alarmStats, setAlarmStats] = useState({
    criticalCount: 1,
    warningCount: 2,
    activeCount: 3,
    acknowledgedCount: 1,
  });
  const [currentUser, setCurrentUser] = useState<UserProfile>(AVAILABLE_USERS[0]);
  const [selectedTankId, setSelectedTankId] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);

  // Initial HTTP fetch
  const fetchInitialData = async () => {
    try {
      const [fleetRes, alarmsRes, draftRes, manifoldsRes, tanksRes] = await Promise.all([
        fetch('http://localhost:3001/api/fleet/summary').then((r) => r.json()),
        fetch('http://localhost:3001/api/alarms').then((r) => r.json()),
        fetch('http://localhost:3001/api/vessels/VESSEL-001/draft').then((r) => r.json()),
        fetch('http://localhost:3001/api/vessels/VESSEL-001/manifolds').then((r) => r.json()),
        fetch('http://localhost:3001/api/vessels/VESSEL-001/tanks').then((r) => r.json()),
      ]);

      if (fleetRes.vessels) setVessels(fleetRes.vessels);
      if (alarmsRes.alarms) setAlarms(alarmsRes.alarms);
      if (alarmsRes.stats) setAlarmStats(alarmsRes.stats);
      if (draftRes) setDraft(draftRes);
      if (manifoldsRes) setManifolds(manifoldsRes);
      if (tanksRes) {
        const tMap: Record<string, TankData> = {};
        for (const t of tanksRes) tMap[t.tankId] = t;
        setTanks(tMap);
      }
    } catch (e) {
      console.error('Initial data fetch error:', e);
    }
  };

  const connectWs = () => {
    try {
      const ws = new WebSocket('ws://localhost:3001/ws/telemetry');
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('LIVE');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'SNAPSHOT') {
            if (data.vessels) setVessels(data.vessels);
            if (data.tanks) setTanks(data.tanks);
            if (data.draft) setDraft(data.draft);
            if (data.manifolds) setManifolds(data.manifolds);
            if (data.alarms) setAlarms(data.alarms);
            if (data.alarmStats) setAlarmStats(data.alarmStats);
          } else if (data.type === 'TELEMETRY_TICK') {
            if (data.tanks) setTanks(data.tanks);
            if (data.draft) setDraft(data.draft);
            if (data.manifolds) setManifolds(data.manifolds);
            if (data.latencySec) setLatencySec(data.latencySec);
            if (data.alarmStats) setAlarmStats(data.alarmStats);
          } else if (data.type === 'ALARM_RAISED' || data.type === 'ALARM_UPDATED') {
            fetchAlarms();
          }
        } catch (err) {
          console.error('WS parse error', err);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('OFFLINE');
        setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        setConnectionStatus('OFFLINE');
      };
    } catch (err) {
      setConnectionStatus('OFFLINE');
      setTimeout(connectWs, 3000);
    }
  };

  const fetchAlarms = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/alarms').then((r) => r.json());
      if (res.alarms) setAlarms(res.alarms);
      if (res.stats) setAlarmStats(res.stats);
    } catch (e) {
      console.error('Error refreshing alarms', e);
    }
  };

  useEffect(() => {
    fetchInitialData();
    connectWs();

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  const acknowledgeAlarm = async (alarmId: string, notes?: string) => {
    try {
      await fetch(`http://localhost:3001/api/alarms/${alarmId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: currentUser,
          notes: notes || `Acknowledged by ${currentUser.name} (${currentUser.rank})`,
        }),
      });
      await fetchAlarms();
    } catch (e) {
      console.error('Acknowledge error', e);
    }
  };

  const resolveAlarm = async (alarmId: string, notes?: string) => {
    try {
      await fetch(`http://localhost:3001/api/alarms/${alarmId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: currentUser,
          notes: notes || `Resolved by ${currentUser.name} (${currentUser.rank})`,
        }),
      });
      await fetchAlarms();
    } catch (e) {
      console.error('Resolve error', e);
    }
  };

  const triggerRocSpike = async (tankId: string = 'C05') => {
    try {
      await fetch('http://localhost:3001/api/simulation/roc-spike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tankId }),
      });
    } catch (e) {
      console.error('Trigger ROC error', e);
    }
  };

  const resetSimulation = async () => {
    try {
      await fetch('http://localhost:3001/api/simulation/reset', { method: 'POST' });
      await fetchInitialData();
    } catch (e) {
      console.error('Reset simulation error', e);
    }
  };

  return (
    <TelemetryContext.Provider
      value={{
        connectionStatus,
        latencySec,
        vessels,
        currentVesselId,
        setCurrentVesselId,
        tanks,
        draft,
        manifolds,
        alarms,
        alarmStats,
        currentUser,
        setCurrentUser,
        selectedTankId,
        setSelectedTankId,
        acknowledgeAlarm,
        resolveAlarm,
        triggerRocSpike,
        resetSimulation,
        refreshAlarms: fetchAlarms,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error('useTelemetry must be used within TelemetryProvider');
  return ctx;
};
