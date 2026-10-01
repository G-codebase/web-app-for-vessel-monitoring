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
