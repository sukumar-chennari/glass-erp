/**
 * React auth context — thin wrapper over the auth service layer.
 *
 * Contains only React state management. All business logic (storage,
 * API calls, shape validation) lives in src/services/auth/.
 *
 * To swap mock → real API: change one import in src/services/auth/index.ts.
 */

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { authService } from '@/services/auth';
import type { Session, LoginCredentials, VerifyOtpOptions, OtpSendResult, BackendAuthResponse } from '@/services/auth';
import { mapSession, storeAuth } from '@/services/auth/http';

// Re-export types so existing imports from '@/context/AuthContext' keep working.
export type { AuthUser, UserRole, Session, AuthBranch } from '@/services/auth';
export { AuthError } from '@/services/auth';

// ── Context ───────────────────────────────────────────────────────────────────

interface AuthContextValue {
  session:          Session | null;
  isLoading:        boolean;
  isSessionExpired: boolean;
  /**
   * Called after a successful useLoginEmailMutation / useOtpVerifyMutation.
   * Maps the raw BackendAuthResponse → Session, persists token + session to
   * localStorage, and updates React state in one call.
   */
  acceptLoginResponse: (response: BackendAuthResponse) => Session;
  /**
   * Authenticate with email + password via authService (non-RTK path).
   * Kept for backward compatibility and non-UI callers.
   */
  login:     (credentials: LoginCredentials) => Promise<Session>;
  /** Optimistic: clears local state immediately, calls server best-effort. */
  logout:    () => void;
  /**
   * Send OTP to a phone number via authService (non-RTK path).
   * LoginPage uses useOtpSendMutation directly — this is kept for
   * VerifyOtpPage's resend flow which uses the service layer.
   */
  sendOtp:   (phone: string) => Promise<OtpSendResult>;
  /**
   * Complete OTP verify step via authService.
   * Returns the final Session so callers can navigate to the role default route.
   */
  verifyOtp: (opts: VerifyOtpOptions) => Promise<Session>;
  /** Resend OTP using the challenge token (legacy / email-OTP flow). */
  resendOtp: (otpToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// 8-hour inactivity timeout (business requirement: staff shift length)
const INACTIVITY_MS = 8 * 60 * 60 * 1000;

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session,          setSession]          = useState<Session | null>(null);
  const [isLoading,        setIsLoading]        = useState(true);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    authService.getSession()
      .then(setSession)
      .catch(() => null)
      .finally(() => setIsLoading(false));
  }, []);

  const acceptLoginResponse = useCallback((response: BackendAuthResponse): Session => {
    const newSession = mapSession(response as unknown as Record<string, unknown>);
    storeAuth(response.accessToken, newSession);
    setSession(newSession);
    setIsSessionExpired(false);
    return newSession;
  }, []);

  const login = async (credentials: LoginCredentials): Promise<Session> => {
    const newSession = await authService.login(credentials);
    setSession(newSession);
    setIsSessionExpired(false);
    return newSession;
  };

  const logout = useCallback(() => {
    setSession(null);
    setIsSessionExpired(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    void authService.logout();
  }, []);

  const sendOtp = async (phone: string): Promise<OtpSendResult> => {
    return authService.sendOtp(phone);
  };

  const verifyOtp = async (opts: VerifyOtpOptions): Promise<Session> => {
    const newSession = await authService.verifyOtp(opts);
    setSession(newSession);
    setIsSessionExpired(false);
    return newSession;
  };

  const resendOtp = async (otpToken: string): Promise<void> => {
    await authService.resendOtp(otpToken);
  };

  // Inactivity timer: fires after INACTIVITY_MS of no user input
  const resetTimer = useCallback(() => {
    if (!session) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsSessionExpired(true);
      setSession(null);
      void authService.logout();
    }, INACTIVITY_MS);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'] as const;
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [session, resetTimer]);

  return (
    <AuthContext.Provider value={{
      session, isLoading, isSessionExpired,
      acceptLoginResponse,
      login, logout, sendOtp, verifyOtp, resendOtp,
    }}>
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
 */
export function useHasPermission(permission: string): boolean {
  const { session } = useAuth();
  return session?.permissions.includes(permission) ?? false;
}
