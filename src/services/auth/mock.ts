/**
 * Mock auth adapter — localStorage-backed, no HTTP requests.
 *
 * Used when VITE_USE_MOCK_API=true (or during local dev).
 * Activated via the single-line swap in src/services/auth/index.ts.
 * This file is never imported directly by components.
 *
 * ── Mock env vars ─────────────────────────────────────────────────────────────
 *
 *   VITE_MOCK_ROLE=branch_manager   Role for the mock session (default: branch_manager).
 *                                   Values: super_admin | branch_manager | operator | technician
 *
 *   VITE_MOCK_SKIP_OTP=true         Skip the OTP step entirely (default: false).
 *                                   Useful for rapid UI dev — but the OTP flow is the
 *                                   business-required path, so default is OTP-required.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { MOCK_DELAY } from '@/services/mockUtils';
import { AuthError } from './types';
import type { AuthService, LoginCredentials, ResetPasswordOptions, VerifyOtpOptions, Session, UserRole } from './types';

// Keys must stay in sync with http.ts and baseApi.prepareHeaders.
// Key version is bumped when the Session interface has a breaking change
// so stale localStorage sessions are auto-cleared on next visit.
const SESSION_KEY         = 'erp-session-v2';
const TOKEN_KEY           = 'glass_erp_token';
const PENDING_SESSION_KEY = 'erp-pending-otp-session'; // sessionStorage: cleared on tab close

// ── Env config ────────────────────────────────────────────────────────────────

const VALID_ROLES: UserRole[] = ['super_admin', 'branch_manager', 'operator', 'technician'];
const MOCK_ROLE    = VALID_ROLES.includes(import.meta.env.VITE_MOCK_ROLE as UserRole)
  ? (import.meta.env.VITE_MOCK_ROLE as UserRole)
  : 'branch_manager';
const SKIP_OTP     = import.meta.env.VITE_MOCK_SKIP_OTP === 'true';

// Opaque token used only in mock mode to verify the OTP challenge is genuine.
const MOCK_OTP_TOKEN = 'mock-otp-session-token';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ── Shape guard ────────────────────────────────────────────────────────────────

function isValidSession(data: unknown): data is Session {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.tenantId   === 'string' &&
    typeof d.tenantName === 'string' &&
    typeof d.role       === 'string' &&
    d.user !== null &&
    typeof d.user === 'object' &&
    typeof (d.user as Record<string, unknown>).id   === 'string' &&
    typeof (d.user as Record<string, unknown>).name === 'string'
  );
}

// ── Mock session factory ───────────────────────────────────────────────────────

function buildMockSession(identifier: string): Session {
  const isEmail = identifier.includes('@');
  return {
    user: {
      id:     'mock-user-1',
      name:   isEmail ? identifier.split('@')[0] : 'ERP User',
      email:  isEmail ? identifier : `${identifier}@windx.local`,
      mobile: isEmail ? undefined : identifier,
    },
    role:       MOCK_ROLE,
    tenantId:   'tenant-001',
    tenantName: 'WindX Glass ERP',
    // super_admin has no branch scope; all others are scoped to a branch
    branch: MOCK_ROLE === 'super_admin'
      ? null
      : { id: 'branch-001', name: 'Main Branch' },
    permissions: mockPermissions(MOCK_ROLE),
  };
}

function mockPermissions(role: UserRole): string[] {
  switch (role) {
    case 'super_admin':
      return ['users:read', 'users:write', 'branches:read', 'branches:write', 'reports:read'];
    case 'branch_manager':
      return [
        'jobs:read', 'jobs:write',
        'invoices:read', 'invoices:write',
        'claims:read', 'claims:write',
        'customers:read', 'customers:write',
        'technicians:read', 'technicians:write',
        'vendors:read', 'vendors:write',
        'products:read', 'products:write',
        'stock:read', 'stock:write',
        'reports:read',
      ];
    case 'operator':
      return [
        'jobs:read', 'jobs:write',
        'invoices:read', 'invoices:write',
        'claims:read', 'claims:write',
        'customers:read', 'customers:write',
        'stock:read',
      ];
    case 'technician':
      return ['jobs:read', 'jobs:write', 'customers:read'];
  }
}

// ── Adapter ───────────────────────────────────────────────────────────────────

export const authServiceMock: AuthService = {

  async login({ identifier }: LoginCredentials): Promise<Session> {
    await delay(MOCK_DELAY);
    const session = buildMockSession(identifier);

    if (!SKIP_OTP) {
      // OTP is required after password auth per WindX business rules.
      // Store the pending session in sessionStorage so verifyOtp can finalise it.
      // In mock mode any 6-digit code is accepted.
      // To skip for rapid UI dev: VITE_MOCK_SKIP_OTP=true
      sessionStorage.setItem(PENDING_SESSION_KEY, JSON.stringify(session));
      throw new AuthError('OTP_REQUIRED', undefined, undefined, MOCK_OTP_TOKEN);
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(TOKEN_KEY, `mock-jwt-${session.user.id}`);
    return session;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(PENDING_SESSION_KEY);
  },

  async getSession(): Promise<Session | null> {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (!stored) return null;
      const parsed: unknown = JSON.parse(stored);
      if (isValidSession(parsed)) return parsed;
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  },

  async requestPasswordReset(_email: string): Promise<void> {
    await delay(MOCK_DELAY);
    // Mock: always succeeds — never reveals whether the email exists.
  },

  async resetPassword(_opts: ResetPasswordOptions): Promise<void> {
    await delay(MOCK_DELAY);
    // Mock: always succeeds with any token + valid passwords.
  },

  async verifyOtp({ otpToken, otp }: VerifyOtpOptions): Promise<Session> {
    await delay(MOCK_DELAY);

    if (otpToken !== MOCK_OTP_TOKEN) {
      throw new AuthError('TOKEN_INVALID');
    }
    // Any 6-digit code is accepted in mock mode
    if (!otp || otp.length < 6) {
      throw new AuthError('INVALID_CREDENTIALS', 'Enter a valid 6-digit code');
    }

    // Retrieve the pending session stored during login
    const raw     = sessionStorage.getItem(PENDING_SESSION_KEY);
    const session: Session = raw && isValidSession(JSON.parse(raw))
      ? (JSON.parse(raw) as Session)
      : buildMockSession('otp-verified@windx.local');

    sessionStorage.removeItem(PENDING_SESSION_KEY);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(TOKEN_KEY, `mock-jwt-${session.user.id}`);
    return session;
  },

  async resendOtp(otpToken: string): Promise<void> {
    await delay(MOCK_DELAY);
    if (otpToken !== MOCK_OTP_TOKEN) {
      throw new AuthError('TOKEN_INVALID');
    }
    // Mock: always succeeds.
  },
};
