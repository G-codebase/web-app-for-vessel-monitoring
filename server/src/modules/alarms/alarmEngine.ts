import { store, StoredAlarm } from '../../database/inMemoryStore.js';
import { auditService } from '../audit/auditService.js';

export class AlarmEngine {
  private recentPressureHistory: { tankId: string; timestamp: number; pressure: number }[] = [];

  public checkRateOfChange(tankId: string, currentPressure: number): StoredAlarm | null {
    const now = Date.now();
    this.recentPressureHistory.push({ tankId, timestamp: now, pressure: currentPressure });
    // Keep last 120 seconds
    this.recentPressureHistory = this.recentPressureHistory.filter(
      (h) => now - h.timestamp <= 120000
    );

    // Look for records around 90 seconds ago (between 60s and 100s)
    const pastRecords = this.recentPressureHistory.filter(
      (h) => h.tankId === tankId && now - h.timestamp >= 60000
    );

    if (pastRecords.length > 0) {
      const oldest = pastRecords[0];
      const deltaP = currentPressure - oldest.pressure;
      const deltaTimeSec = Math.round((now - oldest.timestamp) / 1000);

      // Trigger if delta > 3.0 mbar within 90s
      if (deltaP >= 3.0) {
        const existing = store.alarms.find(
          (a) => a.locationId === tankId && a.ruleType === 'RATE_OF_CHANGE' && a.state !== 'RESOLVED'
        );

        if (!existing) {
          const newAlarm: StoredAlarm = {
            alarmId: `AL-${Date.now().toString().slice(-4)}`,
            vesselId: 'VESSEL-001',
            sensorId: `SENS-${tankId}-PRESS-ULLAGE`,
            locationId: tankId,
            subsystem: 'CARGO',
            ruleType: 'RATE_OF_CHANGE',
            severity: 'CRITICAL',
            state: 'ACTIVE_UNACKNOWLEDGED',
            title: `RATE-OF-CHANGE: ${tankId} Rapid Pressure Surge`,
            message: `Pressure surged by +${deltaP.toFixed(1)} mbar within ${deltaTimeSec}s (${oldest.pressure.toFixed(1)} → ${currentPressure.toFixed(1)} mbar)`,
            currentValue: currentPressure,
            thresholdValue: 3.0,
            unit: 'mbar',
            rateOfChange: `+${deltaP.toFixed(1)} mbar in ${deltaTimeSec}s`,
            raisedAt: new Date().toISOString(),
          };
          store.alarms.unshift(newAlarm);
          return newAlarm;
        }
      }
    }
    return null;
  }

  public getAlarms(vesselId?: string) {
    if (vesselId) {
      return store.alarms.filter((a) => a.vesselId === vesselId);
    }
    return store.alarms;
  }

  public getSummaryStats() {
    const active = store.alarms.filter((a) => a.state !== 'RESOLVED');
    const critical = active.filter((a) => a.severity === 'CRITICAL');
    const warning = active.filter((a) => a.severity === 'WARNING');
    const acknowledged = store.alarms.filter((a) => a.state === 'ACTIVE_ACKNOWLEDGED');

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

    auditService.record({
      userId: user.userId,
      userName: user.name,
      userRole: user.role as any,
      action: 'ALARM_ACKNOWLEDGE',
      vesselId: alarm.vesselId,
      vesselName: 'MT Ocean Star',
      targetEntity: `${alarm.alarmId} (${alarm.title})`,
      oldValue: oldState,
      newValue: 'ACTIVE_ACKNOWLEDGED',
      ipAddress: '192.168.1.100',
      details: notes || `Acknowledged alarm ${alarm.title}`,
    });

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

    auditService.record({
      userId: user.userId,
      userName: user.name,
      userRole: user.role as any,
      action: 'ALARM_RESOLVE',
      vesselId: alarm.vesselId,
      vesselName: 'MT Ocean Star',
      targetEntity: `${alarm.alarmId} (${alarm.title})`,
      oldValue: oldState,
      newValue: 'RESOLVED',
      ipAddress: '192.168.1.100',
      details: notes || `Resolved alarm ${alarm.title}`,
    });

    return alarm;
  }
}

export const alarmEngine = new AlarmEngine();
