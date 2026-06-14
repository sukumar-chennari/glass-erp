import { AlertCircle } from 'lucide-react';
import { PageShell }        from '@/components/layout/PageShell';
import { KpiGrid }          from './components/KpiGrid';
import { RecentActivity }   from './components/RecentActivity';
import { useGetDashboardQuery } from './services/dashboardApi';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { data, isLoading, isError } = useGetDashboardQuery();

  return (
    <PageShell
      heading="Dashboard"
      description={`Welcome back! Here's your business at a glance — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}.`}
    >
      {isError && (
        <div className={styles.errorBox}>
          <AlertCircle size={18} />
          Failed to load dashboard data. Please refresh.
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
    </PageShell>
  );
}
