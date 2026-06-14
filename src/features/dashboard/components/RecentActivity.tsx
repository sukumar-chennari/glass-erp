import { useNavigate }  from 'react-router-dom';
import { SectionCard, SectionHeader } from '@/components/layout/PageShell';
import { DataTable }    from '@/components/ui/DataTable';
import { Button }       from '@/components/ui/Button';
import { StatusBadge }  from '@/components/ui/Badge';
import { JOB_STATUS_MAP, CLAIM_STATUS_MAP } from '@/constants/statuses';
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

const customerColumns: TableColumn<DashboardRecentCustomer>[] = [
  {
    key: 'name', header: 'Customer',
    render: (r) => (
      <>
        <strong>{r.name}</strong>
        <span className={styles.phone}>{r.phone}</span>
      </>
    ),
  },
  { key: 'vehicleName',    header: 'Vehicle'       },
  { key: 'registrationNo', header: 'Reg. No.'      },
  { key: 'totalJobs',      header: 'Jobs', align: 'center' as const },
];

export function RecentCustomers({ data, isLoading }: RecentCustomersProps) {
  const navigate = useNavigate();

  return (
    <SectionCard>
      <SectionHeader
        title="Recent Customers"
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.CUSTOMERS)}>
            View All
          </Button>
        }
      />
      <DataTable
        columns={customerColumns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No customers yet."
      />
    </SectionCard>
  );
}

/* ── Pending Claims ───────────────────────────────────────────────── */

interface PendingClaimsProps {
  data:      DashboardPendingClaim[];
  isLoading: boolean;
}

const claimColumns: TableColumn<DashboardPendingClaim>[] = [
  { key: 'claimNumber',   header: 'Claim #'  },
  { key: 'customerName',  header: 'Customer' },
  {
    key: 'amount', header: 'Amount', align: 'right' as const,
    render: (r) => `₹${r.amount.toLocaleString('en-IN')}`,
  },
  {
    key: 'daysPending', header: 'Days', align: 'center' as const,
    render: (r) => (
      <span style={{ color: r.daysPending > 7 ? 'var(--color-danger-text)' : 'inherit', fontWeight: r.daysPending > 7 ? 700 : 400 }}>
        {r.daysPending}d
      </span>
    ),
  },
  {
    key: 'status', header: 'Status',
    render: (r) => <StatusBadge status={r.status} statusMap={CLAIM_STATUS_MAP} size="sm" />,
  },
];

export function PendingClaims({ data, isLoading }: PendingClaimsProps) {
  const navigate = useNavigate();

  return (
    <SectionCard>
      <SectionHeader
        title="Pending Claims"
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.CLAIMS)}>
            View All
          </Button>
        }
      />
      <DataTable
        columns={claimColumns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No pending claims."
      />
    </SectionCard>
  );
}

/* ── Recent Jobs ──────────────────────────────────────────────────── */

interface RecentJobsProps {
  data:      DashboardRecentJob[];
  isLoading: boolean;
}

const jobColumns: TableColumn<DashboardRecentJob>[] = [
  { key: 'jobNumber',     header: 'Job #'    },
  { key: 'customerName',  header: 'Customer' },
  { key: 'vehicleName',   header: 'Vehicle'  },
  { key: 'glassPosition', header: 'Glass'    },
  {
    key: 'scheduledDate', header: 'Date',
    render: (r) =>
      new Date(r.scheduledDate).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short',
      }),
  },
  {
    key: 'status', header: 'Status',
    render: (r) => <StatusBadge status={r.status} statusMap={JOB_STATUS_MAP} size="sm" />,
  },
];

export function RecentJobs({ data, isLoading }: RecentJobsProps) {
  const navigate = useNavigate();

  return (
    <SectionCard>
      <SectionHeader
        title="Recent Job Cards"
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.JOBS)}>
            View All
          </Button>
        }
      />
      <DataTable
        columns={jobColumns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No recent jobs."
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
