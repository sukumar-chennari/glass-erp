// ── Auth API (RTK Query mutations) ───────────────────────────────────────────
//
// Covers non-session auth mutations: forgot-password, setup/reset-password,
// and the admin-initiated resend-invite operation.
//
// WHY these use RTK Query while login/logout/verifyOtp/resendOtp stay in
// authService (src/services/auth/mock.ts|http.ts):
//   • Session management ops run before React mounts (getSession) and must
//     manage the token that baseApi reads.  Using RTK Query for them would
//     create a circular dependency.
//   • Forgot-password and password setup/reset carry no session and fit
//     naturally into the standard RTK Query mutation + mock-switch pattern.
//
// Backend endpoints:
//   POST /auth/forgot-password      — always 200 (security: never reveals email)
//   POST /auth/reset-password       — 204 | 400 TOKEN_INVALID | 410 TOKEN_EXPIRED
//   POST /settings/users/:id/resend-invite — 204

import { baseApi } from '@/services/baseApi';
import { mockableMutation } from '@/services/mockUtils';
import { userMock } from '@/mocks/adminUsers';

export interface ForgotPasswordPayload { email: string }
export interface ResetPasswordPayload  {
  token:    string;
  password: string;
  /** 'setup' = first-time invite link; 'reset' = forgot-password link. */
  type:     'setup' | 'reset';
}
export interface ResendInvitePayload { userId: string }

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    forgotPassword: builder.mutation<null, ForgotPasswordPayload>({
      ...mockableMutation<null, ForgotPasswordPayload>({
        mockFn: async () => null,
        url:    '/auth/forgot-password',
        method: 'POST',
      }),
    }),

    resetPassword: builder.mutation<null, ResetPasswordPayload>({
      ...mockableMutation<null, ResetPasswordPayload>({
        mockFn: async () => null,
        url:    '/auth/reset-password',
        method: 'POST',
      }),
    }),

    resendInvite: builder.mutation<null, ResendInvitePayload>({
      ...mockableMutation<null, ResendInvitePayload>({
        mockFn: (arg) => {
          userMock.resendInvite(arg.userId);
          return null;
        },
        url:    (arg) => `/settings/users/${arg.userId}/resend-invite`,
        method: 'POST',
      }),
      invalidatesTags: ['AppUser'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useResendInviteMutation,
} = authApi;
