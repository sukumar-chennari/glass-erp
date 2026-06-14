import { Outlet } from 'react-router-dom';
import { Sidebar }      from '@/components/layout/Sidebar';
import { TopHeader }    from '@/components/layout/TopHeader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAppSelector } from '@/store/hooks';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);

  return (
    <div className={styles.root}>
      <Sidebar />

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
