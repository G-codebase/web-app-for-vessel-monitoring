import React, { useEffect, useState, useRef, useCallback } from 'react';
import { UserProfile, AVAILABLE_USERS } from '../types/user';
import { TankData, DraftData, ManifoldData, AlarmItem, VpsDateRecord } from './types';
import { TelemetryContext } from './TelemetryContext';
import * as api from '../services/api';

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(AVAILABLE_USERS[0]);

  // Telemetry & Cloud Connection state
  const [connectionStatus, setConnectionStatus] = useState<'LIVE' | 'CONNECTING' | 'OFFLINE'>('CONNECTING');
  const [cloudStatus, setCloudStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'ERROR'>('DISCONNECTED');
  const [latencySec, setLatencySec] = useState<number>(0.042);

  const [lastDataTimestamp, setLastDataTimestamp] = useState<string>(new Date().toISOString());

  // Vessels state
  const [vessels, setVessels] = useState<any[]>([]);
  const [currentVesselId, setCurrentVesselId] = useState<string>('VESSEL-001');

  // Telemetry initiation state - default to uninitiated / standby until user renders
  const [isDataInitiated, setIsDataInitiated] = useState<boolean>(false);
  const isDataInitiatedRef = useRef<boolean>(false);

  useEffect(() => {
    isDataInitiatedRef.current = isDataInitiated;
  }, [isDataInitiated]);

  // Subsystem models (uninitiated by default)
  const [tanks, setTanks] = useState<Record<string, TankData>>({});
  const [draft, setDraft] = useState<DraftData | null>(null);
  const [manifolds, setManifolds] = useState<ManifoldData[]>([]);
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [alarmStats, setAlarmStats] = useState({
    criticalCount: 0,
    warningCount: 0,
    activeCount: 0,
    acknowledgedCount: 0,
  });
  const [selectedTankId, setSelectedTankId] = useState<string | null>(null);

  // VPS Storage & Date-Allocated Telemetry State
  const [selectedDate, setSelectedDateState] = useState<string>('');
  const [vpsStorageDates, setVpsStorageDates] = useState<VpsDateRecord[]>([]);
  const [vpsActiveFile, setVpsActiveFile] = useState<string>('');
  const [vpsOperationalContext, setVpsOperationalContext] = useState<string>(
    'Telemetric Stream Not Initiated — Workstation on Standby'
  );
  const [isLoadingDateTelemetry, setIsLoadingDateTelemetry] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const currentVesselIdRef = useRef<string>(currentVesselId);
  const connectWsRef = useRef<() => void>(() => {});

  useEffect(() => {
    currentVesselIdRef.current = currentVesselId;
  }, [currentVesselId]);

  // 1. Fetch Vessel-Specific Telemetry Data
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

      setSelectedTankId((prev) => (prev && tMap[prev] ? prev : Object.keys(tMap)[0] || 'C05'));
      setLastDataTimestamp(new Date().toISOString());
    } catch (e) {
      console.error(`Error loading vessel ${vesselId} data:`, e);
    }
  }, []);

  const fetchFleetAndAlarms = useCallback(async () => {
    try {
      const [vesselsRes, alarmsRes] = await Promise.all([
        api.fetchAuthorizedVessels(),
        api.fetchAlarms(),
      ]);

      if (!isMountedRef.current) return;

      if (vesselsRes.vessels) {
        setVessels(vesselsRes.vessels);
      }
      if (alarmsRes.alarms) setAlarms(alarmsRes.alarms);
      if (alarmsRes.stats) setAlarmStats(alarmsRes.stats);
    } catch (e) {
      console.error('Error fetching fleet & alarms:', e);
    }
  }, []);

  // 2. WebSocket Stream
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
        setCloudStatus('CONNECTED');
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          const activeVessel = currentVesselIdRef.current;
          setLastDataTimestamp(new Date().toISOString());

          if (data.vessels) {
            setVessels(data.vessels);
          }

          // Do NOT render vessel details if telemetry stream has not been initiated by operator
          if (!isDataInitiatedRef.current) {
            return;
          }

          if (data.alarmStats) {
            setAlarmStats(data.alarmStats);
          }

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
          console.error('WS parse error:', err);
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

  // 3. Initial Session Check
  useEffect(() => {
    isMountedRef.current = true;
    const token = api.getAuthToken();

    if (!token) {
      setIsAuthenticated(false);
      setAuthLoading(false);
      return;
    }

    api.fetchCurrentUserApi()
      .then((res) => {
        if (!isMountedRef.current) return;
        if (res.user) {
          setCurrentUser({
            id: res.user.id,
            userId: res.user.id,
            name: `${res.user.firstName} ${res.user.lastName}`,
            email: res.user.email,
            role: res.user.roles[0] || 'OPERATOR',
            roles: res.user.roles,
            permissions: res.user.permissions,
            assignedVessels: res.user.assignedVessels,
            isSuperOrAdmin: res.user.isSuperOrAdmin,
          });
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        if (!isMountedRef.current) return;
        setIsAuthenticated(false);
      })
      .finally(() => {
        if (isMountedRef.current) {
          setAuthLoading(false);
        }
      });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 4. Load Fleet Directory & Connect WebSocket When Authenticated (Vessel details remain uninitiated until requested)
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchFleetAndAlarms();
    loadVpsStorageDates(currentVesselId);
    connectWs();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, currentVesselId, fetchFleetAndAlarms, fetchVesselData, connectWs]);

  // Auth Operations
  const handleLogin = async (email: string, pass: string) => {
    const res = await api.loginApi(email, pass);
    if (res.user) {
      setCurrentUser({
        id: res.user.id,
        userId: res.user.id,
        username: (res.user.username || res.user.email?.split('@')[0] || 'OPERATOR').toUpperCase(),
        name: `${res.user.firstName} ${res.user.lastName}`,
        email: res.user.email,
        role: res.user.roles[0] || 'OPERATOR',
        roles: res.user.roles,
        permissions: res.user.permissions,
        assignedVessels: res.user.assignedVessels,
        isSuperOrAdmin: res.user.roles.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'TESTER_ADMIN'].includes(r)),
      });
      setIsAuthenticated(true);
      setCloudStatus('DISCONNECTED'); // Require connecting vessel cloud as Step 2
    }
  };

  const handleLogout = async () => {
    await api.logoutApi();
    setIsAuthenticated(false);
    setCloudStatus('DISCONNECTED');
    handleResetToNotInitiated();
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  };


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

  const handleTestCloudHandshake = async () => {
    try {
      const res = await api.testCloudConnectionApi(currentVesselId);
      setCloudStatus('CONNECTED');
      setLastDataTimestamp(new Date().toISOString());
      await fetchFleetAndAlarms();
      await fetchVesselData(currentVesselId);
      return res;
    } catch (e) {
      setCloudStatus('ERROR');
      throw e;
    }
  };

  const handleConnectCloud = async (vesselId?: string) => {
    const vId = vesselId || currentVesselId;
    try {
      setCloudStatus('RECONNECTING');
      const res = await api.reconnectCloudApi(vId);
      setCloudStatus('CONNECTED');
      setLastDataTimestamp(new Date().toISOString());
      await fetchFleetAndAlarms();
      await fetchVesselData(vId);
      await loadVpsStorageDates(vId);
      return res;
    } catch (e) {
      setCloudStatus('ERROR');
      throw e;
    }
  };

  const loadVpsStorageDates = useCallback(async (vesselId?: string) => {
    const vId = vesselId || currentVesselIdRef.current;
    try {
      const res = await api.fetchVpsStorageDates(vId);
      if (res && res.dates) {
        setVpsStorageDates(res.dates);
      }
    } catch (e) {
      console.warn("Failed to fetch VPS storage dates:", e);
    }
  }, []);

  const handleSetSelectedDate = useCallback(async (date: string) => {
    setSelectedDateState(date);
    setIsLoadingDateTelemetry(true);
    try {
      const res = await api.fetchVpsTelemetryByDate(currentVesselIdRef.current, date);
      if (res && res.telemetry) {
        const payload = res.telemetry;
        setVpsActiveFile(payload.allocatedFileName || `${date}.json`);
        setVpsOperationalContext(payload.operationalContext || "Archived VPS Telemetry Snapshot");
        if (payload.tanks) setTanks(payload.tanks);
        if (payload.draft) setDraft(payload.draft);
        if (payload.manifolds) setManifolds(payload.manifolds);
        if (payload.tanks) {
          const firstKey = Object.keys(payload.tanks)[0];
          if (firstKey) setSelectedTankId(firstKey);
        }
        setIsDataInitiated(true);
        isDataInitiatedRef.current = true;
        if (payload.alarms) {
          setAlarms(payload.alarms);
          setAlarmStats({
            criticalCount: payload.alarms.filter((a: any) => a.severity === "CRITICAL").length,
            warningCount: payload.alarms.filter((a: any) => a.severity === "WARNING").length,
            activeCount: payload.alarms.length,
            acknowledgedCount: 0,
          });
        }
        setLastDataTimestamp(payload.timestamp || new Date().toISOString());
      }
    } catch (e) {
      console.error(`Failed to load VPS telemetry for date ${date}:`, e);
    } finally {
      setIsLoadingDateTelemetry(false);
    }
  }, []);

  const handleInitiateDataRender = useCallback(async (vesselId?: string, date?: string) => {
    const vId = vesselId || currentVesselIdRef.current;
    let targetDate = date;
    if (!targetDate) {
      if (vpsStorageDates.length > 0) {
        targetDate = vpsStorageDates[0].date;
      } else {
        targetDate = '2026-10-12';
      }
    }
    await handleSetSelectedDate(targetDate);
  }, [vpsStorageDates, handleSetSelectedDate]);

  const handleResetToNotInitiated = useCallback(() => {
    setIsDataInitiated(false);
    isDataInitiatedRef.current = false;
    setTanks({});
    setDraft(null);
    setManifolds([]);
    setAlarms([]);
    setAlarmStats({
      criticalCount: 0,
      warningCount: 0,
      activeCount: 0,
      acknowledgedCount: 0,
    });
    setSelectedTankId(null);
    setSelectedDateState('');
    setVpsActiveFile('');
    setVpsOperationalContext('Telemetric Stream Not Initiated — Workstation on Standby');
  }, []);

  const handleDisconnectCloud = async (vesselId?: string) => {
    const vId = vesselId || currentVesselId;
    try {
      await api.disconnectCloudApi(vId);
      setCloudStatus('DISCONNECTED');
    } catch (e) {
      console.error('Disconnect cloud error:', e);
    }
  };

  return (
    <TelemetryContext.Provider
      value={{
        isAuthenticated,
        authLoading,
        login: handleLogin,
        logout: handleLogout,
        currentUser,
        setCurrentUser,
        connectionStatus,
        cloudStatus,
        latencySec,
        lastDataTimestamp,
        vessels,
        currentVesselId,
        setCurrentVesselId: handleSetCurrentVesselId,
        tanks,
        draft,
        manifolds,
        alarms,
        alarmStats,
        selectedTankId,
        setSelectedTankId,
        acknowledgeAlarm: handleAcknowledgeAlarm,
        resolveAlarm: handleResolveAlarm,
        triggerRocSpike: handleTriggerRocSpike,
        resetSimulation: handleResetSimulation,
        refreshAlarms: fetchFleetAndAlarms,
        refreshAll: fetchFleetAndAlarms,
        testCloudHandshake: handleTestCloudHandshake,
        connectCloud: handleConnectCloud,
        disconnectCloud: handleDisconnectCloud,
        selectedDate,
        setSelectedDate: handleSetSelectedDate,
        vpsStorageDates,
        vpsActiveFile,
        vpsOperationalContext,
        isLoadingDateTelemetry,
        loadVpsStorageDates,
        isDataInitiated,
        initiateDataRender: handleInitiateDataRender,
        resetToNotInitiated: handleResetToNotInitiated,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

