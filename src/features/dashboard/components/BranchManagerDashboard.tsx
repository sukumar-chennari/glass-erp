import { MessageSquare, Wrench, CheckCircle2, XCircle, AlertTriangle, Clock, type LucideIcon } from 'lucide-react';
import { SectionCard, SectionHeader } from '@/components/layout/PageShell';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { JOB_STATUS_MAP } from '@/constants/statuses';
import type { TableColumn } from '@/types/ui';
import styles from './BranchManagerDashboard.module.css';

// ── Inline mock data (replace with API calls when backend is ready) ───
// TODO (backend): GET /dashboard/branch-summary?date=today

interface DailyStat {
  id:    string;
  label: string;
  value: number;
  icon:  LucideIcon;
  cls:   string;
}

const DAILY_STATS: DailyStat[] = [
  { id: 'enquiries',  label: 'Enquiries Today', value: 8,  icon: MessageSquare, cls: styles.statInfo    },
  { id: 'inprogress', label: 'In Progress',     value: 3,  icon: Wrench,        cls: styles.statWarning },
  { id: 'completed',  label: 'Completed Today', value: 5,  icon: CheckCircle2,  cls: styles.statSuccess },
  { id: 'lost',       label: 'Lost Leads',      value: 1,  icon: XCircle,       cls: styles.statDanger  },
];

interface ActiveJob {
  id:            string;
  jobNumber:     string;
  customerName:  string;
  vehicleName:   string;
  glassPosition: string;
  technicianName:string;
  status:        string;
  scheduledDate: string;
  isOverdue:     boolean;
}

const ACTIVE_JOBS: ActiveJob[] = [
  { id: 'j-001', jobNumber: 'JC-2025-0847', customerName: 'Ravi Kumar',    vehicleName: 'Honda City 2020',      glassPosition: 'Front Windshield',      technicianName: 'Arun Mehta',  status: 'In Progress', scheduledDate: '2026-06-29', isOverdue: false },
  { id: 'j-003', jobNumber: 'JC-2025-0845', customerName: 'Priya Sharma',  vehicleName: 'Maruti Swift 2018',    glassPosition: 'Rear Windshield',       technicianName: 'Deepak Rao',  status: 'Pending',     scheduledDate: '2026-06-29', isOverdue: false },
  { id: 'j-005', jobNumber: 'JC-2025-0843', customerName: 'Suresh Reddy',  vehicleName: 'Kia Seltos 2023',      glassPosition: 'Front Windshield',      technicianName: 'Kiran Desai', status: 'In Progress', scheduledDate: '2026-06-29', isOverdue: false },
  { id: 'j-006', jobNumber: 'JC-2025-0842', customerName: 'Ravi Kumar',    vehicleName: 'Honda City 2020',      glassPosition: 'Passenger Side Window', technicianName: 'Deepak Rao',  status: 'On Hold',     scheduledDate: '2026-06-25', isOverdue: true  },
];

interface TechAvailability {
  id:          string;
  name:        string;
  currentJobs: number;
  available:   boolean;
}

const TECH_STATUS: TechAvailability[] = [
  { id: 't-001', name: 'Arun Mehta',  currentJobs: 2, available: false },
  { id: 't-002', name: 'Kiran Desai', currentJobs: 1, available: false },
  { id: 't-003', name: 'Deepak Rao',  currentJobs: 2, available: false },
  { id: 't-004', name: 'Vijay R.',    currentJobs: 0, available: true  },
];

// ── Table columns ──────────────────────────────────────────────────────
const JOB_COLUMNS: TableColumn<ActiveJob>[] = [
  {
    key: 'jobNumber',
    header: 'Job',
    width: '130px',
    render: (j) => (
      <div>
        <div className={styles.jobNo}>{j.jobNumber}</div>
        {j.isOverdue && (
          <div className={styles.overdueChip}>
            <AlertTriangle size={11} />
            Overdue
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'customerName',
    header: 'Customer',
    render: (j) => (
      <div>
        <div className={styles.cellBold}>{j.customerName}</div>
        <div className={styles.cellMuted}>{j.vehicleName}</div>
      </div>
    ),
  },
  { key: 'glassPosition', header: 'Glass' },
  { key: 'technicianName', header: 'Technician' },
  {
    key: 'status',
    header: 'Status',
    render: (j) => <StatusBadge status={j.status} statusMap={JOB_STATUS_MAP} size="sm" />,
  },
  {
    key: 'scheduledDate',
    header: 'Scheduled',
    render: (j) => (
      <div className={`${styles.schedDate} ${j.isOverdue ? styles.schedOverdue : ''}`}>
        <Clock size={12} />
        {new Date(j.scheduledDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
      </div>
    ),
  },
];

// ── Component ──────────────────────────────────────────────────────────
export function BranchManagerDashboard() {
  const overdueJobs = ACTIVE_JOBS.filter((j) => j.isOverdue);

  return (
    <div className={styles.wrapper}>

      {/* Today's quick stats */}
      <div className={styles.statsGrid}>
        {DAILY_STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className={styles.statCard}>
              <div className={`${styles.statIcon} ${stat.cls}`}>
                <Icon size={18} />
              </div>
              <div className={styles.statBody}>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* TAT alerts */}
      {overdueJobs.length > 0 && (
        <SectionCard>
          <SectionHeader title="TAT Alerts" />
          <div className={styles.tatList}>
            {overdueJobs.map((j) => (
              <div key={j.id} className={styles.tatItem}>
                <AlertTriangle size={15} className={styles.tatIcon} />
                <div className={styles.tatBody}>
                  <span className={styles.tatJobNo}>{j.jobNumber}</span>
                  <span>{j.customerName} · {j.glassPosition}</span>
                  <span className={styles.tatTech}>→ {j.technicianName}</span>
                </div>
                <div className={styles.tatDate}>
                  Scheduled {new Date(j.scheduledDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Active jobs table */}
      <SectionCard>
        <SectionHeader title="Active Jobs" />
        <DataTable
          columns={JOB_COLUMNS}
          data={ACTIVE_JOBS}
          emptyMessage="No active jobs today."
        />
      </SectionCard>

      {/* Technician availability */}
      <SectionCard>
        <SectionHeader title="Technician Status" />
        <div className={styles.techGrid}>
          {TECH_STATUS.map((tech) => (
            <div key={tech.id} className={styles.techCard}>
              <div className={styles.techAvatar}>
                {tech.name.charAt(0)}
              </div>
              <div className={styles.techInfo}>
                <div className={styles.techName}>{tech.name}</div>
                <div className={styles.techJobs}>
                  {tech.available
                    ? 'Available'
                    : `${tech.currentJobs} active job${tech.currentJobs !== 1 ? 's' : ''}`}
                </div>
              </div>
              <Badge
                label={tech.available ? 'Free' : 'Busy'}
                variant={tech.available ? 'success' : 'warning'}
                size="sm"
              />
            </div>
          ))}
        </div>
      </SectionCard>

    </div>
  );
}
