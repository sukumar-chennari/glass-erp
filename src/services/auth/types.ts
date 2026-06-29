/**
 * Auth domain types and service interface.
 *
 * These are the canonical frontend shapes. Backend adapters in http.ts
 * normalise API responses to these. No component imports auth types
 * from anywhere else — always import from '@/services/auth'.
 */

// ── User / Session ────────────────────────────────────────────────────────────

export interface AuthUser {
  id:      string;
  name:    string;
  email:   string;
  mobile?: string;
}

/**
 * WindX staff roles (business-approved names — match backend enum exactly).
 * - super_admin     → system-level, cross-branch (no branch scope)
 * - branch_manager  → manages one branch (staff, jobs, reports)
 * - technician      → field work + own job cards
 * - operator        → general branch operations
 *
 * Route guards use this type directly — add new roles here when needed.
 */
export type UserRole =
  | 'super_admin'
  | 'branch_manager'
  | 'technician'
  | 'operator';

export interface AuthBranch {
  id:   string;
  name: string;
}

/**
 * Canonical session held in React context and persisted in localStorage.
 * All fields are required — the backend adapter fills defaults if the API
 * returns partial data.
 */
export interface Session {
  user:        AuthUser;
  role:        UserRole;
  tenantId:    string;
  tenantName:  string;
  /**
   * The branch this session is scoped to.
   * null for super_admin (operates across all branches).
   */
  branch:      AuthBranch | null;
  permissions: string[];
}

// ── Auth operations ───────────────────────────────────────────────────────────

export interface LoginCredentials {
  /** Email address or mobile number. */
  identifier: string;
  password:   string;
}

export interface ResetPasswordOptions {
  /** Signed token from the email link. */
  token:    string;
  password: string;
  /** 'setup' = first-time invite link; 'reset' = forgot-password link. */
  type:     'setup' | 'reset';
}

export interface VerifyOtpOptions {
  /** Intermediate token returned by the backend when OTP is required. */
  otpToken: string;
  otp:      string;
}

// ── Auth errors ───────────────────────────────────────────────────────────────

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'     // too many failed attempts — lockUntil is set
  | 'ACCOUNT_INACTIVE'   // deactivated by admin
  | 'OTP_REQUIRED'       // password verified — OTP challenge issued, otpToken is set
  | 'TOKEN_EXPIRED'      // reset / invite / OTP link expired
  | 'TOKEN_INVALID'      // link already used or malformed
  | 'UNKNOWN';

export class AuthError extends Error {
  constructor(
    public readonly code:      AuthErrorCode,
    message?:                  string,
    /** ISO timestamp until which the account is locked (ACCOUNT_LOCKED only). */
    public readonly lockUntil?: string,
    /**
     * Intermediate OTP session token (OTP_REQUIRED only).
     * LoginPage reads this to navigate: /verify-otp?token=<otpToken>
     */
    public readonly otpToken?: string,
  ) {
    super(message ?? code);
    this.name = 'AuthError';
  }
}

// ── Service interface ─────────────────────────────────────────────────────────
// Both authServiceMock (mock.ts) and authServiceHttp (http.ts) implement this.

export interface AuthService {
  /**
   * Authenticate a staff member. Returns Session on success.
   * Throws AuthError on failure — callers map code to a translated message.
   *
   * OTP extension: when backend requires OTP after password verification,
   * throw AuthError({ code: 'OTP_REQUIRED', otpToken }). LoginPage catches
   * this and navigates to /verify-otp?token=<otpToken>.
   * In mock mode this code path is never triggered — login always completes.
   */
  login(credentials: LoginCredentials): Promise<Session>;

  /**
   * Invalidate the session server-side (best-effort) and clear all local auth
   * state including the glass_erp_token used by baseApi.
   * UI navigates to /login optimistically — callers do not await this.
   */
  logout(): Promise<void>;

  /**
   * Rehydrate session on app start.
   * - Mock: reads from localStorage and validates shape.
   * - HTTP:  calls GET /api/auth/me with the stored token.
   * Returns null if there is no valid session.
   */
  getSession(): Promise<Session | null>;

  /**
   * Send a password-reset email. Always returns void — never reveals
   * whether the email address is registered (security requirement).
   */
  requestPasswordReset(email: string): Promise<void>;

  /**
   * Complete password setup or reset using a signed token from email.
   * Throws AuthError(TOKEN_EXPIRED | TOKEN_INVALID) on failure.
   */
  resetPassword(opts: ResetPasswordOptions): Promise<void>;

  /**
   * Verify the OTP code after a successful password auth that returned
   * OTP_REQUIRED. Returns the final Session on success.
   * Throws AuthError(TOKEN_EXPIRED | TOKEN_INVALID | INVALID_CREDENTIALS).
   */
  verifyOtp(opts: VerifyOtpOptions): Promise<Session>;

  /**
   * Resend the OTP to the user's registered mobile / email.
   * Uses the same otpToken from the OTP_REQUIRED challenge.
   */
  resendOtp(otpToken: string): Promise<void>;

  // ── Future: token refresh ─────────────────────────────────────────────────
  // refresh(): Promise<Session>;
}
