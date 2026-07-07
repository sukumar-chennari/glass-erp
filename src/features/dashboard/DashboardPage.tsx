import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { PageShell }        from '@/components/layout/PageShell';
import { KpiGrid }          from './components/KpiGrid';
import { RecentActivity }   from './components/RecentActivity';
import { BranchManagerDashboard } from './components/BranchManagerDashboard';
import { SuperAdminDashboard }    from './components/SuperAdminDashboard';
import { useGetDashboardQuery } from './services/dashboardApi';
import { useAuth } from '@/context/AuthContext';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { data, isLoading, isError } = useGetDashboardQuery();
  const { t } = useTranslation('dashboard');
  const { session } = useAuth();

  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <PageShell
      heading={t('title')}
      description={t('description', { date: dateStr })}
    >
      {isError && (
        <div className={styles.errorBox}>
          <AlertCircle size={18} />
          {t('error.loadFailed')}
        </div>
      )}

      <KpiGrid
        kpis={data?.kpis ?? []}
        isLoading={isLoading}
      />

      <RecentActivity
        recentCustomers={data?.recentCustomers ?? []}
        pendingClaims={data?.pendingClaims   ?? []}
        recentJobs={data?.recentJobs         ?? []}
        isLoading={isLoading}
      />

      {session?.role === 'branch_manager' && <BranchManagerDashboard />}
      {session?.role === 'super_admin'    && <SuperAdminDashboard />}
    </PageShell>
  );
}
