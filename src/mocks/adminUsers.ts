import { mockId } from '@/services/mockUtils';
import type { AppUser, UserCreatePayload, UserStatus, InvitationStatus } from '@/types/models/appUser';

const BRANCH_ID_TO_NAME: Record<string, string> = {
  'br-001': 'Banjara Hills',
  'br-002': 'Secunderabad',
  'br-003': 'Madhapur',
  'br-004': 'Kompally',
  'br-005': 'Mehdipatnam',
};

export const BRANCH_NAME_TO_ID: Record<string, string> = {
  'Banjara Hills': 'br-001',
  'Secunderabad':  'br-002',
  'Madhapur':      'br-003',
  'Kompally':      'br-004',
  'Mehdipatnam':   'br-005',
};

// Helper for active users (invitation accepted, setup complete, actively logging in)
type OnboardingFields = Pick<AppUser,
  'invitationStatus' | 'invitationSentAt' | 'passwordSetupCompletedAt' |
  'lastLoginAt' | 'failedLoginAttempts' | 'lockedUntil' | 'isActive'
>;
function active(invSentAt: string, setupAt: string, lastLogin: string): OnboardingFields {
  return { invitationStatus: 'accepted', invitationSentAt: invSentAt, passwordSetupCompletedAt: setupAt, lastLoginAt: lastLogin, failedLoginAttempts: 0, lockedUntil: null, isActive: true };
}

let store: AppUser[] = [
  { id: 'u-001', name: 'Narayana Rao',   email: 'narayana.rao@windxglass.in',   phone: '9876543200', role: 'super_admin',    branch: null,            status: 'Active',        ...active('2025-09-01T09:00:00Z', '2025-09-01T11:00:00Z', '2026-07-07T08:30:00Z') },
  { id: 'u-002', name: 'Ramesh Kumar',   email: 'ramesh.kumar@windxglass.in',   phone: '9876543201', role: 'branch_manager', branch: 'Banjara Hills', status: 'Active',        ...active('2025-09-01T09:00:00Z', '2025-09-01T11:30:00Z', '2026-07-07T09:15:00Z') },
  { id: 'u-003', name: 'Priya Sharma',   email: 'priya.sharma@windxglass.in',   phone: '9876543202', role: 'operator',       branch: 'Banjara Hills', status: 'Active',        ...active('2025-09-02T09:00:00Z', '2025-09-02T10:45:00Z', '2026-07-07T09:00:00Z') },
  { id: 'u-004', name: 'Arun Mehta',     email: 'arun.mehta@windxglass.in',     phone: '9876543203', role: 'technician',     branch: 'Banjara Hills', status: 'Active',        ...active('2025-09-02T09:00:00Z', '2025-09-02T11:00:00Z', '2026-07-06T17:30:00Z') },
  { id: 'u-005', name: 'Kiran Desai',    email: 'kiran.desai@windxglass.in',    phone: '9876543204', role: 'technician',     branch: 'Banjara Hills', status: 'Active',        ...active('2025-09-03T09:00:00Z', '2025-09-03T10:30:00Z', '2026-07-07T08:45:00Z') },
  { id: 'u-006', name: 'Deepak Rao',     email: 'deepak.rao@windxglass.in',     phone: '9876543205', role: 'technician',     branch: 'Madhapur',      status: 'Active',        ...active('2025-10-01T09:00:00Z', '2025-10-01T12:00:00Z', '2026-07-06T16:00:00Z') },
  {
    id: 'u-007', name: 'Sunita Verma', email: 'sunita.verma@windxglass.in', phone: '9876543206', role: 'operator', branch: 'Madhapur', status: 'Inactive',
    invitationStatus: 'accepted', invitationSentAt: '2025-10-01T09:00:00Z', passwordSetupCompletedAt: '2025-10-01T13:00:00Z',
    lastLoginAt: '2026-03-10T08:45:00Z', failedLoginAttempts: 0, lockedUntil: null, isActive: false,
  },
  { id: 'u-008', name: 'Anand Kumar',    email: 'anand.kumar@windxglass.in',    phone: '9876543207', role: 'branch_manager', branch: 'Secunderabad',  status: 'Active',        ...active('2025-09-01T09:00:00Z', '2025-09-01T12:00:00Z', '2026-07-07T08:00:00Z') },
  { id: 'u-009', name: 'Sundeep Reddy',  email: 'sundeep.reddy@windxglass.in',  phone: '9876543208', role: 'branch_manager', branch: 'Madhapur',      status: 'Active',        ...active('2025-09-01T09:00:00Z', '2025-09-01T11:15:00Z', '2026-07-07T09:30:00Z') },
  { id: 'u-010', name: 'Vijaya Lakshmi', email: 'vijaya.l@windxglass.in',       phone: '9876543209', role: 'branch_manager', branch: 'Kompally',      status: 'Active',        ...active('2025-09-05T09:00:00Z', '2025-09-05T10:30:00Z', '2026-07-05T10:00:00Z') },
  { id: 'u-011', name: 'Karthik Reddy',  email: 'karthik.reddy@windxglass.in',  phone: '9876543210', role: 'branch_manager', branch: 'Mehdipatnam',   status: 'Active',        ...active('2025-09-05T09:00:00Z', '2025-09-05T11:00:00Z', '2026-07-06T09:00:00Z') },
  { id: 'u-012', name: 'Meera Nair',     email: 'meera.nair@windxglass.in',     phone: '9876543211', role: 'operator',       branch: 'Secunderabad',  status: 'Active',        ...active('2025-11-01T09:00:00Z', '2025-11-01T10:45:00Z', '2026-07-07T09:00:00Z') },
  { id: 'u-013', name: 'Rajesh Varma',   email: 'rajesh.varma@windxglass.in',   phone: '9876543212', role: 'technician',     branch: 'Secunderabad',  status: 'Active',        ...active('2025-11-01T09:00:00Z', '2025-11-01T11:30:00Z', '2026-07-06T17:00:00Z') },
  { id: 'u-014', name: 'Suresh Babu',    email: 'suresh.babu@windxglass.in',    phone: '9876543213', role: 'technician',     branch: 'Kompally',      status: 'Active',        ...active('2025-11-15T09:00:00Z', '2025-11-15T10:30:00Z', '2026-07-05T16:30:00Z') },
  {
    id: 'u-015', name: 'Pooja Iyer', email: 'pooja.iyer@windxglass.in', phone: '9876543214', role: 'operator', branch: 'Mehdipatnam', status: 'Pending Setup',
    invitationStatus: 'sent', invitationSentAt: '2026-07-06T10:00:00Z', passwordSetupCompletedAt: null,
    lastLoginAt: null, failedLoginAttempts: 0, lockedUntil: null, isActive: false,
  },
];

