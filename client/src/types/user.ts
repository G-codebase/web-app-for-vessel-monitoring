export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'TESTER_ADMIN'
  | 'OPERATOR'
  | 'VIEWER'
  | 'FLEET_MANAGER'
  | 'VESSEL_OPERATOR'
  | 'CHIEF_ENGINEER'
  | 'AUDITOR';

export type UserProfile = {
  id?: string;
  userId: string;
  username?: string;
  name: string;
  role: string;
  roles?: string[];
  permissions?: string[];
  rank?: string;
  email: string;
  assignedVessels?: { vesselId: string; name: string; level: string }[];
  isSuperOrAdmin?: boolean;
};

export const AVAILABLE_USERS: UserProfile[] = [
  {
    userId: 'USR-TESTER',
    name: 'Tester Administrator',
    role: 'TESTER_ADMIN',
    roles: ['TESTER_ADMIN'],
    permissions: ['*'],
    rank: 'Platform Security Lead',
    email: 'tester.admin@sjvmarine.com',
    isSuperOrAdmin: true,
  },
  {
    userId: 'USR-OP01',
    name: 'Deck Operator',
    role: 'OPERATOR',
    roles: ['OPERATOR'],
    rank: 'Chief Officer',
    email: 'operator@sjvmarine.com',
  },
];
