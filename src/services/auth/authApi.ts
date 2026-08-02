// ── Auth API (RTK Query) ─────────────────────────────────────────────────────
//
// loginEmail / otpSend / otpVerify / logout use direct query: (no mock wrapper).
// These are the first backend-integrated endpoints — they always hit the real API.
// Other endpoints (me, refresh, forgotPassword, etc.) remain mockable until
// their backend counterparts are confirmed active.
//
// On successful loginEmail / otpVerify, call AuthContext.acceptLoginResponse()
// to store the token and update React session state.

import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation, MOCK_DELAY } from '@/services/mockUtils';
import { ENDPOINTS } from '@/services/api';
import { userMock } from '@/mocks/adminUsers';
import type { Session, BackendAuthResponse, BackendRole, OtpSendResult } from './types';

// ── Payload types ─────────────────────────────────────────────────────────────

export interface LoginEmailPayload    { email: string; password: string }
export interface OtpSendPayload       { phone: string }
export interface OtpVerifyPayload     { otpToken: string; otp: string }
export interface ForgotPasswordPayload  { email: string }
export interface ResetPasswordPayload {
  token:    string;
  password: string;
  type:     'setup' | 'reset';
}
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword:     string;
}
export interface ResendInvitePayload { userId: string }

export interface CreateSuperAdminPayload {
  name:     string;
  email:    string;
  password: string;
}

export interface CreateSuperAdminResponse {
  id?:        string;
  name?:      string;
  email?:     string;
  role?:      string;
  isActive?:  boolean;
  createdAt?: string;
}

// ── Helpers (mock-only) ───────────────────────────────────────────────────────

const SESSION_KEYS = ['erp-session-v2', 'erp-session-v1'] as const;

function readMockSession(): Session | null {
  for (const key of SESSION_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try { return JSON.parse(raw) as Session; } catch { /* ignore */ }
    }
  }
  return null;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ── API slice ─────────────────────────────────────────────────────────────────

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ── Active auth endpoints — always real HTTP, no mock wrapper ────────────

    loginEmail: builder.mutation<BackendAuthResponse, LoginEmailPayload>({
      query: (body) => ({
        url:    ENDPOINTS.auth.loginEmail,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AuthSession'],
    }),

    otpSend: builder.mutation<OtpSendResult, OtpSendPayload>({
      query: (body) => ({
        url:    ENDPOINTS.auth.otpSend,
        method: 'POST',
        body,
      }),
    }),

    otpVerify: builder.mutation<BackendAuthResponse, OtpVerifyPayload>({
      query: (body) => ({
        url:    ENDPOINTS.auth.otpVerify,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AuthSession'],
    }),

    logout: builder.mutation<null, void>({
      query: () => ({
        url:    ENDPOINTS.auth.logout,
        method: 'POST',
      }),
      invalidatesTags: ['AuthSession'],
    }),

    // ── Stub endpoints (backend not yet active) ───────────────────────────────

    me: builder.query<Session, void>({
      ...mockableQuery<Session, void>({
        mockFn: async () => {
          await delay(MOCK_DELAY);
          const session = readMockSession();
          if (!session) throw new Error('No active session');
          return session;
        },
        url: ENDPOINTS.auth.me,
      }),
      providesTags: ['AuthSession'],
    }),

    refresh: builder.mutation<BackendAuthResponse, void>({
      ...mockableMutation<BackendAuthResponse, void>({
        mockFn: async () => {
          await delay(MOCK_DELAY);
          const session = readMockSession();
          if (!session) throw new Error('No session to refresh');
          const roleMap: Record<string, BackendRole> = {
            super_admin: 'SUPER_ADMIN', branch_manager: 'ADMIN',
            operator: 'OPERATOR',      technician: 'TECHNICIAN',
          };
          return {
            accessToken: `mock-jwt-refreshed-${session.user.id}`,
            user: {
              id:       session.user.id,
              name:     session.user.name,
              email:    session.user.email,
              role:     roleMap[session.role] ?? 'OPERATOR',
              isActive: session.user.isActive,
            },
            branch: session.branch,
          };
        },
        url:    ENDPOINTS.auth.refresh,
        method: 'POST',
      }),
      invalidatesTags: ['AuthSession'],
    }),

    forgotPassword: builder.mutation<null, ForgotPasswordPayload>({
      ...mockableMutation<null, ForgotPasswordPayload>({
        mockFn: async () => { await delay(MOCK_DELAY); return null; },
        url:    ENDPOINTS.auth.forgotPassword,
        method: 'POST',
      }),
    }),

    resetPassword: builder.mutation<null, ResetPasswordPayload>({
      ...mockableMutation<null, ResetPasswordPayload>({
        mockFn: async () => { await delay(MOCK_DELAY); return null; },
        url:    ENDPOINTS.auth.resetPassword,
        method: 'POST',
      }),
    }),

    changePassword: builder.mutation<null, ChangePasswordPayload>({
      ...mockableMutation<null, ChangePasswordPayload>({
        mockFn: async () => { await delay(MOCK_DELAY); return null; },
        url:    ENDPOINTS.auth.changePassword,
        method: 'PATCH',
      }),
    }),

    resendInvite: builder.mutation<null, ResendInvitePayload>({
      ...mockableMutation<null, ResendInvitePayload>({
        mockFn: (arg) => {
          userMock.resendInvite(arg.userId);
          return null;
        },
        url:    (arg) => ENDPOINTS.users.resendInvite(arg.userId),
        method: 'POST',
      }),
      invalidatesTags: ['AppUser'],
    }),

    // POST /api/v1/auth/super-admin — SUPER_ADMIN only; creates another SUPER_ADMIN account.
    // Always real HTTP (no mock wrapper) — privileged action must go to the real API.
    createSuperAdmin: builder.mutation<CreateSuperAdminResponse, CreateSuperAdminPayload>({
      query: (body) => ({
        url:    ENDPOINTS.auth.createSuperAdmin,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AppUser'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginEmailMutation,
  useOtpSendMutation,
  useOtpVerifyMutation,
  useLogoutMutation,
  useMeQuery,
  useRefreshMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useResendInviteMutation,
  useCreateSuperAdminMutation,
} = authApi;
