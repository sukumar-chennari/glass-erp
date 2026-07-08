/**
 * HTTP auth adapter — production implementation.
 *
 * ACTIVATION: Change the one import in src/services/auth/index.ts:
 *   import { authServiceHttp as authService } from './http';
 *
 * Auth uses a plain fetch wrapper (not RTK Query) because:
 *   1. Session rehydration (getSession) runs before React mounts.
 *   2. Auth manages the token that RTK Query's baseApi reads.
 *   3. The 401 interceptor must call authService.logout() — circular
 *      if auth were inside RTK Query.
 */

import type {
  AuthService, Session, LoginCredentials, ResetPasswordOptions,
  VerifyOtpOptions, BackendAuthResponse, OtpSendResult,
} from './types';
import { AuthError } from './types';
import type { AuthErrorCode } from './types';

// ─────────────────────────────────────────────────────────────────────────────
//  BACKEND CONTRACT
// ─────────────────────────────────────────────────────────────────────────────
//
//  POST /api/v1/auth/login/email
//    Body:    { email: string, password: string }
//    200:     BackendAuthResponse  { accessToken, user: BackendUser, tenant }
//    400/401: ApiErrorResponse     { statusCode, message, path, timestamp }
//
//  POST /api/v1/auth/otp/send
//    Body:    { phone: string }
//    200:     { otpToken: string, message?: string }
//    400:     ApiErrorResponse
//
//  POST /api/v1/auth/otp/verify
//    Body:    { otpToken: string, otp: string }
//    200:     BackendAuthResponse  { accessToken, user: BackendUser, tenant }
//    400/401: ApiErrorResponse
//
//  POST /api/v1/auth/logout
//    Auth:    Bearer <accessToken>
//    204:     (no body)
//
//  POST /api/v1/auth/forgot-password
//    Body:    { email: string }
//    200:     (always; never reveals whether email is registered)
//
//  POST /api/v1/auth/reset-password
//    Body:    { token, password, type: 'setup'|'reset' }
//    204:     success
//    400:     ApiErrorResponse  (message includes TOKEN_INVALID / TOKEN_EXPIRED)
//
//  POST /api/v1/auth/resend-otp
//    Body:    { otpToken: string }
//    200:     (best-effort; errors ignored by caller)
//
//  ── NOT YET ACTIVE ───────────────────────────────────────────────────────────
//
//  GET /api/v1/auth/me
//    Auth:    Bearer <accessToken>
//    200:     BackendAuthResponse
//    → Activate in getSession() when backend confirms availability.
//
//  POST /api/v1/auth/refresh
//    Cookie:  httpOnly refresh token
//    200:     BackendAuthResponse
//    → Activate in getSession() alongside /auth/me.
//
//  ── BACKEND ROLE MAPPING ─────────────────────────────────────────────────────
//
//  Backend role   Frontend UserRole
//  SUPER_ADMIN  → super_admin
//  ADMIN        → branch_manager
//  OPERATOR     → operator
//  TECHNICIAN   → technician
//
// ─────────────────────────────────────────────────────────────────────────────

// Exported so AuthContext can store/read sessions after RTK mutations complete.
export const SESSION_KEY = 'erp-session-v1';
export const TOKEN_KEY   = 'glass_erp_token';

// ── Role mapping ──────────────────────────────────────────────────────────────

const ROLE_MAP: Record<string, Session['role']> = {
  // Backend uppercase enums
  SUPER_ADMIN:    'super_admin',
  ADMIN:          'branch_manager',
  OPERATOR:       'operator',
  TECHNICIAN:     'technician',
  // Pass-through: frontend values (stored sessions, mock responses)
  super_admin:    'super_admin',
  branch_manager: 'branch_manager',
  operator:       'operator',
  technician:     'technician',
};

function mapRole(raw: unknown): Session['role'] {
  return ROLE_MAP[raw as string] ?? 'operator';
}

