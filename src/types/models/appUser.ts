export type AppRole        = 'super_admin' | 'branch_manager' | 'operator' | 'technician';
export type UserStatus     = 'Active' | 'Inactive' | 'Pending Setup';
export type InvitationStatus = 'pending' | 'sent' | 'accepted' | 'expired';

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
