import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Sidebar }              from '@/components/layout/Sidebar';
import { TopHeader }            from '@/components/layout/TopHeader';
import { ErrorBoundary }        from '@/components/ErrorBoundary';
import { SessionExpiredModal }  from '@/features/auth/SessionExpiredModal';
import { useAuth }              from '@/context/AuthContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeMobileSidebar }   from '@/store/slices/uiSlice';
import { canRoleAccessPath, getRoleDefaultRoute } from '@/utils/roleRouting';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const dispatch   = useAppDispatch();
  const collapsed  = useAppSelector((s) => s.ui.sidebarCollapsed);
  const mobileOpen = useAppSelector((s) => s.ui.sidebarMobileOpen);
  const { session } = useAuth();
  const location   = useLocation();

  // Frontend nav-access guard.
  // If the user navigates directly to a path not in their role's nav
  // (e.g. a technician typing /vendors), redirect to their default landing.
  //
  // NOTE: This is a convenience guard only. The backend API enforces
  // permissions independently and is the authoritative control.
  //
  // TODO (backend): Remove or simplify once API returns 403 for
  // unauthorised resource access and the global 401/403 interceptor handles it.
  if (session && !canRoleAccessPath(session.role, location.pathname)) {
    return <Navigate to={getRoleDefaultRoute(session.role)} replace />;
  }

  return (
    <div className={styles.root}>
      <SessionExpiredModal />
      <Sidebar />

      {/* Tap-away overlay on mobile */}
      {mobileOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => dispatch(closeMobileSidebar())}
          aria-hidden="true"
        />
      )}

      <div className={`${styles.main} ${collapsed ? styles.sidebarCollapsed : ''}`}>
        <TopHeader />

        <main className={styles.pageContent}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
