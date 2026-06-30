import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wrench, CheckCircle2, Clock, CarFront,
  UserCheck, Navigation, MapPin, Hammer,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { JOB_STATUS, JOB_STATUS_MAP } from '@/constants/statuses';
import { useGetJobsQuery, useUpdateJobMutation } from '../services/jobsApi';
import type { Job } from '@/types/models/job';
import styles from './TechnicianJobView.module.css';

type JobFilter = 'all' | 'active' | 'pending';

const FILTER_TABS: { id: JobFilter; label: string }[] = [
  { id: 'all',     label: 'All Jobs'  },
  { id: 'active',  label: 'Active'    },
  { id: 'pending', label: 'Pending'   },
];

// Statuses considered "active" (tech is in the execution flow)
const ACTIVE_STATUSES = new Set<string>([
  JOB_STATUS.ACCEPTED,
  JOB_STATUS.TRAVELLING,
  JOB_STATUS.ARRIVED,
  JOB_STATUS.WORKING,
  JOB_STATUS.IN_PROGRESS,
]);

// Ordered execution stages for the progress indicator
const STAGE_ORDER = [
  JOB_STATUS.ASSIGNED,
  JOB_STATUS.ACCEPTED,
  JOB_STATUS.TRAVELLING,
  JOB_STATUS.ARRIVED,
  JOB_STATUS.WORKING,
  JOB_STATUS.COMPLETED,
] as const;

