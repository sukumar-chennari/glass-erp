import { useState, useMemo } from 'react';
import { Wrench, CheckCircle2, AlertTriangle, Clock, UserPlus, PackageSearch, type LucideIcon } from 'lucide-react';
import { SectionCard, SectionHeader } from '@/components/layout/PageShell';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui/Toast';
import { JOB_STATUS, JOB_STATUS_MAP, TECH_STATUS, STOCK_STATUS } from '@/constants/statuses';
import { useGetJobsQuery, useUpdateJobMutation } from '@/features/jobs/services/jobsApi';
import { useGetTechniciansQuery } from '@/features/technicians/services/techniciansApi';
import { useGetStockQuery } from '@/features/stock/services/stockApi';
import { AssignTechnicianModal } from '@/features/jobs/components/AssignTechnicianModal';
import type { Job } from '@/types/models/job';
import type { TableColumn } from '@/types/ui';
import styles from './BranchManagerDashboard.module.css';

// TODO (backend): GET /dashboard/branch-summary?branchId=session.branchId

type ActiveJob = Job & { isOverdue: boolean };

interface DailyStat {
  id:    string;
  label: string;
  value: number;
  icon:  LucideIcon;
  cls:   string;
}

export function BranchManagerDashboard() {
  const toast = useToast();
  const { data: jobs = [] }        = useGetJobsQuery();
  const { data: technicians = [] } = useGetTechniciansQuery();
  const { data: stock = [] }       = useGetStockQuery();
  const [updateJob]                = useUpdateJobMutation();
  const [assignTarget, setAssign]  = useState<Job | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const activeJobs = useMemo(
    () => jobs.filter((j) =>
      j.status === JOB_STATUS.PENDING    ||
      j.status === JOB_STATUS.ASSIGNED   ||
      j.status === JOB_STATUS.ACCEPTED   ||
      j.status === JOB_STATUS.TRAVELLING ||
      j.status === JOB_STATUS.ARRIVED    ||
      j.status === JOB_STATUS.WORKING    ||
      j.status === JOB_STATUS.IN_PROGRESS||
      j.status === JOB_STATUS.ON_HOLD
    ),
    [jobs],
  );

  const activeJobRows = useMemo<ActiveJob[]>(
    () => activeJobs.map((j) => ({
      ...j,
      isOverdue: j.scheduledDate < today,
    })),
    [activeJobs, today],
  );

  const overdueJobs = useMemo(
    () => activeJobRows.filter((j) => j.isOverdue),
    [activeJobRows],
  );

  const techLoad = useMemo(() => {
    const map: Record<string, number> = {};
    activeJobs.forEach((j) => {
      if (j.technicianId) map[j.technicianId] = (map[j.technicianId] ?? 0) + 1;
    });
    return map;
  }, [activeJobs]);

  const techRows = useMemo(
    () => technicians
      .filter((t) => t.status === TECH_STATUS.ACTIVE || t.status === TECH_STATUS.TRAINING)
      .map((t) => ({
        ...t,
        currentJobs: techLoad[t.id] ?? 0,
        available:   (techLoad[t.id] ?? 0) === 0 && t.status === TECH_STATUS.ACTIVE,
      })),
    [technicians, techLoad],
  );

  const stockAlerts = useMemo(
    () => stock.filter(
      (s) => s.stockStatus === STOCK_STATUS.OUT_OF_STOCK || s.stockStatus === STOCK_STATUS.LOW_STOCK,
    ),
    [stock],
  );

  const dailyStats: DailyStat[] = [
    {
      id: 'active',   label: 'Active Jobs',
      value: activeJobs.length,
      icon: Wrench, cls: styles.statInfo,
    },
    {
      id: 'inprog',   label: 'In Progress',
      value: jobs.filter((j) =>
        j.status === JOB_STATUS.WORKING     ||
        j.status === JOB_STATUS.IN_PROGRESS ||
        j.status === JOB_STATUS.ARRIVED     ||
        j.status === JOB_STATUS.TRAVELLING  ||
        j.status === JOB_STATUS.ACCEPTED
      ).length,
      icon: Wrench, cls: styles.statWarning,
    },
    {
      id: 'done',     label: 'Completed Today',
      value: jobs.filter((j) => j.completedDate === today).length,
      icon: CheckCircle2, cls: styles.statSuccess,
    },
    {
      id: 'overdue',  label: 'Overdue',
      value: overdueJobs.length,
      icon: AlertTriangle, cls: styles.statDanger,
    },
  ];

  async function handleAssign(technicianId: string, technicianName: string) {
    if (!assignTarget) return;
    try {
      await updateJob({
        id: assignTarget.id,
        technicianId,
        status: JOB_STATUS.ASSIGNED,
      }).unwrap();
      toast.success(`${assignTarget.jobNumber} assigned to ${technicianName}.`);
      setAssign(null);
    } catch {
      toast.error('Failed to assign technician.');
    }
  }

  const jobColumns: TableColumn<ActiveJob>[] = [
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
    {
      key: 'technicianName',
      header: 'Technician',
      render: (j) =>
        j.technicianName
          ? <span>{j.technicianName}</span>
          : <span className={styles.unassigned}>Unassigned</span>,
    },
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
    {
      key: 'id',
      header: '',
      width: '110px',
      render: (j) =>
        j.status === JOB_STATUS.PENDING || j.status === JOB_STATUS.ASSIGNED ? (
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<UserPlus size={13} />}
            onClick={() => setAssign(j)}
          >
            {j.technicianId ? 'Reassign' : 'Assign'}
          </Button>
        ) : null,
    },
  ];

  return (
    <div className={styles.wrapper}>

      {/* Quick stats */}
      <div className={styles.statsGrid}>
        {dailyStats.map((stat) => {
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
                  <span className={styles.tatTech}>→ {j.technicianName ?? 'Unassigned'}</span>
                </div>
                <div className={styles.tatDate}>
                  Due {new Date(j.scheduledDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Stock alerts */}
      {stockAlerts.length > 0 && (
        <SectionCard>
          <SectionHeader title={`Stock Alerts (${stockAlerts.length})`} />
          <div className={styles.tatList}>
            {stockAlerts.map((s) => (
              <div key={s.id} className={`${styles.tatItem} ${s.stockStatus === STOCK_STATUS.OUT_OF_STOCK ? styles.tatItemDanger : ''}`}>
                <PackageSearch size={15} className={styles.tatIcon} />
                <div className={styles.tatBody}>
                  <span className={styles.tatJobNo}>{s.sku}</span>
                  <span>{s.productName}</span>
                </div>
                <div className={`${styles.tatDate} ${s.stockStatus === STOCK_STATUS.OUT_OF_STOCK ? styles.tatDateDanger : styles.tatDateWarn}`}>
                  {s.stockStatus === STOCK_STATUS.OUT_OF_STOCK ? 'Out of Stock' : `Low: ${s.currentQty} left`}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Active jobs table */}
      <SectionCard>
        <SectionHeader title={`Active Jobs (${activeJobRows.length})`} />
        <DataTable
          columns={jobColumns}
          data={activeJobRows}
          emptyMessage="No active jobs."
        />
      </SectionCard>

      {/* Technician status */}
      <SectionCard>
        <SectionHeader title="Technician Status" />
        <div className={styles.techGrid}>
          {techRows.map((tech) => (
            <div key={tech.id} className={styles.techCard}>
              <div className={styles.techAvatar}>{tech.name.charAt(0)}</div>
              <div className={styles.techInfo}>
                <div className={styles.techName}>{tech.name}</div>
                <div className={styles.techJobs}>
                  {tech.available
                    ? 'Available'
                    : tech.status === TECH_STATUS.TRAINING
                      ? 'In training'
                      : `${tech.currentJobs} active job${tech.currentJobs !== 1 ? 's' : ''}`}
                </div>
              </div>
              <Badge
                label={tech.available ? 'Free' : tech.status === TECH_STATUS.TRAINING ? 'Training' : 'Busy'}
                variant={tech.available ? 'success' : tech.status === TECH_STATUS.TRAINING ? 'info' : 'warning'}
                size="sm"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <AssignTechnicianModal
        job={assignTarget}
        isOpen={!!assignTarget}
        onClose={() => setAssign(null)}
        onAssign={handleAssign}
      />

    </div>
  );
}
