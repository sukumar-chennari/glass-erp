/**
 * React auth context — thin wrapper over the auth service layer.
 *
 * Contains only React state management. All business logic (storage,
 * API calls, shape validation) lives in src/services/auth/.
 *
 * To swap mock → real API: change one import in src/services/auth/index.ts.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authService } from '@/services/auth';
import type { Session, LoginCredentials, VerifyOtpOptions } from '@/services/auth';

// Re-export types so existing imports from '@/context/AuthContext' keep working.
export type { AuthUser, UserRole, Session, AuthBranch } from '@/services/auth';
export { AuthError } from '@/services/auth';

// ── Context ───────────────────────────────────────────────────────────────────

interface AuthContextValue {
  session:   Session | null;
  isLoading: boolean;
  /**
   * Authenticate with identifier + password.
   * Returns the Session on success (OTP skipped).
   * Throws AuthError(OTP_REQUIRED) when OTP is required — callers navigate to /verify-otp.
   */
  login:     (credentials: LoginCredentials) => Promise<Session>;
  /** Optimistic: clears local state immediately, calls server best-effort. */
  logout:    () => void;
  /**
   * Complete OTP challenge after a successful password auth.
   * Returns the final Session so callers can navigate to the role default route.
   */
  verifyOtp: (opts: VerifyOtpOptions) => Promise<Session>;
  /** Resend OTP to the user's registered contact using the challenge token. */
  resendOtp: (otpToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session,   setSession]   = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authService.getSession()
      .then(setSession)
      .catch(() => null)
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (credentials: LoginCredentials): Promise<Session> => {
    // If OTP is required, authService.login throws AuthError(OTP_REQUIRED).
    // That propagates to the caller (LoginPage) which handles the navigation.
    const newSession = await authService.login(credentials);
    setSession(newSession);
    return newSession;
  };

  const logout = () => {
    setSession(null);                // clear immediately — navigation can follow right away
    void authService.logout();       // server-side cleanup, fire-and-forget
  };

  const verifyOtp = async (opts: VerifyOtpOptions): Promise<Session> => {
    const newSession = await authService.verifyOtp(opts);
    setSession(newSession);
    return newSession;
  };

  const resendOtp = async (otpToken: string): Promise<void> => {
    await authService.resendOtp(otpToken);
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, login, logout, verifyOtp, resendOtp }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/**
 * True when the current session includes the given permission string.
 * Use to conditionally render actions the user is not allowed to take.
 *
 * Example:
 *   const canWrite = useHasPermission('invoices:write');
 */
export function useHasPermission(permission: string): boolean {
  const { session } = useAuth();
  return session?.permissions.includes(permission) ?? false;
}
