import { type ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/services/auth';
import { ROUTES } from '@/constants/routes';

interface RequireRoleProps {
  /** Roles that are allowed past this guard. */
  roles:       UserRole[];
  /** Where to redirect unauthorised users. Defaults to ROUTES.DASHBOARD. */
  redirectTo?: string;
  /**
   * Children to render when authorised.
   * Omit to use as a layout route (renders <Outlet /> instead).
   */
  children?:   ReactNode;
}

/**
 * Role-based route guard.
 *
 * Use inside a ProtectedRoute (session is guaranteed non-null):
 *
 * Router layout route:
 *   { element: <RequireRole roles={['super_admin']} />, children: [...] }
 *
 * Inline wrapper:
 *   <RequireRole roles={['super_admin', 'branch_manager']}>
 *     <AdminPage />
 *   </RequireRole>
 */
export function RequireRole({ roles, redirectTo, children }: RequireRoleProps) {
  const { session } = useAuth();

  const allowed = session && roles.includes(session.role);

  if (!allowed) {
    return <Navigate to={redirectTo ?? ROUTES.DASHBOARD} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
