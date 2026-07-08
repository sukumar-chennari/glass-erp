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

import type { AuthService, Session, LoginCredentials, ResetPasswordOptions, VerifyOtpOptions } from './types';
import { AuthError } from './types';
import type { AuthErrorCode } from './types';

// ─────────────────────────────────────────────────────────────────────────────
//  BACKEND CONTRACT
// ─────────────────────────────────────────────────────────────────────────────
//
//  POST /api/auth/login
//    Body:    { identifier: string, password: string }
//    200:     { token: string, session: BackendSession }
//    401:     { code: 'INVALID_CREDENTIALS' }
//    403:     { code: 'ACCOUNT_LOCKED', lockUntil: ISO8601 }
//    403:     { code: 'ACCOUNT_INACTIVE' }
//    403:     { code: 'ACCOUNT_PENDING_SETUP' }  — invite sent but setup not completed
//
//  GET /api/auth/me
//    Auth:    Bearer <token>
//    200:     { session: BackendSession }
//    401:     token expired → attempt POST /auth/refresh, then retry me
//
//  POST /api/auth/logout
//    Auth:    Bearer <token>
//    204:     (no body)
//
//  POST /api/auth/forgot-password
//    Body:    { email: string }
//    200:     (always; never reveals whether email is registered)
//
//  POST /api/auth/reset-password
//    Body:    { token: string, password: string, type: 'setup' | 'reset' }
//    204:     success
//    400:     { code: 'TOKEN_INVALID' }
//    410:     { code: 'TOKEN_EXPIRED' }
//
//  POST /api/auth/verify-otp    (FUTURE — OTP step)
//    Body:    { identifier: string, otp: string }
//    200:     { token: string, session: BackendSession }
//    401:     { code: 'INVALID_CREDENTIALS' }
//    410:     { code: 'TOKEN_EXPIRED' }
//
//  POST /api/auth/refresh
//    Cookie:  __Host-refresh-token (httpOnly, set on login)
//    200:     { token: string, session: BackendSession }
//    401:     refresh expired → clearAuth()
//
// ─────────────────────────────────────────────────────────────────────────────
//  EXPECTED BackendSession SHAPE
// ─────────────────────────────────────────────────────────────────────────────
//
//  interface BackendSession {
//    user: {
//      id:      string;
//      name:    string;   // full name
//      email:   string;
//      mobile?: string;
//    };
//    role:         'super_admin' | 'branch_manager' | 'technician' | 'operator';
//    tenant_id:    string;
//    tenant_name:  string;
//    branch?: {          // absent / null for super_admin
//      id:   string;
//      name: string;
//    } | null;
//    permissions:  string[];   // 'resource:action', e.g. 'jobs:read'
//  }
//
// ─────────────────────────────────────────────────────────────────────────────
//  GLOBAL 401 HANDLER (wire into your axios/fetch wrapper)
// ─────────────────────────────────────────────────────────────────────────────
//
//  import { authService } from '@/services/auth';
//
//  axiosInstance.interceptors.response.use(
//    res => res,
//    err => {
//      if (err.response?.status === 401 && !err.config._authRetry) {
//        authService.logout();           // clears tokens + session
//        window.location.replace('/login');  // hard nav resets React state
//      }
//      return Promise.reject(err);
//    }
//  );
//
//  The `!err.config._authRetry` guard prevents re-intercepting the
//  login endpoint itself when it returns 401 for bad credentials.
//
// ─────────────────────────────────────────────────────────────────────────────

// Keys must stay in sync with mock.ts and baseApi.prepareHeaders
const SESSION_KEY = 'erp-session-v1';
const TOKEN_KEY   = 'glass_erp_token';

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

async function throwAuthError(res: Response): Promise<never> {
  let body: Record<string, unknown> = {};
  try { body = await res.json(); } catch { /* ignore */ }
  const code     = (body.code ?? 'UNKNOWN') as AuthErrorCode;
  const lockUntil = typeof body.lockUntil === 'string' ? body.lockUntil : undefined;
  throw new AuthError(code, undefined, lockUntil);
}

function storeAuth(token: string, session: Session): void {
  localStorage.setItem(TOKEN_KEY,   token);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
}

// Normalises the backend response shape → frontend Session.
// Backend uses snake_case; frontend uses camelCase.
// If the backend shape changes, update only this function.
function mapSession(raw: Record<string, unknown>): Session {
  const user   = raw.user   as Record<string, unknown>;
  const branch = (raw.branch ?? null) as { id: string; name: string } | null;
  return {
    user: {
      id:                    user.id     as string,
      name:                  user.name   as string,
      email:                 user.email  as string,
      mobile:                user.mobile as string | undefined,
      isActive:              (user.is_active              ?? true) as boolean,
      passwordSetupComplete: (user.password_setup_complete ?? true) as boolean,
    },
    role:       raw.role                          as Session['role'],
    tenantId:   (raw.tenant_id   ?? raw.tenantId)   as string,
    tenantName: (raw.tenant_name ?? raw.tenantName) as string,
    branch:     branch ? { id: branch.id, name: branch.name } : null,
    permissions: (raw.permissions ?? [])           as string[],
  };
}

// ── Adapter ───────────────────────────────────────────────────────────────────

export const authServiceHttp: AuthService = {

  async login(credentials: LoginCredentials): Promise<Session> {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body:   JSON.stringify(credentials),
    });
    if (!res.ok) return throwAuthError(res);
    const { token, session: raw } = await res.json() as {
      token:   string;
      session: Record<string, unknown>;
    };
    const session = mapSession(raw);
    storeAuth(token, session);
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

    // Try with stored access token
    try {
      const res = await apiFetch('/auth/me');
      if (res.ok) {
        const { session: raw } = await res.json() as { session: Record<string, unknown> };
        const session = mapSession(raw);
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
      }
      if (res.status !== 401) { clearAuth(); return null; }
    } catch {
      return null;
    }

    // Access token expired (401) — attempt silent refresh via httpOnly cookie
    try {
      const refreshRes = await fetch(`${getBaseUrl()}/auth/refresh`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
      });
      if (!refreshRes.ok) { clearAuth(); return null; }
      const { token: newToken, session: raw } = await refreshRes.json() as {
        token:   string;
        session: Record<string, unknown>;
      };
      const session = mapSession(raw);
      storeAuth(newToken, session);
      return session;
    } catch {
      clearAuth();
      return null;
    }
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

  async verifyOtp({ otpToken, otp }: VerifyOtpOptions): Promise<Session> {
    const res = await apiFetch('/auth/verify-otp', {
      method: 'POST',
      body:   JSON.stringify({ otp_token: otpToken, otp }),
    });
    if (!res.ok) return throwAuthError(res);
    const { token, session: raw } = await res.json() as {
      token:   string;
      session: Record<string, unknown>;
    };
    const session = mapSession(raw);
    storeAuth(token, session);
    return session;
  },

  async resendOtp(otpToken: string): Promise<void> {
    await apiFetch('/auth/resend-otp', {
      method: 'POST',
      body:   JSON.stringify({ otp_token: otpToken }),
    });
    // Best-effort — ignore errors; user can request again.
  },
};
