import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import { Spinner } from '@/components/ui/Spinner';

export function ProtectedRoute() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        minHeight:      '100vh',
        gap:            '16px',
        background:     'var(--color-bg-base)',
      }}
        role="status"
        aria-label="Loading application"
      >
        <Spinner size="lg" />
        <span style={{
          color:         'var(--color-text-muted)',
          fontSize:      'var(--font-size-sm)',
          letterSpacing: '0.01em',
        }}>
          Loading…
        </span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!session.user.isActive) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!session.user.passwordSetupComplete) {
    return <Navigate to={ROUTES.SETUP_PASSWORD} replace />;
  }

  return <Outlet />;
}
