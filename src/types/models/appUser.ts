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
// frontend role → backend role mapping is intentionally partial:
//   technician    → TECHNICIAN  (confirmed 1:1)
//   operator      → unconfirmed (FRONTOFFICE is plausible but not verified)
//   branch_manager→ no confirmed backend equivalent
//   super_admin   → not applicable to staff creation
export type BackendStaffRole = 'FRONTOFFICE' | 'TECHNICIAN';

export const FRONTEND_TO_BACKEND_ROLE: Partial<Record<AppRole, BackendStaffRole>> = {
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

export interface UserCreatePayload {
  name:     string;
  email:    string;
  phone:    string;
  role:     AppRole;
  branchId: string | null;
}

export interface UserUpdateStatusPayload {
  id:     string;
  status: UserStatus;
}
