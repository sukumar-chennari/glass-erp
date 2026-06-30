import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, MapPin, Phone, MessageCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import styles from './CustomerTrackPage.module.css';

// ── Mock data — in production this would be GET /submissions/:ref ─────────────

interface TrackRecord {
  ref:        string;
  name:       string;
  vehicle:    string;
  glassPos:   string;
  branch:     string;
  branchPhone:string;
  branchHours:string;
  milestones: Milestone[];
}

interface Milestone {
  id:        string;
  label:     string;
  detail?:   string;
  done:      boolean;
  active:    boolean;
  timestamp?: string;
}

function makeMilestones(ref: string): Milestone[] {
  // Seed from ref string so demo data is stable per reference
  const hash = ref.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const stage = hash % 5; // 0=submitted, 1=reviewed, 2=scheduled, 3=in-progress, 4=completed

  return [
    {
      id: 'submitted', label: 'Request Submitted', done: stage >= 0, active: stage === 0,
      timestamp: stage >= 0 ? 'Today, 10:32 AM' : undefined,
      detail: 'Your request has been received.',
    },
    {
      id: 'reviewed', label: 'Reviewed by Team', done: stage >= 1, active: stage === 1,
      timestamp: stage >= 1 ? 'Today, 11:15 AM' : undefined,
      detail: 'Our team has reviewed your details.',
    },
    {
      id: 'scheduled', label: 'Appointment Scheduled', done: stage >= 2, active: stage === 2,
      timestamp: stage >= 2 ? 'Today, 11:45 AM' : undefined,
      detail: 'Your appointment has been confirmed.',
    },
    {
      id: 'assigned', label: 'Technician Assigned', done: stage >= 3, active: stage === 3,
      timestamp: stage >= 3 ? 'Today, 02:10 PM' : undefined,
      detail: 'A technician has been assigned to your job.',
    },
    {
      id: 'inprogress', label: 'Service in Progress', done: stage >= 4, active: false,
      detail: 'Glass replacement / repair is underway.',
    },
    {
      id: 'completed', label: 'Job Completed', done: false, active: false,
      detail: 'Service complete. Enjoy the road!',
    },
  ];
}

const DEMO_RECORDS: Record<string, TrackRecord> = {
  'SUB-DEMO1': {
    ref: 'SUB-DEMO1',
    name: 'Ravi Kumar',
    vehicle: 'Maruti Suzuki Swift (2022) · TS09AX1234',
    glassPos: 'Front Windshield · Crack',
    branch: 'WindX Banjara Hills',
    branchPhone: '040-23456789',
    branchHours: 'Mon–Sat 9:00 AM – 8:00 PM',
    milestones: makeMilestones('SUB-DEMO1'),
  },
};

function buildRecord(ref: string): TrackRecord | null {
  if (DEMO_RECORDS[ref]) return DEMO_RECORDS[ref];
  // Accept any valid-looking SUB- reference for demo purposes
  if (/^SUB-[A-Z0-9]{5}$/.test(ref)) {
    return {
      ref,
      name: 'Customer',
      vehicle: 'Vehicle details loading…',
      glassPos: '—',
      branch: 'WindX Banjara Hills',
      branchPhone: '040-23456789',
      branchHours: 'Mon–Sat 9:00 AM – 8:00 PM',
      milestones: makeMilestones(ref),
    };
  }
  return null;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function CustomerTrackPage() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref') ?? '';

  const record = ref ? buildRecord(ref) : null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.logo}>WindX Glass</div>
        <div className={styles.headerSub}>Track Your Request</div>
      </div>

      <div className={styles.content}>
        {!ref && <NoRefState />}
        {ref && !record && <NotFoundState refNo={ref} />}
        {record && <TrackView record={record} />}
      </div>
    </div>
  );
}

// ── Sub-views ─────────────────────────────────────────────────────────────────

