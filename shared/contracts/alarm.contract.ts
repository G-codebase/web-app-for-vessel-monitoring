export type AlarmSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type AlarmLifecycleState =
  | 'ACTIVE_UNACKNOWLEDGED'
  | 'ACTIVE_ACKNOWLEDGED'
  | 'RESOLVED';

export type AlarmRuleType =
  | 'STATIC_HIGH'
  | 'STATIC_HIGH_HIGH'
  | 'STATIC_LOW'
  | 'STATIC_LOW_LOW'
  | 'RATE_OF_CHANGE'
  | 'COMMUNICATION_LOSS'
  | 'QUALITY_DEGRADATION';

export type AlarmEvent = {
  alarmId: string;
  vesselId: string;
  sensorId: string;
  locationId: string; // e.g. TANK-C05, MANIFOLD-P1
  subsystem: string;
  ruleType: AlarmRuleType;
  severity: AlarmSeverity;
  state: AlarmLifecycleState;
  title: string;
  message: string;
  currentValue: number;
  thresholdValue: number;
  unit: string;
  rateOfChange?: string; // e.g. "+3.6 mbar in 90s"
  raisedAt: string; // ISO UTC
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
};

export type AlarmSummaryStats = {
  criticalCount: number;
  warningCount: number;
  activeCount: number;
  acknowledgedCount: number;
};
