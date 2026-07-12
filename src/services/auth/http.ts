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
//    200:     BackendAuthResponse  { accessToken, user: BackendUser, branch }
//             Refresh token → HttpOnly cookie (Set-Cookie), NOT in body.
//    400/401: ApiErrorResponse     { statusCode, message, path, timestamp }
//
//  POST /api/v1/auth/otp/send
//    Body:    { phone: string }
//    200:     { otpToken: string, message?: string }
//    400:     ApiErrorResponse
//
//  POST /api/v1/auth/otp/verify
//    Body:    { otpToken: string, otp: string }
//    200:     BackendAuthResponse  { accessToken, user: BackendUser, branch }
//             Refresh token → HttpOnly cookie (Set-Cookie), NOT in body.
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
//  GET /api/v1/auth/me                               [ACTIVE — Phase 13B.8]
//    Auth:    Bearer <accessToken>
//    200:     BackendAuthResponse
//    → Bootstrap call; on 401, falls through to /auth/refresh.
//
//  POST /api/v1/auth/refresh                          [ACTIVE — Phase 13B.8]
//    Cookie:  httpOnly refresh token (credentials:'include')
//    200:     BackendAuthResponse  (new accessToken; backend rotates cookie)
//    → Called by getSession() after /auth/me 401 and by tryRefreshToken() in baseApi.ts.
//
//  ── AUTH LIFECYCLE — verified Phase 13B.9 ────────────────────────────────────
//
//  Bootstrap (app start):
//    /auth/me 200  → authenticated (token stored in memory)
//    /auth/me 401  → /auth/refresh 200 → authenticated (silent refresh)
//    /auth/me 401  → /auth/refresh non-2xx → clearAuth() → /login
//    network error → null → /login (clearAuth not called — may be transient)
//
//  Mid-session 401 (RTK Query, baseApi.ts):
//    tryRefreshToken() mutex → single /auth/refresh even if multiple concurrent 401s
//    refresh 200 → retry original request with new in-memory token
//    refresh fails → forceLogout() → /login?reason=session_expired
//
//  403 (deactivated account): forceLogout() immediately — refresh cannot recover.
//
//  Logout: clearAuth() (sync, clears memory) + POST /auth/logout (async, expires cookie)
//
//  Backend dependencies (all require CORS Access-Control-Allow-Credentials: true):
//    GET  /auth/me      — BackendAuthResponse for valid bearer token
//    POST /auth/refresh — BackendAuthResponse + rotates HttpOnly cookie
//    POST /auth/logout  — expires refresh cookie (Set-Cookie; Max-Age=0)
//
//  StrictMode note: React 18 StrictMode double-invokes useEffect in dev mode,
//  so /auth/me and /auth/refresh each run twice on load. Production: once each.
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

// Kept for clearAuth() cleanup of pre-13B.8 localStorage entries.
export const SESSION_KEY = 'erp-session-v1';
export const TOKEN_KEY   = 'glass_erp_token';

// ── In-memory token store ──────────────────────────────────────────────────
// Both tokens live in module variables only — never written to persistent storage.
// accessToken: read by prepareHeaders on every RTK Query request.
// refreshToken: sent as { refreshToken } in POST /auth/refresh body.
//   Falls back to the HttpOnly cookie when not yet in memory (page reload / first load).
let _accessToken:  string | null = null;
let _refreshToken: string | null = null;
export const getToken          = (): string | null => _accessToken;
export const setToken          = (t: string): void => { _accessToken = t; };
export const clearToken        = (): void          => { _accessToken = null; };
export const getRefreshToken   = (): string | null => _refreshToken;
export const setRefreshToken   = (t: string): void => { _refreshToken = t; };
export const clearRefreshToken = (): void          => { _refreshToken = null; };

