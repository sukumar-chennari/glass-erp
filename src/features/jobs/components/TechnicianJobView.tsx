import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench, CheckCircle2, Clock, CarFront } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { JOB_STATUS, JOB_STATUS_MAP } from '@/constants/statuses';
import { useGetJobsQuery, useUpdateJobMutation } from '../services/jobsApi';
import type { Job } from '@/types/models/job';
import styles from './TechnicianJobView.module.css';

type JobFilter = 'all' | 'in_progress' | 'pending';

const FILTER_TABS: { id: JobFilter; label: string }[] = [
  { id: 'all',         label: 'All Jobs'    },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'pending',     label: 'Pending'     },
];

export function TechnicianJobView() {
  const { t } = useTranslation(['jobs', 'common']);
  const toast  = useToast();

  const { data: jobs = [], isLoading } = useGetJobsQuery();
  const [updateJob] = useUpdateJobMutation();

  const [filter, setFilter] = useState<JobFilter>('all');

  // Technicians only see non-cancelled, non-on-hold jobs
  // TODO (backend): filter by assignedTechnicianId = session.user.id
  const myJobs = useMemo(
    () => jobs.filter((j) =>
      j.status !== JOB_STATUS.CANCELLED && j.status !== JOB_STATUS.ON_HOLD
    ),
    [jobs],
  );

  const filtered = useMemo(() => {
    if (filter === 'all')         return myJobs;
    if (filter === 'in_progress') return myJobs.filter((j) => j.status === JOB_STATUS.IN_PROGRESS);
    return myJobs.filter((j) => j.status === JOB_STATUS.PENDING);
  }, [myJobs, filter]);

  async function handleStatusAdvance(job: Job) {
    const nextStatus =
      job.status === JOB_STATUS.PENDING     ? JOB_STATUS.IN_PROGRESS :
      job.status === JOB_STATUS.IN_PROGRESS ? JOB_STATUS.COMPLETED   : null;

    if (!nextStatus) return;
    try {
      await updateJob({ id: job.id, status: nextStatus }).unwrap();
      if (nextStatus === JOB_STATUS.COMPLETED) {
        toast.success(`Job ${job.jobNumber} marked complete.`);
      } else {
        toast.success(`Job ${job.jobNumber} started.`);
      }
    } catch {
      toast.error(t('common:messages.saveFailed', 'Failed to update job.'));
    }
  }

  const inProgressCount = myJobs.filter((j) => j.status === JOB_STATUS.IN_PROGRESS).length;
  const pendingCount    = myJobs.filter((j) => j.status === JOB_STATUS.PENDING).length;

  return (
    <PageShell
      heading="My Jobs"
      description="Jobs assigned to you — tap to start or mark complete."
    >
      {/* Summary chips */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryChip}>
          <Wrench size={13} />
          {inProgressCount} in progress
        </div>
        <div className={styles.summaryChip}>
          <Clock size={13} />
          {pendingCount} pending
        </div>
      </div>

      {/* Filter tabs */}
      <div className={styles.filterBar}>
        {FILTER_TABS.map((tab) => {
          const count =
            tab.id === 'all'         ? myJobs.length :
            tab.id === 'in_progress' ? inProgressCount : pendingCount;
          return (
            <button
              key={tab.id}
              className={`${styles.filterTab} ${filter === tab.id ? styles.filterActive : ''}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
              <span className={styles.tabCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Job cards */}
      {isLoading ? (
        <div className={styles.grid}>
          {[1, 2, 3].map((n) => <div key={n} className={styles.skeleton} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <CheckCircle2 size={40} />
          <p>No jobs to show here.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} onAdvance={handleStatusAdvance} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

// ── Job Card ──────────────────────────────────────────────────────────
interface JobCardProps {
  job:       Job;
  onAdvance: (job: Job) => void;
}

function JobCard({ job, onAdvance }: JobCardProps) {
  const isCompleted = job.status === JOB_STATUS.COMPLETED;

  return (
    <div className={`${styles.card} ${isCompleted ? styles.cardCompleted : ''}`}>
      <div className={styles.cardHeader}>
        <span className={styles.jobNo}>{job.jobNumber}</span>
        <StatusBadge status={job.status} statusMap={JOB_STATUS_MAP} />
      </div>

      <div className={styles.customerName}>{job.customerName}</div>

      <div className={styles.vehicleRow}>
        <CarFront size={13} className={styles.vehicleIcon} />
        <span>{job.vehicleName}</span>
        <span className={styles.regNo}>{job.registrationNo}</span>
      </div>

      <div className={styles.glassRow}>
        <span className={styles.glassChip}>{job.glassPosition}</span>
        <span className={styles.damageType}>{job.damageType}</span>
      </div>

      <div className={styles.scheduled}>
        <Clock size={12} />
        {new Date(job.scheduledDate).toLocaleDateString('en-IN', {
          weekday: 'short', month: 'short', day: 'numeric',
        })}
      </div>

      {!isCompleted && (
        <Button
          size="sm"
          fullWidth
          variant={job.status === JOB_STATUS.IN_PROGRESS ? 'primary' : 'secondary'}
          onClick={() => onAdvance(job)}
          leftIcon={job.status === JOB_STATUS.IN_PROGRESS ? <CheckCircle2 size={14} /> : <Wrench size={14} />}
        >
          {job.status === JOB_STATUS.PENDING ? 'Start Work' : 'Mark Complete'}
        </Button>
      )}
    </div>
  );
}
