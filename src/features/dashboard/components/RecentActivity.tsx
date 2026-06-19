import { useTranslation } from 'react-i18next';
import { useNavigate }  from 'react-router-dom';
import { SectionCard, SectionHeader } from '@/components/layout/PageShell';
import { DataTable }    from '@/components/ui/DataTable';
import { Button }       from '@/components/ui/Button';
import { StatusBadge }  from '@/components/ui/Badge';
import { JOB_STATUS_MAP, CLAIM_STATUS_MAP } from '@/constants/statuses';
import { claimStatusKey, jobStatusKey, glassPositionKey } from '@/i18n/statusKeys';
import { ROUTES }       from '@/constants/routes';
import type {
  DashboardRecentCustomer,
  DashboardPendingClaim,
  DashboardRecentJob,
} from '@/types/models/dashboard';
import type { TableColumn } from '@/types/ui';
import styles from './RecentActivity.module.css';

/* ── Recent Customers ─────────────────────────────────────────────── */

interface RecentCustomersProps {
  data:      DashboardRecentCustomer[];
  isLoading: boolean;
}

export function RecentCustomers({ data, isLoading }: RecentCustomersProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  const customerColumns: TableColumn<DashboardRecentCustomer>[] = [
    {
      key: 'name', header: t('table.customers.customer'),
      render: (r) => (
        <>
          <strong>{r.name}</strong>
          <span className={styles.phone}>{r.phone}</span>
        </>
      ),
    },
    { key: 'vehicleName',    header: t('table.customers.vehicle') },
    { key: 'registrationNo', header: t('table.customers.regNo')   },
    { key: 'totalJobs',      header: t('table.customers.jobs'), align: 'center' as const },
  ];

  return (
    <SectionCard>
      <SectionHeader
        title={t('sections.recentCustomers')}
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.CUSTOMERS)}>
            {t('viewAll')}
          </Button>
        }
      />
      <DataTable
        columns={customerColumns}
        data={data}
        isLoading={isLoading}
        emptyMessage={t('empty.customers')}
      />
    </SectionCard>
  );
}

/* ── Pending Claims ───────────────────────────────────────────────── */

interface PendingClaimsProps {
  data:      DashboardPendingClaim[];
  isLoading: boolean;
}

export function PendingClaims({ data, isLoading }: PendingClaimsProps) {
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard', 'claims']);

  const claimColumns: TableColumn<DashboardPendingClaim>[] = [
    { key: 'claimNumber',  header: t('table.claims.claimNo')  },
    { key: 'customerName', header: t('table.claims.customer') },
    {
      key: 'amount', header: t('table.claims.amount'), align: 'right' as const,
      render: (r) => `₹${r.amount.toLocaleString('en-IN')}`,
    },
    {
      key: 'daysPending', header: t('table.claims.days'), align: 'center' as const,
      render: (r) => (
        <span style={{ color: r.daysPending > 7 ? 'var(--color-danger-text)' : 'inherit', fontWeight: r.daysPending > 7 ? 700 : 400 }}>
          {r.daysPending}d
        </span>
      ),
    },
    {
      key: 'status', header: t('table.claims.status'),
      render: (r) => (
        <StatusBadge
          status={r.status}
          statusMap={CLAIM_STATUS_MAP}
          size="sm"
          getLabel={(s) => t(`status.${claimStatusKey(s)}`, { ns: 'claims' })}
        />
      ),
    },
  ];

  return (
    <SectionCard>
      <SectionHeader
        title={t('sections.pendingClaims')}
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.CLAIMS)}>
            {t('viewAll')}
          </Button>
        }
      />
      <DataTable
        columns={claimColumns}
        data={data}
        isLoading={isLoading}
        emptyMessage={t('empty.claims')}
      />
    </SectionCard>
  );
}

/* ── Recent Jobs ──────────────────────────────────────────────────── */

interface RecentJobsProps {
  data:      DashboardRecentJob[];
  isLoading: boolean;
}

export function RecentJobs({ data, isLoading }: RecentJobsProps) {
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard', 'jobs']);

  const jobColumns: TableColumn<DashboardRecentJob>[] = [
    { key: 'jobNumber',     header: t('table.jobs.jobNo')    },
    { key: 'customerName',  header: t('table.jobs.customer') },
    { key: 'vehicleName',   header: t('table.jobs.vehicle')  },
    { key: 'glassPosition', header: t('table.jobs.glass'),
      render: (r) => t(`glassPositions.${glassPositionKey(r.glassPosition)}`, { defaultValue: r.glassPosition }) },
    {
      key: 'scheduledDate', header: t('table.jobs.date'),
      render: (r) =>
        new Date(r.scheduledDate).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short',
        }),
    },
    {
      key: 'status', header: t('table.jobs.status'),
      render: (r) => (
        <StatusBadge
          status={r.status}
          statusMap={JOB_STATUS_MAP}
          size="sm"
          getLabel={(s) => t(`status.${jobStatusKey(s)}`, { ns: 'jobs' })}
        />
      ),
    },
  ];

  return (
    <SectionCard>
      <SectionHeader
        title={t('sections.recentJobs')}
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.JOBS)}>
            {t('viewAll')}
          </Button>
        }
      />
      <DataTable
        columns={jobColumns}
        data={data}
        isLoading={isLoading}
        emptyMessage={t('empty.jobs')}
      />
    </SectionCard>
  );
}

/* ── Composed two-column grid ─────────────────────────────────────── */

interface RecentActivityProps {
  recentCustomers: DashboardRecentCustomer[];
  pendingClaims:   DashboardPendingClaim[];
  recentJobs:      DashboardRecentJob[];
  isLoading:       boolean;
}

export function RecentActivity({ recentCustomers, pendingClaims, recentJobs, isLoading }: RecentActivityProps) {
  return (
    <>
      <div className={styles.grid}>
        <RecentCustomers data={recentCustomers} isLoading={isLoading} />
        <PendingClaims   data={pendingClaims}   isLoading={isLoading} />
      </div>
      <div className={styles.jobsGrid}>
        <RecentJobs data={recentJobs} isLoading={isLoading} />
      </div>
    </>
  );
}
