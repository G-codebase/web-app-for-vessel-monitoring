import { UserProfile } from '../types/user';

const getApiBase = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  // When running in a browser, use relative path '' so requests go to the current origin (works on localhost, LAN IP, domains)
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
    // If accessing via dev server port (e.g. 5173), route WS directly to backend port 3001 on the same host
    // to bypass Vite dev proxy websocket overhead and guarantee instant LAN connection
    if (window.location.port && window.location.port !== '3001') {
      return `${proto}//${window.location.hostname}:3001/ws/telemetry`;
    }
    return `${proto}//${window.location.host}/ws/telemetry`;
  }
  return 'ws://127.0.0.1:3001/ws/telemetry';
};

export async function fetchFleetSummary() {
  const res = await fetch(`${API_BASE}/api/fleet/summary`);
  if (!res.ok) throw new Error(`Fleet summary request failed: ${res.statusText}`);
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

export async function fetchTankAnalytics(vesselId: string, tankId: string, range: string = '24H') {
  const res = await fetch(`${API_BASE}/api/vessels/${vesselId}/tanks/${tankId}/analytics?range=${range}`);
  if (!res.ok) throw new Error(`Tank analytics request failed: ${res.statusText}`);
  return res.json();
}

export async function fetchAlarms(vesselId?: string) {
  const query = vesselId && vesselId !== 'ALL' ? `?vesselId=${vesselId}` : '';
  const res = await fetch(`${API_BASE}/api/alarms${query}`);
  if (!res.ok) throw new Error(`Alarms request failed: ${res.statusText}`);
  return res.json();
}

export async function acknowledgeAlarmApi(alarmId: string, user: UserProfile, notes?: string) {
  const res = await fetch(`${API_BASE}/api/alarms/${alarmId}/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, notes }),
  });
  if (!res.ok) throw new Error(`Acknowledge alarm failed: ${res.statusText}`);
  return res.json();
}

export async function resolveAlarmApi(alarmId: string, user: UserProfile, notes?: string) {
  const res = await fetch(`${API_BASE}/api/alarms/${alarmId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  const res = await fetch(`${API_BASE}/api/audit${query}`);
  if (!res.ok) throw new Error(`Audit events request failed: ${res.statusText}`);
  return res.json();
}

export async function recordAuditEvent(entry: {
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  vesselId: string;
  vesselName: string;
  targetEntity: string;
  oldValue?: string;
  newValue?: string;
  details?: string;
}) {
  const res = await fetch(`${API_BASE}/api/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error(`Record audit failed: ${res.statusText}`);
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tankId, vesselId }),
  });
  if (!res.ok) throw new Error(`Trigger ROC failed: ${res.statusText}`);
  return res.json();
}

export async function resetSimulationApi() {
  const res = await fetch(`${API_BASE}/api/simulation/reset`, { method: 'POST' });
  if (!res.ok) throw new Error(`Reset simulation failed: ${res.statusText}`);
  return res.json();
}
