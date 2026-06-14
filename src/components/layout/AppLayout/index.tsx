import { Outlet } from 'react-router-dom';
import { Sidebar }       from '@/components/layout/Sidebar';
import { TopHeader }     from '@/components/layout/TopHeader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeMobileSidebar } from '@/store/slices/uiSlice';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const dispatch        = useAppDispatch();
  const collapsed       = useAppSelector((s) => s.ui.sidebarCollapsed);
  const mobileOpen      = useAppSelector((s) => s.ui.sidebarMobileOpen);

  return (
    <div className={styles.root}>
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
