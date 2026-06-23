import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';

export function ProtectedRoute() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-bg-base)',
      }}>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Loading…
        </span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}
