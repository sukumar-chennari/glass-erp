export type AppRole        = 'super_admin' | 'branch_manager' | 'operator' | 'technician';
export type UserStatus     = 'Active' | 'Inactive' | 'Pending Setup';
export type InvitationStatus = 'pending' | 'sent' | 'accepted' | 'expired';

// Paginated envelope from GET /api/v1/staff — same shape as BranchListResponse.
// Item field names within data[] cannot yet be verified: backend list is empty.
// Field-level AppUser mapping is deferred until backend has real staff records.
export interface StaffListResponse {
  data:  AppUser[];
  total: number;
  page:  number;
  limit: number;
}

// Role values accepted by POST /api/v1/staff (confirmed via validation response).
export type BackendStaffRole = 'FRONTOFFICE' | 'TECHNICIAN';

export const FRONTEND_TO_BACKEND_ROLE: Partial<Record<AppRole, BackendStaffRole>> = {
  operator:   'FRONTOFFICE',
  technician: 'TECHNICIAN',
};

export interface AppUser {
  id:     string;
  name:   string;
  email:  string;
  phone:  string;
  role:   AppRole;
  branch: string | null;
  status: UserStatus;
  // ── Onboarding & security fields ──────────────────────────────────────────
  invitationStatus:         InvitationStatus;
  invitationSentAt:         string | null;  // ISO timestamp
  passwordSetupCompletedAt: string | null;  // ISO timestamp
  lastLoginAt:              string | null;  // ISO timestamp
  failedLoginAttempts:      number;
  lockedUntil:              string | null;  // ISO timestamp; null = not locked
  isActive:                 boolean;
}

// Payload for POST /api/v1/staff when called by ADMIN (branch_manager).
// Branch is inferred from the session — must NOT be sent in the body.
export interface StaffCreatePayload {
  name:  string;
  phone: string;
  role:  BackendStaffRole;
}

// Payload for PATCH /api/v1/staff/:id — confirmed live contract.
// Only name and isActive are editable; phone, role, and branch are immutable.
// id is used to construct the URL and must NOT be included in the request body.
export interface StaffUpdatePayload {
  id:       string;
  name:     string;
  isActive: boolean;
}

export interface UserCreatePayload {
  name:     string;
  email:    string;
  phone:    string;
  role:     AppRole;
  branchId: string | null;
}

// Payload for POST /api/v1/staff when called by SUPER_ADMIN.
// branchId must be provided explicitly (unlike branch_manager scope where it's session-inferred).
export interface SuperAdminStaffCreatePayload {
  name:     string;
  phone:    string;
  role:     BackendStaffRole;
  branchId: string;
}