export function TechnicianJobView() {
  const { t } = useTranslation(['jobs', 'common']);
  const toast  = useToast();

  const { data: jobs = [], isLoading } = useGetJobsQuery();
  const [updateJob] = useUpdateJobMutation();

  const [filter, setFilter] = useState<JobFilter>('all');

  // TODO (backend): filter by assignedTechnicianId = session.user.id
  const myJobs = useMemo(
    () => jobs.filter((j) =>
      j.status !== JOB_STATUS.CANCELLED && j.status !== JOB_STATUS.ON_HOLD
    ),
    [jobs],
  );

  const filtered = useMemo(() => {
    if (filter === 'all')    return myJobs;
    if (filter === 'active') return myJobs.filter((j) => ACTIVE_STATUSES.has(j.status));
    // pending tab: PENDING + ASSIGNED
    return myJobs.filter((j) =>
      j.status === JOB_STATUS.PENDING || j.status === JOB_STATUS.ASSIGNED
    );
  }, [myJobs, filter]);

  async function handleStatusAdvance(job: Job) {
    const nextStatus =
      job.status === JOB_STATUS.ASSIGNED    ? JOB_STATUS.ACCEPTED    :
      job.status === JOB_STATUS.ACCEPTED    ? JOB_STATUS.TRAVELLING  :
      job.status === JOB_STATUS.TRAVELLING  ? JOB_STATUS.ARRIVED     :
      job.status === JOB_STATUS.ARRIVED     ? JOB_STATUS.WORKING     :
      job.status === JOB_STATUS.WORKING     ? JOB_STATUS.COMPLETED   :
      job.status === JOB_STATUS.IN_PROGRESS ? JOB_STATUS.COMPLETED   :
      job.status === JOB_STATUS.PENDING     ? JOB_STATUS.WORKING     : null;

    if (!nextStatus) return;
    try {
      await updateJob({ id: job.id, status: nextStatus }).unwrap();
      const msgs: Partial<Record<string, string>> = {
        [JOB_STATUS.ACCEPTED]:   `Job ${job.jobNumber} accepted.`,
        [JOB_STATUS.TRAVELLING]: `Job ${job.jobNumber} — en route.`,
        [JOB_STATUS.ARRIVED]:    `Job ${job.jobNumber} — arrived on site.`,
        [JOB_STATUS.WORKING]:    `Job ${job.jobNumber} — work started.`,
        [JOB_STATUS.COMPLETED]:  `Job ${job.jobNumber} marked complete.`,
      };
      toast.success(msgs[nextStatus] ?? `Job ${job.jobNumber} updated.`);
    } catch {
      toast.error(t('common:messages.saveFailed', 'Failed to update job.'));
    }
  }

  const workingCount  = myJobs.filter((j) => ACTIVE_STATUSES.has(j.status)).length;
  const assignedCount = myJobs.filter((j) => j.status === JOB_STATUS.ASSIGNED).length;
  const pendingCount  = myJobs.filter((j) => j.status === JOB_STATUS.PENDING).length;

  return (
    <PageShell
      heading="My Jobs"
      description="Jobs assigned to you — accept, travel, arrive, work, complete."
    >
      {/* Summary chips */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryChip}>
          <Wrench size={13} />
          {workingCount} active
        </div>
        {assignedCount > 0 && (
          <div className={`${styles.summaryChip} ${styles.assignedChip}`}>
            <UserCheck size={13} />
            {assignedCount} assigned
          </div>
        )}
        {pendingCount > 0 && (
          <div className={styles.summaryChip}>
            <Clock size={13} />
            {pendingCount} pending
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className={styles.filterBar}>
        {FILTER_TABS.map((tab) => {
          const count =
            tab.id === 'all'    ? myJobs.length  :
            tab.id === 'active' ? workingCount   :
            assignedCount + pendingCount;
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
  const isCompleted  = job.status === JOB_STATUS.COMPLETED;
  const isAssigned   = job.status === JOB_STATUS.ASSIGNED;
  const isAccepted   = job.status === JOB_STATUS.ACCEPTED;
  const isTravelling = job.status === JOB_STATUS.TRAVELLING;
  const isArrived    = job.status === JOB_STATUS.ARRIVED;
  const isWorking    = job.status === JOB_STATUS.WORKING || job.status === JOB_STATUS.IN_PROGRESS;

  const ctaLabel =
    isAssigned   ? 'Accept Job'     :
    isAccepted   ? 'En Route'       :
    isTravelling ? 'Arrived'        :
    isArrived    ? 'Start Work'     :
    isWorking    ? 'Mark Complete'  :
    'Start Work';

  const ctaVariant: 'primary' | 'accent' | 'secondary' =
    isWorking  ? 'primary' :
    isAssigned ? 'accent'  : 'secondary';

  const ctaIcon =
    isAssigned   ? <UserCheck   size={14} /> :
    isAccepted   ? <Navigation  size={14} /> :
    isTravelling ? <MapPin      size={14} /> :
    isArrived    ? <Hammer      size={14} /> :
    isWorking    ? <CheckCircle2 size={14} /> :
    <Wrench size={14} />;

  // Current step index in the execution flow
  const currentStageIdx = STAGE_ORDER.indexOf(job.status as typeof STAGE_ORDER[number]);

  return (
    <div className={`
      ${styles.card}
      ${isCompleted  ? styles.cardCompleted  : ''}
      ${isAssigned   ? styles.cardAssigned   : ''}
      ${isWorking    ? styles.cardWorking    : ''}
      ${isTravelling || isAccepted || isArrived ? styles.cardInTransit : ''}
    `}>
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

      {/* Stage progress dots */}
      {currentStageIdx >= 0 && (
        <div className={styles.stageBar}>
          {STAGE_ORDER.map((stage, i) => (
            <div
              key={stage}
              className={`${styles.stageDot} ${
                i < currentStageIdx  ? styles.stageDotDone    :
                i === currentStageIdx ? styles.stageDotActive :
                styles.stageDotPending
              }`}
              title={stage}
            />
          ))}
        </div>
      )}

      {/* Stage history — show last event timestamp */}
      {job.stageHistory && job.stageHistory.length > 1 && (
        <div className={styles.stageTs}>
          <Clock size={11} />
          {job.stageHistory[job.stageHistory.length - 1].stage} ·{' '}
          {new Date(job.stageHistory[job.stageHistory.length - 1].at).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit',
          })}
        </div>
      )}

      {!isCompleted && (
        <Button
          size="sm"
          fullWidth
          variant={ctaVariant}
          onClick={() => onAdvance(job)}
          leftIcon={ctaIcon}
        >
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
