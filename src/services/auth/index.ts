// ── Auth Service Selector ─────────────────────────────────────────────────────
//
// SWAP POINT — one-line change activates the real API:
//
//   Demo/dev  →  import { authServiceMock as authService } from './mock';
//   Production →  import { authServiceHttp as authService } from './http';
//
// Every consumer imports { authService } from '@/services/auth'.
// None of them change when the adapter swaps.
//
// For unit tests: pass a test double directly to AuthProvider rather than
// relying on this file.
// ─────────────────────────────────────────────────────────────────────────────

import { authServiceMock as authService } from './mock';

export { authService };

export type {
  AuthService,
  AuthUser,
  AuthBranch,
  Session,
  LoginCredentials,
  ResetPasswordOptions,
  VerifyOtpOptions,
  UserRole,
  AuthErrorCode,
} from './types';

export { AuthError } from './types';
