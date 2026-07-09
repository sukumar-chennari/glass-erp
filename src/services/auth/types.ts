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
  /** False only when a Super Admin has deactivated the account. */
  isActive:              boolean;
  /** False until the staff member completes the /setup-password invite flow. */
  passwordSetupComplete: boolean;
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
  /**
   * The branch this session is scoped to.
   * null for super_admin (operates across all branches).
   * branch.id is the authoritative branch identifier for all API calls.
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
  | 'ACCOUNT_LOCKED'         // too many failed attempts — lockUntil is set
  | 'ACCOUNT_INACTIVE'       // deactivated by admin
  | 'ACCOUNT_PENDING_SETUP'  // account created, but staff has not set a password yet
  | 'OTP_REQUIRED'           // password verified — OTP challenge issued, otpToken is set
  | 'TOKEN_EXPIRED'          // reset / invite / OTP link expired
  | 'TOKEN_INVALID'          // link already used or malformed
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

  /**
   * Send OTP to a phone number (OPERATOR / TECHNICIAN login flow).
   * Returns an otpToken the caller must pass to verifyOtp().
   */
  sendOtp(phone: string): Promise<OtpSendResult>;

  // ── Future: token refresh ─────────────────────────────────────────────────
  // refresh(): Promise<Session>;
}

// ── Backend contract types (raw API shapes) ───────────────────────────────────
//
// These mirror the Swagger spec. Only the HTTP adapter (http.ts) ever
// references them — components and context always use the canonical
// frontend types above.

/** Role strings returned by the backend API (uppercase enum values). */
export type BackendRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'TECHNICIAN';

export interface BackendUser {
  id:                     string;
  name:                   string;
  email?:                 string;
  phone?:                 string;
  role:                   BackendRole;
  isActive:               boolean;
  passwordSetupComplete?: boolean;
  /** Direct branch reference on the user object (new backend contract). */
  branchId?:              string;
  /** Full branch object when embedded in the user (legacy shape). */
  branch?:                { id: string; name: string } | null;
}

/** Branch returned at the root of the auth response (replaces BackendTenant). */
export interface BackendBranch {
  id:   string;
  name: string;
}

/** Returned by POST /auth/login/email and POST /auth/otp/verify */
export interface BackendAuthResponse {
  accessToken:  string;
  /**
   * Refresh token issued by the backend.
   *
   * In the production model the backend sets this as an HttpOnly cookie
   * (Set-Cookie: ...; HttpOnly; Secure; SameSite=Strict) and does NOT include
   * it in the JSON body. The frontend never stores or reads this value —
   * the browser sends the cookie automatically on credentialed requests.
   *
   * Typed optional so both legacy (body-included) and cookie-only backend
   * shapes compile without error. See TODO_ACTIVATE_ME_REFRESH in http.ts.
   */
  refreshToken?: string;
  user:          BackendUser;
  /** Branch context for this session (replaces the old `tenant` field). */
  branch:        BackendBranch | null;
}

/** Returned by POST /auth/otp/send */
export interface OtpSendResult {
  otpToken: string;
  message?: string;
}

/** Standard error envelope from the backend. */
export interface ApiErrorResponse {
  statusCode: number;
  message:    string;
  path:       string;
  timestamp:  string;
  /** Legacy code string — some endpoints still include this. */
  code?:      string;
}
