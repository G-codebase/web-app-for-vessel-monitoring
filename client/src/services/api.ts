export const getApiBase = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return '';
  }
  return 'http://127.0.0.1:3001';
};

export const API_BASE = getApiBase();

export const getWsUrl = (): string => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  if (typeof window !== 'undefined') {
    const isSecure = window.location.protocol === 'https:';
    const proto = isSecure ? 'wss:' : 'ws:';
    if (window.location.port && window.location.port !== '3001') {
      return `${proto}//${window.location.hostname}:3001/ws/telemetry`;
    }
    return `${proto}//${window.location.host}/ws/telemetry`;
  }
  return 'ws://127.0.0.1:3001/ws/telemetry';
};

// Authentication Token Helper (Session-scoped to enforce login gate on initial open)
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  // Clear any legacy persistent localStorage token to prevent bypassing initial login
  if (localStorage.getItem('tanker_session_token')) {
    localStorage.removeItem('tanker_session_token');
  }
  return sessionStorage.getItem('tanker_session_token');
}

export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    sessionStorage.setItem('tanker_session_token', token);
  } else {
    sessionStorage.removeItem('tanker_session_token');
    localStorage.removeItem('tanker_session_token');
  }
}


function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ==========================================
export function extractErrorMessage(data: any, defaultMsg: string): string {
  if (!data) return defaultMsg;
  if (typeof data === "string") return data;
  if (typeof data.error === "string") return data.error;
  if (data.error && typeof data.error.message === "string") return data.error.message;
  if (typeof data.message === "string") return data.message;
  if (data.error && typeof data.error.code === "string") return `Error: ${data.error.code}`;
  return defaultMsg;
}

// 1. Authentication APIs
// ==========================================
export async function loginApi(email: string, password: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    let data: any;
    try {
      data = await res.json();
    } catch {
      throw new Error(
        res.status === 503
          ? 'Backend SCADA server (port 3001) is offline. Please start it using npm run dev or npm run dev:server.'
          : `Server returned HTTP ${res.status}. Backend server may be offline.`
      );
    }
    
    if (!res.ok) {
      throw new Error(extractErrorMessage(data, 'Authentication failed'));
    }
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  } catch (err: any) {
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to SCADA backend (port 3001). Please verify the server is running.');
    }
    throw err;
  }
}