export const userMock = {
  list: (): AppUser[] => [...store],

  create: (payload: UserCreatePayload): AppUser => {
    const branch = payload.branchId ? (BRANCH_ID_TO_NAME[payload.branchId] ?? null) : null;
    const user: AppUser = {
      id:                       mockId('u-'),
      name:                     payload.name,
      email:                    payload.email,
      phone:                    payload.phone,
      role:                     payload.role,
      branch,
      status:                   'Pending Setup',
      invitationStatus:         'pending',
      invitationSentAt:         null,
      passwordSetupCompletedAt: null,
      lastLoginAt:              null,
      failedLoginAttempts:      0,
      lockedUntil:              null,
      isActive:                 false,
    };
    store = [...store, user];
    return user;
  },

  updateStatus: (id: string, status: UserStatus): AppUser => {
    store = store.map((u) => (u.id === id ? { ...u, status } : u));
    const updated = store.find((u) => u.id === id);
    if (!updated) throw new Error(`User ${id} not found`);
    return updated;
  },

  findByIdentifier: (identifier: string): AppUser | undefined => {
    const q = identifier.trim().toLowerCase();
    return store.find((u) => u.email.toLowerCase() === q || u.phone === q);
  },

  resendInvite: (id: string): AppUser => {
    const now = new Date().toISOString();
    store = store.map((u) =>
      u.id === id
        ? { ...u, invitationStatus: 'sent' as InvitationStatus, invitationSentAt: now }
        : u,
    );
    const updated = store.find((u) => u.id === id);
    if (!updated) throw new Error(`User ${id} not found`);
    return updated;
  },
};
