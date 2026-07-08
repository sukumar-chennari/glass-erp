// ── Auth API (RTK Query) ─────────────────────────────────────────────────────
//
// Covers auth operations that fit the standard RTK Query mutation/query pattern.
//
// WHY login/logout/verifyOtp/resendOtp stay in authService (not here):
//   • Session management ops (login, getSession) run before React mounts and must
//     manage the token that baseApi reads — using RTK Query creates a circular dep.
//   • verifyOtp/resendOtp complete/extend the session established by login, so they
//     belong in the same service layer for consistency.
//
// What lives here:
//   GET  /auth/me             — current session for profile display and re-validation
//   POST /auth/refresh        — silent token refresh (httpOnly cookie flow)
//   POST /auth/forgot-password
//   POST /auth/reset-password
//   PATCH /auth/password      — change password (authenticated user, Security settings)
//   POST /settings/users/:id/resend-invite

import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation, MOCK_DELAY } from '@/services/mockUtils';
import { ENDPOINTS } from '@/services/api';
import { userMock } from '@/mocks/adminUsers';
import type { Session } from './types';

// ── Payload types ─────────────────────────────────────────────────────────────

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

    refresh: builder.mutation<{ token: string }, void>({
      ...mockableMutation<{ token: string }, void>({
        mockFn: async () => {
          await delay(MOCK_DELAY);
          const session = readMockSession();
          if (!session) throw new Error('No session to refresh');
          return { token: `mock-jwt-refreshed-${session.user.id}` };
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
  }),
  overrideExisting: false,
});

export const {
  useMeQuery,
  useRefreshMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useResendInviteMutation,
} = authApi;
