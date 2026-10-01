import React, { useEffect, useState, useRef, useCallback } from 'react';
import { UserProfile, AVAILABLE_USERS } from '../types/user';
import { TankData, DraftData, ManifoldData, AlarmItem } from './types';
import { TelemetryContext } from './TelemetryContext';
import * as api from '../services/api';

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
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const currentVesselIdRef = useRef<string>(currentVesselId);
  const connectWsRef = useRef<() => void>(() => {});

  // Keep ref synchronized outside of render body
  useEffect(() => {
    currentVesselIdRef.current = currentVesselId;
  }, [currentVesselId]);

  // Fetch vessel-specific data
  const fetchVesselData = useCallback(async (vesselId: string) => {
    try {
      const [vesselTanks, vesselDraft, vesselManifolds, vesselAlarms] = await Promise.all([
        api.fetchVesselTanks(vesselId),
        api.fetchVesselDraft(vesselId),
        api.fetchVesselManifolds(vesselId),
        api.fetchAlarms(vesselId),
      ]);

      if (!isMountedRef.current) return;

      const tMap: Record<string, TankData> = {};
      for (const t of vesselTanks) {
        tMap[t.tankId] = t;
      }
      setTanks(tMap);
      setDraft(vesselDraft);
      setManifolds(vesselManifolds);
      if (vesselAlarms.alarms) setAlarms(vesselAlarms.alarms);
      if (vesselAlarms.stats) setAlarmStats(vesselAlarms.stats);

      // Auto-validate selectedTankId on new vessel
      setSelectedTankId((prev) => (prev && tMap[prev] ? prev : Object.keys(tMap)[0] || null));
    } catch (e) {
      console.error(`Error loading vessel ${vesselId} data:`, e);
    }
  }, []);

  const fetchFleetAndAlarms = useCallback(async () => {
    try {
      const [fleetRes, alarmsRes] = await Promise.all([
        api.fetchFleetSummary(),
        api.fetchAlarms(),
      ]);

      if (!isMountedRef.current) return;

      if (fleetRes.vessels) setVessels(fleetRes.vessels);
      if (alarmsRes.alarms) setAlarms(alarmsRes.alarms);
      if (alarmsRes.stats) setAlarmStats(alarmsRes.stats);
    } catch (e) {
      console.error('Error fetching fleet & alarms:', e);
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!isMountedRef.current) return;
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        connectWsRef.current();
      }
    }, 3000);
  }, []);

  const connectWs = useCallback(() => {
    if (!isMountedRef.current) return;

    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const wsUrl = api.getWsUrl();
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setConnectionStatus('LIVE');
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          const activeVessel = currentVesselIdRef.current;

          if (data.vessels) {
            setVessels(data.vessels);
          }

          if (data.alarmStats) {
            setAlarmStats(data.alarmStats);
          }

          // Multi-vessel tick or snapshot payload
          if (data.vesselData && data.vesselData[activeVessel]) {
            const vData = data.vesselData[activeVessel];
            if (vData.tanks) setTanks(vData.tanks);
            if (vData.draft) setDraft(vData.draft);
            if (vData.manifolds) setManifolds(vData.manifolds);
            if (vData.latencySec !== undefined) setLatencySec(vData.latencySec);
          } else if (data.vesselId === activeVessel) {
            if (data.tanks) setTanks(data.tanks);
            if (data.draft) setDraft(data.draft);
            if (data.manifolds) setManifolds(data.manifolds);
            if (data.latencySec !== undefined) setLatencySec(data.latencySec);
          }

          if (data.type === 'SNAPSHOT' && data.alarms) {
            setAlarms(data.alarms);
          } else if (data.type === 'ALARM_RAISED' || data.type === 'ALARM_UPDATED') {
            api.fetchAlarms(activeVessel).then((res) => {
              if (isMountedRef.current && res.alarms) {
                setAlarms(res.alarms);
                if (res.stats) setAlarmStats(res.stats);
              }
            });
          }
        } catch (err) {
          console.error('WS message parsing error:', err);
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setConnectionStatus('OFFLINE');
        socketRef.current = null;
        scheduleReconnect();
      };

      ws.onerror = () => {
        if (!isMountedRef.current) return;
        setConnectionStatus('OFFLINE');
      };
    } catch (err) {
      console.error('WS connection error:', err);
      if (!isMountedRef.current) return;
      setConnectionStatus('OFFLINE');
      scheduleReconnect();
    }
  }, [scheduleReconnect]);

  useEffect(() => {
    connectWsRef.current = connectWs;
  }, [connectWs]);

  // Initial load and vessel change
  useEffect(() => {
    isMountedRef.current = true;
    let isCurrent = true;

    Promise.all([
      api.fetchFleetSummary(),
      api.fetchAlarms(),
      api.fetchVesselTanks(currentVesselId),
      api.fetchVesselDraft(currentVesselId),
      api.fetchVesselManifolds(currentVesselId),
    ])
      .then(([fleetRes, alarmsRes, vesselTanks, vesselDraft, vesselManifolds]) => {
        if (!isCurrent) return;
        if (fleetRes.vessels) setVessels(fleetRes.vessels);
        if (alarmsRes.alarms) setAlarms(alarmsRes.alarms);
        if (alarmsRes.stats) setAlarmStats(alarmsRes.stats);

        const tMap: Record<string, TankData> = {};
        for (const t of vesselTanks) {
          tMap[t.tankId] = t;
        }
        setTanks(tMap);
        setDraft(vesselDraft);
        setManifolds(vesselManifolds);
        setSelectedTankId((prev) => (prev && tMap[prev] ? prev : Object.keys(tMap)[0] || null));
      })
      .catch((err) => {
        console.error('Initial load error:', err);
      });

    connectWs();

    return () => {
      isCurrent = false;
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [connectWs, currentVesselId]);

  const handleSetCurrentVesselId = (vesselId: string) => {
    setCurrentVesselId(vesselId);
    fetchVesselData(vesselId);
  };

  const handleAcknowledgeAlarm = async (alarmId: string, notes?: string) => {
    try {
      await api.acknowledgeAlarmApi(alarmId, currentUser, notes);
      const res = await api.fetchAlarms(currentVesselId);
      if (res.alarms) setAlarms(res.alarms);
      if (res.stats) setAlarmStats(res.stats);
    } catch (e) {
      console.error('Acknowledge alarm error:', e);
    }
  };

  const handleResolveAlarm = async (alarmId: string, notes?: string) => {
    try {
      await api.resolveAlarmApi(alarmId, currentUser, notes);
      const res = await api.fetchAlarms(currentVesselId);
      if (res.alarms) setAlarms(res.alarms);
      if (res.stats) setAlarmStats(res.stats);
    } catch (e) {
      console.error('Resolve alarm error:', e);
    }
  };

  const handleTriggerRocSpike = async (tankId: string = 'C05') => {
    try {
      await api.triggerRocSpikeApi(tankId, currentVesselId);
    } catch (e) {
      console.error('Trigger ROC error:', e);
    }
  };

  const handleResetSimulation = async () => {
    try {
      await api.resetSimulationApi();
      await fetchFleetAndAlarms();
      await fetchVesselData(currentVesselId);
    } catch (e) {
      console.error('Reset simulation error:', e);
    }
  };

  return (
    <TelemetryContext.Provider
      value={{
        connectionStatus,
        latencySec,
        vessels,
        currentVesselId,
        setCurrentVesselId: handleSetCurrentVesselId,
        tanks,
        draft,
        manifolds,
        alarms,
        alarmStats,
        currentUser,
        setCurrentUser,
        selectedTankId,
        setSelectedTankId,
        acknowledgeAlarm: handleAcknowledgeAlarm,
        resolveAlarm: handleResolveAlarm,
        triggerRocSpike: handleTriggerRocSpike,
        resetSimulation: handleResetSimulation,
        refreshAlarms: fetchFleetAndAlarms,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};
