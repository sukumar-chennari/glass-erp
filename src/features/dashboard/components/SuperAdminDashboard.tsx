import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, Wrench, Clock,
  Building2, Users, Tag, PackageSearch, ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { SectionCard, SectionHeader } from '@/components/layout/PageShell';
import { StatusBadge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { SendWhatsAppModal } from '@/features/whatsapp/SendWhatsAppModal';
import { WhatsAppFab } from '@/features/whatsapp/WhatsAppFab';
import { JOB_STATUS, JOB_STATUS_MAP, STOCK_STATUS } from '@/constants/statuses';
import { useGetJobsQuery } from '@/features/jobs/services/jobsApi';
import { useGetStockQuery } from '@/features/stock/services/stockApi';
import { useGetBranchPerformanceQuery } from '@/features/dashboard/services/adminSummaryApi';
import { ROUTES } from '@/constants/routes';
import type { Job } from '@/types/models/job';
import type { TableColumn } from '@/types/ui';
import styles from './SuperAdminDashboard.module.css';

// TODO (backend): GET /dashboard/admin-summary — real-time cross-branch KPIs

interface StatCard {
  label: string;
  value: number;
  icon:  LucideIcon;
  cls:   string;
}

const QUICK_LINKS: Array<{ icon: LucideIcon; label: string; desc: string; href: string }> = [
  { icon: Building2, label: 'Branches', desc: 'Manage locations & managers', href: ROUTES.SETTINGS_BRANCHES },
  { icon: Users,     label: 'Users',    desc: 'Manage staff accounts',       href: ROUTES.SETTINGS_USERS    },
  { icon: Tag,       label: 'Pricing',  desc: 'Configure glass rates',       href: ROUTES.SETTINGS_PRICING  },
];

const OVERDUE_COLUMNS: TableColumn<Job>[] = [
  {
    key: 'jobNumber',
    header: 'Job #',
    render: (j) => <span className={styles.jobNum}>{j.jobNumber}</span>,
  },
  {
    key: 'customerName',
    header: 'Customer / Vehicle',
    render: (j) => (
      <div>
        <div className={styles.cellPrimary}>{j.customerName}</div>
        <div className={styles.cellMuted}>{j.vehicleName} · {j.glassPosition}</div>
      </div>
    ),
  },
  {
    key: 'scheduledDate',
    header: 'Scheduled',
    render: (j) => <span className={styles.overdueDate}>{j.scheduledDate}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    render: (j) => <StatusBadge status={j.status} statusMap={JOB_STATUS_MAP} size="sm" />,
  },
];

export function SuperAdminDashboard() {
  const { data: jobs      = [] } = useGetJobsQuery();
  const { data: stock     = [] } = useGetStockQuery();
  const { data: branchPerf = [] } = useGetBranchPerformanceQuery();
  const [waOpen, setWaOpen] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const activeJobs = useMemo(
    () => jobs.filter((j) =>
      j.status === JOB_STATUS.PENDING     ||
      j.status === JOB_STATUS.ASSIGNED    ||
      j.status === JOB_STATUS.ACCEPTED    ||
      j.status === JOB_STATUS.TRAVELLING  ||
      j.status === JOB_STATUS.ARRIVED     ||
      j.status === JOB_STATUS.WORKING     ||
      j.status === JOB_STATUS.IN_PROGRESS ||
      j.status === JOB_STATUS.ON_HOLD,
    ),
    [jobs],
  );

  const inProgress = useMemo(
    () => jobs.filter((j) =>
      j.status === JOB_STATUS.WORKING     ||
      j.status === JOB_STATUS.IN_PROGRESS ||
      j.status === JOB_STATUS.TRAVELLING  ||
      j.status === JOB_STATUS.ARRIVED,
    ),
    [jobs],
  );

  const completedToday = useMemo(
    () => jobs.filter((j) =>
      j.status === JOB_STATUS.COMPLETED &&
      (j.completedDate?.slice(0, 10) === today || j.scheduledDate === today),
    ),
    [jobs, today],
  );

  const overdueJobs = useMemo(
    () => activeJobs.filter((j) => j.scheduledDate < today),
    [activeJobs, today],
  );

  const stockAlerts = useMemo(
    () => stock.filter((s) =>
      s.stockStatus === STOCK_STATUS.OUT_OF_STOCK ||
      s.stockStatus === STOCK_STATUS.LOW_STOCK,
    ),
    [stock],
  );

  const stats: StatCard[] = [
    { label: 'Active Jobs',      value: activeJobs.length,     icon: Wrench,        cls: styles.statBlue  },
    { label: 'In Progress',      value: inProgress.length,     icon: Clock,         cls: styles.statAmber },
    { label: 'Completed Today',  value: completedToday.length, icon: CheckCircle2,  cls: styles.statGreen },
    { label: 'Overdue Alerts',   value: overdueJobs.length,    icon: AlertTriangle, cls: styles.statRed   },
  ];

  const totalRevenue = branchPerf.reduce((a, b) => a + b.revenue, 0);

  return (
    <>
      {/* ── Head Office Stats ─────────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`${styles.statCard} ${s.cls}`}>
              <div className={styles.statIcon}><Icon size={20} /></div>
              <div className={styles.statBody}>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Branch Performance ───────────────────────────────────────────── */}
      <SectionCard>
        <SectionHeader title="Branch Performance — Today" />
        <div className={styles.tableWrap}>
          <table className={styles.perfTable}>
            <thead>
              <tr>
                <th>Branch</th>
                <th className={styles.numTh}>Jobs</th>
                <th className={styles.numTh}>Completed</th>
                <th className={styles.numTh}>Revenue (₹)</th>
                <th className={styles.numTh}>Overdue</th>
              </tr>
            </thead>
            <tbody>
              {branchPerf.map((b) => (
                <tr key={b.id}>
                  <td className={styles.branchCell}>{b.name}</td>
                  <td className={styles.numTd}>{b.jobs}</td>
                  <td className={styles.numTd}>
                    <span className={styles.completedVal}>{b.completed}</span>
                  </td>
                  <td className={styles.numTd}>{b.revenue.toLocaleString('en-IN')}</td>
                  <td className={styles.numTd}>
                    {b.overdue > 0
                      ? <span className={styles.overdueChip}>{b.overdue}</span>
                      : <span className={styles.okMark}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={styles.totalRow}>
                <td>All Branches</td>
                <td className={styles.numTd}>{branchPerf.reduce((a, b) => a + b.jobs, 0)}</td>
                <td className={styles.numTd}>{branchPerf.reduce((a, b) => a + b.completed, 0)}</td>
                <td className={styles.numTd}>{totalRevenue.toLocaleString('en-IN')}</td>
                <td className={styles.numTd}>{branchPerf.reduce((a, b) => a + b.overdue, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionCard>

      {/* ── TAT Alerts ───────────────────────────────────────────────────── */}
      {overdueJobs.length > 0 && (
        <SectionCard>
          <SectionHeader
            title={`TAT Alerts — ${overdueJobs.length} overdue ${overdueJobs.length === 1 ? 'job' : 'jobs'}`}
            actions={
              <Link to={ROUTES.JOBS} className={styles.viewAllLink}>
                View all jobs →
              </Link>
            }
          />
          <DataTable columns={OVERDUE_COLUMNS} data={overdueJobs} />
        </SectionCard>
      )}

      {/* ── Stock Alerts ─────────────────────────────────────────────────── */}
      {stockAlerts.length > 0 && (
        <SectionCard>
          <SectionHeader title={`Stock Alerts — ${stockAlerts.length} ${stockAlerts.length === 1 ? 'item' : 'items'}`} />
          <div className={styles.alertList}>
            {stockAlerts.map((s) => (
              <div
                key={s.id}
                className={`${styles.alertRow} ${s.stockStatus === STOCK_STATUS.OUT_OF_STOCK ? styles.alertOos : styles.alertLow}`}
              >
                <PackageSearch size={13} />
                <span>
                  <strong>{s.productName}</strong>
                  {s.stockStatus === STOCK_STATUS.OUT_OF_STOCK
                    ? ' — Out of Stock'
                    : ` — Low Stock (${s.currentQty} remaining)`}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── WhatsApp CTA ─────────────────────────────────────────────────── */}
      <div className={styles.waBanner}>
        <div className={styles.waBannerIcon}>
          <WhatsAppIcon size={22} />
        </div>
        <div className={styles.waBannerBody}>
          <p className={styles.waBannerTitle}>Send Booking Form via WhatsApp</p>
          <p className={styles.waBannerDesc}>Share the customer booking form instantly — just enter their number and name.</p>
        </div>
        <button className={styles.waBannerBtn} onClick={() => setWaOpen(true)}>
          <WhatsAppIcon size={15} />
          Send Form Link
        </button>
      </div>

      {/* ── Admin Quick Access ───────────────────────────────────────────── */}
      <SectionCard>
        <SectionHeader title="Admin Quick Access" />
        <div className={styles.quickLinks}>
          {QUICK_LINKS.map((ql) => {
            const Icon = ql.icon;
            return (
              <Link key={ql.href} to={ql.href} className={styles.quickLink}>
                <div className={styles.quickIcon}><Icon size={18} /></div>
                <div className={styles.quickBody}>
                  <span className={styles.quickLabel}>{ql.label}</span>
                  <span className={styles.quickDesc}>{ql.desc}</span>
                </div>
                <ArrowRight size={14} className={styles.quickArrow} />
              </Link>
            );
          })}
        </div>
      </SectionCard>

      <SendWhatsAppModal isOpen={waOpen} onClose={() => setWaOpen(false)} />
      <WhatsAppFab onClick={() => setWaOpen(true)} />
    </>
  );
}
