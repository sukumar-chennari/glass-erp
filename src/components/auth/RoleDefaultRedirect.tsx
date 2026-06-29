import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import { getRoleDefaultRoute } from '@/utils/roleRouting';

/**
 * Used as the index route inside the protected shell.
 * Redirects to the role-appropriate landing page after login.
 *
 * Placing this here (rather than hardcoding ROUTES.DASHBOARD) means
 * each role lands on the page most relevant to their daily work.
 */
export function RoleDefaultRedirect() {
  const { session } = useAuth();
  if (!session) return <Navigate to={ROUTES.LOGIN} replace />;
  return <Navigate to={getRoleDefaultRoute(session.role)} replace />;
}
