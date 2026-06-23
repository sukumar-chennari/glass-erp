import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export type UserRole = 'tenant_user' | 'tenant_admin' | 'super_admin';

export interface Session {
  user: AuthUser;
  role: UserRole;
  tenantId: string;
  tenantName: string;
  permissions: string[];
}

interface LoginCredentials {
  identifier: string;
  password: string;
}

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// Bump suffix when Session shape changes to auto-invalidate stale stored sessions.
const SESSION_KEY = 'erp-session-v1';

// ── Shape guard ───────────────────────────────────────────────────────────────
// Prevents corrupt/outdated localStorage data from being trusted as a Session.

function isValidSession(data: unknown): data is Session {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.tenantId === 'string' &&
    typeof d.tenantName === 'string' &&
    typeof d.role === 'string' &&
    d.user !== null &&
    typeof d.user === 'object' &&
    typeof (d.user as Record<string, unknown>).id === 'string' &&
    typeof (d.user as Record<string, unknown>).name === 'string'
  );
}

// ── Mock adapter ──────────────────────────────────────────────────────────────
// Swap login() body only when integrating a real API.
// Swap point: replace the setTimeout + buildMockSession with an API call,
// and parse the response into a Session object with the same shape.

function buildMockSession(identifier: string): Session {
  const isEmail = identifier.includes('@');
  return {
    user: {
      id: 'mock-user-1',
      name: isEmail ? identifier.split('@')[0] : 'ERP User',
      email: isEmail ? identifier : `${identifier}@glasserp.local`,
    },
    role: 'tenant_admin',
    tenantId: 'tenant-001',
    tenantName: 'Glass ERP',
    permissions: [
      'jobs:read',     'jobs:write',
      'invoices:read', 'invoices:write',
      'claims:read',   'claims:write',
      'reports:read',
    ],
  };
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]     = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isValidSession(parsed)) {
          setSession(parsed);
        } else {
          // Clear stale / schema-mismatched session silently
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async ({ identifier, password: _password }: LoginCredentials) => {
    // --- SWAP POINT ---
    // Replace this block with a real API call:
    //   const response = await apiClient.post('/auth/login', { identifier, password });
    //   const newSession: Session = mapResponseToSession(response.data);
    // ---------------------
    await new Promise((resolve) => setTimeout(resolve, 600));
    const newSession = buildMockSession(identifier);
    // ------------------
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    setSession(newSession);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    // When integrating a real API, also call: apiClient.post('/auth/logout')
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, login, logout }}>
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
 * Returns true when the current session includes the given permission string.
 * Use for conditional rendering of actions the user shouldn't see or trigger.
 *
 * Example: const canWrite = useHasPermission('jobs:write');
 */
export function useHasPermission(permission: string): boolean {
  const { session } = useAuth();
  return session?.permissions.includes(permission) ?? false;
}