export async function logoutApi() {
  try {
    await fetch(`${API_BASE}/api/v1/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } finally {
    setAuthToken(null);
  }
}

export async function fetchCurrentUserApi() {
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    setAuthToken(null);
    throw new Error('Session invalid or expired');
  }
  return res.json();
}

export async function fetchUserSessionsApi() {
  const res = await fetch(`${API_BASE}/api/v1/auth/sessions`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load user sessions');
  return res.json();
}

export async function revokeSessionApi(sessionId: string) {
  const res = await fetch(`${API_BASE}/api/v1/auth/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to revoke session');
  return res.json();
}

// ==========================================
// 2. User & Access Management (Admin)
// ==========================================
export async function fetchUsersApi() {
  const res = await fetch(`${API_BASE}/api/v1/users`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch user directory');
  return res.json();
}

export async function createUserApi(data: {
  username?: string;
  userName?: string;
  email?: string;
  mailId?: string;
  firstName?: string;
  lastName?: string;
  roleName: string;
  vesselIds?: string[];
  password?: string;
  temporaryPassword?: string;
}) {
  const res = await fetch(`${API_BASE}/api/v1/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create user');
  return json;
}

export async function updateUserStatusApi(userId: string, status: 'ACTIVE' | 'DISABLED') {
  const res = await fetch(`${API_BASE}/api/v1/users/${userId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update user status');
  return json;
}

// ==========================================
// 3. Vessel Management
// ==========================================
export async function fetchAuthorizedVessels() {
  const res = await fetch(`${API_BASE}/api/v1/vessels`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    // Fallback to fleet summary if v1 auth is booting
    return fetchFleetSummary();
  }
  return res.json();
}

export async function fetchVessel(vesselId: string) {
  const res = await fetch(`${API_BASE}/api/vessels/${vesselId}`);
  if (!res.ok) throw new Error(`Vessel request failed: ${res.statusText}`);
  return res.json();
}

export async function fetchVesselTanks(vesselId: string) {
  const res = await fetch(`${API_BASE}/api/vessels/${vesselId}/tanks`);
  if (!res.ok) throw new Error(`Tanks request failed: ${res.statusText}`);
  return res.json();
}

export async function fetchVesselDraft(vesselId: string) {
  const res = await fetch(`${API_BASE}/api/vessels/${vesselId}/draft`);
  if (!res.ok) throw new Error(`Draft request failed: ${res.statusText}`);
  return res.json();
}

export async function fetchVesselManifolds(vesselId: string) {
  const res = await fetch(`${API_BASE}/api/vessels/${vesselId}/manifolds`);
  if (!res.ok) throw new Error(`Manifolds request failed: ${res.statusText}`);
  return res.json();
}

export async function fetchFleetSummary() {
  const res = await fetch(`${API_BASE}/api/fleet/summary`);
  if (!res.ok) throw new Error(`Fleet summary request failed: ${res.statusText}`);
  return res.json();
}

// ==========================================
// 4. Cloud Connection & Ingest
// ==========================================
export async function fetchCloudConnection(vesselId: string) {
  const res = await fetch(`${API_BASE}/api/v1/vessels/${vesselId}/cloud-connection`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load cloud connection');
  return res.json();
}

export async function testCloudConnectionApi(vesselId: string) {
  const res = await fetch(`${API_BASE}/api/v1/vessels/${vesselId}/cloud-connection/test`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Cloud gateway handshake test failed');
  return res.json();
}

export async function disconnectCloudApi(vesselId: string) {
  const res = await fetch(`${API_BASE}/api/v1/vessels/${vesselId}/cloud-connection/disconnect`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to disconnect cloud');
  return res.json();
}

export async function reconnectCloudApi(vesselId: string) {
  const res = await fetch(`${API_BASE}/api/v1/vessels/${vesselId}/cloud-connection/reconnect`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to reconnect cloud');
  return res.json();
}

// Ingest External JSON (Sample format: [{device_id, tag, value, limit, state, message, timestamp}])
export async function ingestExternalTelemetryApi(vesselId: string, payload: unknown) {
  const res = await fetch(`${API_BASE}/api/v1/vessels/${vesselId}/telemetry/ingest`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Telemetry ingestion failed');
  return json;
}

// ==========================================
// 5. Monitoring Sessions ("Before connected vessel clouds")
// ==========================================
export async function fetchMonitoringSessionsApi(vesselId?: string) {
  const query = vesselId && vesselId !== 'ALL' ? `?vesselId=${vesselId}` : '';
  const res = await fetch(`${API_BASE}/api/v1/monitoring-sessions${query}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch historical monitoring sessions');
  return res.json();
}

export async function fetchMonitoringSessionDetailsApi(sessionId: string) {
  const res = await fetch(`${API_BASE}/api/v1/monitoring-sessions/${sessionId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch session telemetry');
  return res.json();
}

export async function startMonitoringSessionApi(vesselId: string, label?: string, notes?: string) {
  const res = await fetch(`${API_BASE}/api/v1/monitoring-sessions/start`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ vesselId, label, notes }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to start monitoring session');
  return json;
}

export async function endMonitoringSessionApi(sessionId: string) {
  const res = await fetch(`${API_BASE}/api/v1/monitoring-sessions/${sessionId}/end`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to conclude monitoring session');
  return json;
}

// ==========================================
// 6. Telemetry History & Custom Range CSV Export
// ==========================================
export async function fetchTelemetryHistoryApi(vesselId: string, filters: {
  from?: string;
  to?: string;
  category?: string;
  deviceId?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.category && filters.category !== 'ALL') params.set('category', filters.category);
  if (filters.deviceId && filters.deviceId !== 'ALL') params.set('deviceId', filters.deviceId);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.offset) params.set('offset', String(filters.offset));

  const res = await fetch(`${API_BASE}/api/v1/vessels/${vesselId}/telemetry/history?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load telemetry history');
  return res.json();
}

export function getTelemetryCsvDownloadUrl(vesselId: string, filters: {
  from?: string;
  to?: string;
  category?: string;
  deviceId?: string;
}): string {
  const token = getAuthToken();
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.category && filters.category !== 'ALL') params.set('category', filters.category);
  if (filters.deviceId && filters.deviceId !== 'ALL') params.set('deviceId', filters.deviceId);
  if (token) params.set('token', token);

  return `${API_BASE}/api/v1/vessels/${vesselId}/telemetry/export-csv?${params.toString()}`;
}

export async function triggerCsvDownload(vesselId: string, filters: {
  from?: string;
  to?: string;
  category?: string;
  deviceId?: string;
}) {
  const url = getTelemetryCsvDownloadUrl(vesselId, filters);
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to generate CSV export');

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  let filename = `${vesselId}-telemetry.csv`;
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
  if (filenameMatch && filenameMatch[1]) {
    filename = filenameMatch[1];
  }

  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

// ==========================================
// 7. Alarms, Reports, Simulation
// ==========================================
export async function fetchAlarms(vesselId?: string) {
  const query = vesselId && vesselId !== 'ALL' ? `?vesselId=${vesselId}` : '';
  const res = await fetch(`${API_BASE}/api/alarms${query}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Alarms request failed: ${res.statusText}`);
  return res.json();
}

export async function acknowledgeAlarmApi(alarmId: string, user: any, notes?: string) {
  const res = await fetch(`${API_BASE}/api/alarms/${alarmId}/acknowledge`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ user, notes }),
  });
  if (!res.ok) throw new Error(`Acknowledge alarm failed: ${res.statusText}`);
  return res.json();
}

export async function resolveAlarmApi(alarmId: string, user: any, notes?: string) {
  const res = await fetch(`${API_BASE}/api/alarms/${alarmId}/resolve`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ user, notes }),
  });
  if (!res.ok) throw new Error(`Resolve alarm failed: ${res.statusText}`);
  return res.json();
}

export async function fetchAuditEvents(action?: string, limit = 50) {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));
  if (action && action !== 'ALL') params.set('action', action);

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/api/audit${query}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Audit events request failed: ${res.statusText}`);
  return res.json();
}

export async function fetchDailyReport(vesselId: string = 'VESSEL-001') {
  const res = await fetch(`${API_BASE}/api/reports/daily?vesselId=${vesselId}`);
  if (!res.ok) throw new Error(`Daily report request failed: ${res.statusText}`);
  return res.json();
}

export function getDailyReportCsvUrl(vesselId: string = 'VESSEL-001'): string {
  return `${API_BASE}/api/reports/daily/csv?vesselId=${vesselId}`;
}

export async function triggerRocSpikeApi(tankId: string = 'C05', vesselId: string = 'VESSEL-001') {
  const res = await fetch(`${API_BASE}/api/simulation/roc-spike`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ tankId, vesselId }),
  });
  if (!res.ok) throw new Error(`Trigger ROC failed: ${res.statusText}`);
  return res.json();
}

export async function resetSimulationApi() {
  const res = await fetch(`${API_BASE}/api/simulation/reset`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Reset simulation failed: ${res.statusText}`);
  return res.json();
}

export async function fetchTankAnalytics(vesselId: string, tankId: string, range: string = '24H') {
  const res = await fetch(`${API_BASE}/api/vessels/${vesselId}/tanks/${tankId}/analytics?range=${range}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    // If not found, return fallback structure
    return {
      tankId,
      timeSeries: [],
      stats: { avgTemp: 0, maxTemp: 0, minTemp: 0, avgPressure: 0 },
    };
  }
  return res.json();
}


// ==========================================
// VPS Storage Telemetry APIs (Date-Allocated)
// ==========================================
export async function fetchVpsStorageDates(vesselId: string = 'VESSEL-001') {
  const res = await fetch(`${API_BASE}/api/v1/vessels/${vesselId}/vps-storage/dates`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch VPS storage dates: ${res.statusText}`);
  return res.json();
}

export async function fetchVpsTelemetryByDate(vesselId: string = 'VESSEL-001', date: string) {
  const res = await fetch(`${API_BASE}/api/v1/vessels/${vesselId}/vps-storage/telemetry?date=${encodeURIComponent(date)}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch VPS telemetry for date ${date}: ${res.statusText}`);
  return res.json();
}

export async function allocateVpsDateFile(vesselId: string = 'VESSEL-001', data: any) {
  const res = await fetch(`${API_BASE}/api/v1/vessels/${vesselId}/vps-storage/allocate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to allocate VPS date file');
  return json;
}