function derivePermissions(role: Session['role']): string[] {
  switch (role) {
    case 'super_admin':
      return ['users:read', 'users:write', 'branches:read', 'branches:write', 'reports:read'];
    case 'branch_manager':
      return [
        'jobs:read', 'jobs:write', 'invoices:read', 'invoices:write',
        'claims:read', 'claims:write', 'customers:read', 'customers:write',
        'technicians:read', 'technicians:write', 'vendors:read', 'vendors:write',
        'products:read', 'products:write', 'stock:read', 'stock:write', 'reports:read',
      ];
    case 'operator':
      return [
        'jobs:read', 'jobs:write', 'invoices:read', 'invoices:write',
        'claims:read', 'claims:write', 'customers:read', 'customers:write', 'stock:read',
      ];
    case 'technician':
      return ['jobs:read', 'jobs:write', 'customers:read'];
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? '/api';
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY);
  return fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

function mapStatusToCode(status: number, body: Record<string, unknown>): AuthErrorCode {
  // Explicit code field takes priority (legacy shape)
  if (typeof body.code === 'string') return body.code as AuthErrorCode;
  const msg = ((body.message ?? '') as string).toUpperCase();
  if (status === 429 || msg.includes('LOCKED'))       return 'ACCOUNT_LOCKED';
  if (msg.includes('INACTIVE'))                        return 'ACCOUNT_INACTIVE';
  if (msg.includes('PENDING_SETUP'))                   return 'ACCOUNT_PENDING_SETUP';
  if (msg.includes('TOKEN_EXPIRED') || msg.includes('EXPIRED')) return 'TOKEN_EXPIRED';
  if (msg.includes('TOKEN_INVALID'))                   return 'TOKEN_INVALID';
  if (status === 401)                                  return 'INVALID_CREDENTIALS';
  if (status === 403)                                  return 'ACCOUNT_INACTIVE';
  return 'UNKNOWN';
}

async function throwAuthError(res: Response): Promise<never> {
  let body: Record<string, unknown> = {};
  try { body = await res.json(); } catch { /* ignore */ }
  const code      = mapStatusToCode(res.status, body);
  const lockUntil = typeof body.lockUntil === 'string' ? body.lockUntil : undefined;
  throw new AuthError(code, body.message as string | undefined, lockUntil);
}

export function storeAuth(token: string, session: Session): void {
  localStorage.setItem(TOKEN_KEY,   token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Maps a backend auth response to the canonical frontend Session.
 *
 * Handles the new shape  { accessToken, user: { role, branch }, tenant }
 * as well as stored Session objects  { role (frontend), tenantId, branch, ... }
 * so the same function works for both login responses and cached session reads.
 */
export function mapSession(raw: Record<string, unknown>): Session {
  const user   = (raw.user   ?? {}) as Record<string, unknown>;
  const tenant = (raw.tenant ?? null) as { id: string; name: string } | null;
  const role   = mapRole(user.role ?? raw.role);

  // Branch may be in user (new backend shape) or at root (legacy / stored session)
  const branchRaw = ((user.branch ?? raw.branch) ?? null) as { id: string; name: string } | null;

  return {
    user: {
      id:     (user.id   ?? '') as string,
      name:   (user.name ?? '') as string,
      email:  (user.email ?? '') as string,
      mobile: (user.phone ?? user.mobile) as string | undefined,
      isActive: (user.is_active ?? user.isActive ?? true) as boolean,
      // Operator / Technician authenticate via phone OTP — no password setup step.
      passwordSetupComplete: (role === 'operator' || role === 'technician')
        ? true
        : ((user.password_setup_complete ?? user.passwordSetupComplete ?? true) as boolean),
    },
    role,
    tenantId:   tenant ? tenant.id   : ((raw.tenant_id   ?? raw.tenantId   ?? '') as string),
    tenantName: tenant ? tenant.name : ((raw.tenant_name ?? raw.tenantName ?? '') as string),
    branch:     branchRaw ? { id: branchRaw.id, name: branchRaw.name } : null,
    permissions: ((raw.permissions ?? user.permissions) as string[] | undefined)
      ?? derivePermissions(role),
  };
}

// ── Adapter ───────────────────────────────────────────────────────────────────

export const authServiceHttp: AuthService = {

  async login({ identifier: email, password }: LoginCredentials): Promise<Session> {
    const res = await apiFetch('/auth/login/email', {
      method: 'POST',
      body:   JSON.stringify({ email, password }),
    });
    if (!res.ok) return throwAuthError(res);
    const data = await res.json() as BackendAuthResponse;
    const session = mapSession(data as unknown as Record<string, unknown>);
    storeAuth(data.accessToken, session);
    return session;
  },

  async sendOtp(phone: string): Promise<OtpSendResult> {
    const res = await apiFetch('/auth/otp/send', {
      method: 'POST',
      body:   JSON.stringify({ phone }),
    });
    if (!res.ok) return throwAuthError(res);
    return await res.json() as OtpSendResult;
  },

  async verifyOtp({ otpToken, otp }: VerifyOtpOptions): Promise<Session> {
    const res = await apiFetch('/auth/otp/verify', {
      method: 'POST',
      body:   JSON.stringify({ otpToken, otp }),
    });
    if (!res.ok) return throwAuthError(res);
    const data = await res.json() as BackendAuthResponse;
    const session = mapSession(data as unknown as Record<string, unknown>);
    storeAuth(data.accessToken, session);
    return session;
  },

  async logout(): Promise<void> {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      clearAuth(); // always clear locally, even if the server call fails
    }
  },

  async getSession(): Promise<Session | null> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    // /auth/me and /auth/refresh are not yet active on backend.
    // For now, serve the cached session from localStorage.
    // When me/refresh are ready, replace this block with the two-phase
    // bootstrap below (uncomment and remove the early return).
    const cached = localStorage.getItem(SESSION_KEY);
    if (!cached) return null;
    try {
      const raw = JSON.parse(cached) as Record<string, unknown>;
      if (raw && typeof raw.user === 'object') return mapSession(raw);
    } catch { /* ignore */ }
    clearAuth();
    return null;

    // ── ACTIVATE when /auth/me + /auth/refresh are live ──────────────────────
    // try {
    //   const res = await apiFetch('/auth/me');
    //   if (res.ok) {
    //     const data = await res.json() as BackendAuthResponse;
    //     const session = mapSession(data as unknown as Record<string, unknown>);
    //     storeAuth(data.accessToken, session);
    //     return session;
    //   }
    //   if (res.status !== 401) { clearAuth(); return null; }
    // } catch { return null; }
    // try {
    //   const refreshRes = await fetch(`${getBaseUrl()}/auth/refresh`, {
    //     method: 'POST', credentials: 'include',
    //     headers: { 'Content-Type': 'application/json' },
    //   });
    //   if (!refreshRes.ok) { clearAuth(); return null; }
    //   const data = await refreshRes.json() as BackendAuthResponse;
    //   const session = mapSession(data as unknown as Record<string, unknown>);
    //   storeAuth(data.accessToken, session);
    //   return session;
    // } catch { clearAuth(); return null; }
  },

  async requestPasswordReset(email: string): Promise<void> {
    await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body:   JSON.stringify({ email }),
    });
    // Intentionally ignore non-2xx — never reveal whether email is registered.
  },

  async resetPassword({ token, password, type }: ResetPasswordOptions): Promise<void> {
    const res = await apiFetch('/auth/reset-password', {
      method: 'POST',
      body:   JSON.stringify({ token, password, type }),
    });
    if (!res.ok) return throwAuthError(res);
  },

  async resendOtp(otpToken: string): Promise<void> {
    await apiFetch('/auth/resend-otp', {
      method: 'POST',
      body:   JSON.stringify({ otpToken }),
    });
    // Best-effort — ignore errors; user can request again.
  },
};