function NoRefState() {
  return (
    <div className={styles.stateBox}>
      <AlertTriangle size={40} className={styles.iconWarning} />
      <h2 className={styles.stateTitle}>No reference provided</h2>
      <p className={styles.stateDesc}>
        Open the tracking link from your WhatsApp confirmation message,
        or enter your reference number to search.
      </p>
      <a href={ROUTES.SUBMIT} className={styles.ctaLink}>
        Submit a new request
        <ChevronRight size={14} />
      </a>
    </div>
  );
}

function NotFoundState({ refNo }: { refNo: string }) {
  return (
    <div className={styles.stateBox}>
      <AlertTriangle size={40} className={styles.iconDanger} />
      <h2 className={styles.stateTitle}>Reference not found</h2>
      <p className={styles.stateDesc}>
        We couldn't find a request with reference <strong>{refNo}</strong>.
        Please check the link in your WhatsApp message or contact us.
      </p>
      <a href="tel:04023456789" className={styles.phoneLink}>
        <Phone size={15} />
        040-23456789
      </a>
    </div>
  );
}

function TrackView({ record }: { record: TrackRecord }) {
  const activeIdx = record.milestones.findIndex((m) => m.active);
  const allDone   = record.milestones.every((m) => m.done);

  return (
    <>
      {/* Reference card */}
      <div className={styles.refCard}>
        <div className={styles.refMeta}>
          <span className={styles.refLabel}>Reference</span>
          <span className={styles.refNo}>{record.ref}</span>
        </div>
        {allDone && <span className={styles.completedBadge}><CheckCircle2 size={12} /> Completed</span>}
        {!allDone && activeIdx >= 0 && (
          <span className={styles.activeBadge}>
            <Clock size={12} />
            {record.milestones[activeIdx]?.label}
          </span>
        )}
      </div>

      {/* Job summary */}
      <div className={styles.summaryCard}>
        <div className={styles.summaryRow}><span>Customer</span><span>{record.name}</span></div>
        <div className={styles.summaryRow}><span>Vehicle</span><span>{record.vehicle}</span></div>
        <div className={styles.summaryRow}><span>Service</span><span>{record.glassPos}</span></div>
      </div>

      {/* Timeline */}
      <div className={styles.sectionTitle}>Progress</div>
      <div className={styles.timeline}>
        {record.milestones.map((m, idx) => {
          const isLast = idx === record.milestones.length - 1;
          const dotClass = m.done ? styles.dotDone : m.active ? styles.dotActive : styles.dotPending;
          return (
            <div key={m.id} className={styles.milestoneRow}>
              <div className={styles.milestoneLeft}>
                <div className={`${styles.dot} ${dotClass}`}>
                  {m.done && <CheckCircle2 size={11} />}
                  {m.active && <Clock size={11} />}
                </div>
                {!isLast && <div className={`${styles.connector} ${m.done ? styles.connectorDone : ''}`} />}
              </div>
              <div className={`${styles.milestoneBody} ${m.active ? styles.milestoneActive : ''}`}>
                <div className={styles.milestoneLabel}>{m.label}</div>
                {m.timestamp && <div className={styles.milestoneTime}>{m.timestamp}</div>}
                {!m.done && !m.active && m.detail && (
                  <div className={styles.milestoneDetail}>{m.detail}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Branch contact */}
      <div className={styles.sectionTitle}>Your Service Branch</div>
      <div className={styles.branchCard}>
        <div className={styles.branchName}>
          <MapPin size={14} />
          {record.branch}
        </div>
        <div className={styles.branchHours}>{record.branchHours}</div>
        <div className={styles.branchActions}>
          <a href={`tel:${record.branchPhone.replace(/[^0-9]/g, '')}`} className={styles.branchBtn}>
            <Phone size={14} />
            Call Branch
          </a>
          <a
            href={`https://wa.me/91${record.branchPhone.replace(/[^0-9]/g, '').slice(-10)}`}
            className={`${styles.branchBtn} ${styles.branchBtnWa}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={14} />
            WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}