// ── Session-refresh notification bridge ────────────────────────────────────
// baseApi.ts lives outside React and cannot call setSession() directly.
// AuthContext registers a listener here on mount; tryRefreshToken() fires it
// after a successful mid-session silent refresh so React session state stays
// in sync with the rotated accessToken and fresh user/branch payload.
type SessionRefreshCallback = (session: Session) => void;
let _sessionRefreshCallback: SessionRefreshCallback | null = null;
export const onSessionRefreshed     = (cb: SessionRefreshCallback | null): void => { _sessionRefreshCallback = cb; };
export const notifySessionRefreshed = (session: Session): void => { _sessionRefreshCallback?.(session); };

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
  const token = getToken();
  return fetch(`${getBaseUrl()}${path}`, {
    ...init,
    // credentials: 'include' is required so the browser sends the HttpOnly
    // refresh-token cookie on every auth request. This also allows the backend
    // to rotate the cookie on POST /auth/refresh without extra frontend work.
    credentials: 'include',
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

// ── MIGRATION NOTES ───────────────────────────────────────────────────────────
//
// 13B.7 — Refresh token moved to HttpOnly cookie:
//   - REFRESH_TOKEN_KEY / glass_erp_refresh_token localStorage entry removed
//   - Backend sets refresh token via Set-Cookie (HttpOnly; Secure; SameSite=Strict)
//
// 13B.8 — Access token moved to module memory (/auth/me activated):
//   - TOKEN_KEY / glass_erp_token no longer written to localStorage
//   - storeAuth() stores the access token in _accessToken (module variable) only
//   - clearAuth() removes pre-13B.8 localStorage entries as cleanup
//   - getSession() bootstraps via GET /auth/me → POST /auth/refresh
//   - baseApi.ts tryRefreshToken() handles mid-session 401s silently
//
// Current — refresh token also stored in memory + sent as body:
//   - storeAuth() accepts refreshToken and stores it in _refreshToken
//   - POST /auth/refresh sends { refreshToken } in body when available in memory
//   - Falls back to HttpOnly cookie only (no body) on first load / after page reload
//   - _refreshToken is rotated on each successful refresh response
//
// No persistent auth storage remains in the browser after logout.
//
// ─────────────────────────────────────────────────────────────────────────────

export function storeAuth(accessToken: string, _session: Session, refreshToken?: string): void {
  setToken(accessToken);
  if (refreshToken) setRefreshToken(refreshToken);
}

export function clearAuth(): void {
  clearToken();
  clearRefreshToken();
  localStorage.removeItem(SESSION_KEY);  // cleanup of pre-13B.8 cached sessions
  localStorage.removeItem(TOKEN_KEY);    // cleanup of pre-13B.8 stored access tokens
}

/**
 * Maps a backend auth response to the canonical frontend Session.
 * Handles the live /auth/me and login shapes { accessToken, user, branch }.
 * Also accepts legacy localStorage-cached objects { role, branch, user, ... }
 * from pre-13B.8 sessions for backward-compatible reads.
 */
export function mapSession(raw: Record<string, unknown>): Session {
  const user = (raw.user ?? {}) as Record<string, unknown>;
  const role = mapRole(user.role ?? raw.role);

  // Branch may be at response root (live login) or cached directly in the stored session.
  const branchRaw = ((raw.branch ?? user.branch) ?? null) as { id: string; name: string } | null;

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
    branch:      branchRaw ? { id: branchRaw.id, name: branchRaw.name } : null,
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
    storeAuth(data.accessToken, session, data.refreshToken);
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
    storeAuth(data.accessToken, session, data.refreshToken);
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
    // Bootstrap via the server. The HttpOnly refresh cookie is sent automatically
    // because apiFetch uses credentials:'include'.
    try {
      const res = await apiFetch('/auth/me');
      if (res.ok) {
        const data = await res.json() as BackendAuthResponse;
        const session = mapSession(data as unknown as Record<string, unknown>);
        storeAuth(data.accessToken, session);
        return session;
      }
      // Non-401 (server error, network issue) — don't clear local state, just bail.
      if (res.status !== 401) return null;
    } catch { return null; }
    // /auth/me returned 401 — access token expired; attempt silent refresh.
    try {
      const rt = getRefreshToken();
      const refreshRes = await apiFetch('/auth/refresh', {
        method: 'POST',
        body:   JSON.stringify(rt ? { refreshToken: rt } : {}),
      });
      if (!refreshRes.ok) { clearAuth(); return null; }
      const data = await refreshRes.json() as BackendAuthResponse;
      const session = mapSession(data as unknown as Record<string, unknown>);
      storeAuth(data.accessToken, session, data.refreshToken);
      return session;
    } catch { clearAuth(); return null; }
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
