export type UserRole =
  | 'SUPER_ADMIN'
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

export type AuditEvent = {
  eventId: string;
  timestamp: string; // ISO UTC
  userId: string;
  userName: string;
  userRole: UserRole;
  action:
    | 'ALARM_ACKNOWLEDGE'
    | 'ALARM_RESOLVE'
    | 'THRESHOLD_UPDATE'
    | 'CARGO_TRANSFER_START'
    | 'CARGO_TRANSFER_STOP'
    | 'USER_LOGIN'
    | 'USER_ROLE_SWITCH'
    | 'REPORT_GENERATION';
  vesselId: string;
  vesselName: string;
  targetEntity: string; // e.g. TANK-C05 / Alarm-AL-102 / Rule-P-HIGH
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  details: string;
};
