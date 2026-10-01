import { store, StoredAlarm } from '../../database/inMemoryStore.js';
import { auditService } from '../audit/auditService.js';

export class AlarmEngine {
  private recentPressureHistory: { vesselId: string; tankId: string; timestamp: number; pressure: number }[] = [];

  public checkRateOfChange(tankId: string, currentPressure: number, vesselId: string = 'VESSEL-001'): StoredAlarm | null {
    const now = Date.now();
    this.recentPressureHistory.push({ vesselId, tankId, timestamp: now, pressure: currentPressure });

    // Keep history strictly within last 60 seconds
    this.recentPressureHistory = this.recentPressureHistory.filter(
      (h) => now - h.timestamp <= 60000
    );

    // Look for records from 5 to 30 seconds ago
    const pastRecords = this.recentPressureHistory.filter(
      (h) => h.vesselId === vesselId && h.tankId === tankId && now - h.timestamp >= 5000
    );

    if (pastRecords.length > 0) {
      // Compare with the earliest available record in the 5s..30s window
      const reference = pastRecords[0];
      const deltaP = currentPressure - reference.pressure;
      const deltaTimeSec = Math.max(1, Math.round((now - reference.timestamp) / 1000));
      const ratePerMin = (deltaP / deltaTimeSec) * 60;

      // Trigger if rate of change >= 3.0 mbar/min and absolute rise >= 0.8 mbar
      if (ratePerMin >= 3.0 && deltaP >= 0.8) {
        const existing = store.alarms.find(
          (a) => a.vesselId === vesselId && a.locationId === tankId && a.ruleType === 'RATE_OF_CHANGE' && a.state !== 'RESOLVED'
        );

        if (!existing) {
          const vessel = store.getVessel(vesselId);
          const newAlarm: StoredAlarm = {
            alarmId: `AL-${Date.now().toString().slice(-4)}`,
            vesselId,
            sensorId: `SENS-${tankId}-PRESS-ULLAGE`,
            locationId: tankId,
            subsystem: 'CARGO',
            ruleType: 'RATE_OF_CHANGE',
            severity: 'CRITICAL',
            state: 'ACTIVE_UNACKNOWLEDGED',
            title: `RATE-OF-CHANGE: ${tankId} Rapid Pressure Surge`,
            message: `Pressure surged by +${deltaP.toFixed(1)} mbar within ${deltaTimeSec}s (+${ratePerMin.toFixed(1)} mbar/min)`,
            currentValue: parseFloat(currentPressure.toFixed(2)),
            thresholdValue: 3.0,
            unit: 'mbar',
            rateOfChange: `+${ratePerMin.toFixed(1)} mbar/min`,
            raisedAt: new Date().toISOString(),
          };
          store.alarms.unshift(newAlarm);
          this.syncVesselAlertCounts(vesselId);
          return newAlarm;
        }
      }
    }
    return null;
  }

  public hasActiveAlarm(vesselId: string, locationId: string, severity?: 'CRITICAL' | 'WARNING'): boolean {
    return store.alarms.some(
      (a) =>
        a.vesselId === vesselId &&
        a.locationId === locationId &&
        a.state !== 'RESOLVED' &&
        (!severity || a.severity === severity)
    );
  }

  public getAlarms(vesselId?: string) {
    if (vesselId && vesselId !== 'ALL') {
      return store.alarms.filter((a) => a.vesselId === vesselId);
    }
    return store.alarms;
  }

  public getSummaryStats(vesselId?: string) {
    const list = vesselId && vesselId !== 'ALL'
      ? store.alarms.filter((a) => a.vesselId === vesselId)
      : store.alarms;

    const active = list.filter((a) => a.state !== 'RESOLVED');
    const critical = active.filter((a) => a.severity === 'CRITICAL');
    const warning = active.filter((a) => a.severity === 'WARNING');
    const acknowledged = list.filter((a) => a.state === 'ACTIVE_ACKNOWLEDGED');

    return {
      criticalCount: critical.length,
      warningCount: warning.length,
      activeCount: active.length,
      acknowledgedCount: acknowledged.length,
    };
  }

  public acknowledgeAlarm(alarmId: string, user: { userId: string; name: string; role: string }, notes?: string) {
    const alarm = store.alarms.find((a) => a.alarmId === alarmId);
    if (!alarm) return null;

    const oldState = alarm.state;
    alarm.state = 'ACTIVE_ACKNOWLEDGED';
    alarm.acknowledgedAt = new Date().toISOString();
    alarm.acknowledgedBy = `${user.role}: ${user.name}`;
    if (notes) alarm.notes = notes;

    const vessel = store.getVessel(alarm.vesselId);
    auditService.record({
      userId: user.userId,
      userName: user.name,
      userRole: user.role,
      action: 'ALARM_ACKNOWLEDGE',
      vesselId: alarm.vesselId,
      vesselName: vessel.name,
      targetEntity: `${alarm.alarmId} (${alarm.title})`,
      oldValue: oldState,
      newValue: 'ACTIVE_ACKNOWLEDGED',
      ipAddress: '192.168.1.100',
      details: notes || `Acknowledged alarm ${alarm.title}`,
    });

    this.syncVesselAlertCounts(alarm.vesselId);
    return alarm;
  }

  public resolveAlarm(alarmId: string, user: { userId: string; name: string; role: string }, notes?: string) {
    const alarm = store.alarms.find((a) => a.alarmId === alarmId);
    if (!alarm) return null;

    const oldState = alarm.state;
    alarm.state = 'RESOLVED';
    alarm.resolvedAt = new Date().toISOString();
    alarm.resolvedBy = `${user.role}: ${user.name}`;
    if (notes) alarm.notes = notes;

    const vessel = store.getVessel(alarm.vesselId);
    auditService.record({
      userId: user.userId,
      userName: user.name,
      userRole: user.role,
      action: 'ALARM_RESOLVE',
      vesselId: alarm.vesselId,
      vesselName: vessel.name,
      targetEntity: `${alarm.alarmId} (${alarm.title})`,
      oldValue: oldState,
      newValue: 'RESOLVED',
      ipAddress: '192.168.1.100',
      details: notes || `Resolved alarm ${alarm.title}`,
    });

    this.syncVesselAlertCounts(alarm.vesselId);
    return alarm;
  }

  private syncVesselAlertCounts(vesselId: string) {
    const vessel = store.vessels.find((v) => v.vesselId === vesselId);
    if (vessel) {
      const active = store.alarms.filter((a) => a.vesselId === vesselId && a.state !== 'RESOLVED');
      vessel.activeAlertsCount = active.length;
      vessel.criticalAlertsCount = active.filter((a) => a.severity === 'CRITICAL').length;
      if (vessel.status !== 'OFFLINE') {
        vessel.status = vessel.criticalAlertsCount > 0 ? 'CRITICAL' : vessel.activeAlertsCount > 0 ? 'WARNING' : 'ONLINE';
      }
    }
  }
}

export const alarmEngine = new AlarmEngine();
