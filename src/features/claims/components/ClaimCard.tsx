import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Claim } from '@/types/models/claim';
import styles from './ClaimCard.module.css';

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  'Submitted':    { bg: 'rgba(99,102,241,0.2)',  color: '#818cf8', border: 'rgba(99,102,241,0.3)'  },
  'Under Review': { bg: 'rgba(245,158,11,0.2)',  color: '#f59e0b', border: 'rgba(245,158,11,0.3)'  },
  'Surveyed':     { bg: 'rgba(168,85,247,0.2)',  color: '#a855f7', border: 'rgba(168,85,247,0.3)'  },
  'Approved':     { bg: 'rgba(16,185,129,0.2)',  color: '#10b981', border: 'rgba(16,185,129,0.3)'  },
  'Partial':      { bg: 'rgba(251,146,60,0.2)',  color: '#fb923c', border: 'rgba(251,146,60,0.3)'  },
  'Rejected':     { bg: 'rgba(244,63,94,0.2)',   color: '#f43f5e', border: 'rgba(244,63,94,0.3)'   },
};

const DOT_CLASS: Record<string, string> = {
  done:     styles.dotDone,
  active:   styles.dotActive,
  partial:  styles.dotPartial,
  rejected: styles.dotRejected,
  pending:  styles.dotPending,
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

interface ClaimCardProps {
  claim: Claim;
  onEdit:   (c: Claim)  => void;
  onDelete: (id: string) => void;
}

export function ClaimCard({ claim, onEdit, onDelete }: ClaimCardProps) {
  const hasApproval = claim.approvedAmount > 0;

  const pct = hasApproval
    ? Math.min(100, Math.round((claim.approvedAmount / claim.claimedAmount) * 100))
    : 0;

  const progressBg =
    claim.status === 'Approved'     ? 'linear-gradient(90deg, #10b981, #059669)' :
    claim.status === 'Partial'      ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
    claim.status === 'Rejected'     ? '#f43f5e' :
    claim.status === 'Under Review' ? 'linear-gradient(90deg, #6366f1, #a855f7)' :
    'linear-gradient(90deg, #6366f1, #a855f7)';

  const approvedColor =
    claim.status === 'Approved' ? '#10b981' :
    claim.status === 'Partial'  ? '#f59e0b' :
    'rgba(255,255,255,0.3)';

  const balanceColor = claim.customerBalance > 0 ? '#f43f5e' : '#10b981';

  const submittedDate = new Date(claim.submittedAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  const st = STATUS_STYLE[claim.status] ?? { bg: 'rgba(255,255,255,0.1)', color: '#fff', border: 'transparent' };

  return (
    <div className={styles.card}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.idWrap}>
          <span className={styles.id}>{claim.claimNumber}</span>
          <span
            className={styles.statusPill}
            style={{ background: st.bg, color: st.color, borderColor: st.border }}
          >
            {claim.status}
          </span>
        </div>
        <span className={styles.date}>Submitted: {submittedDate}</span>
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>
        {/* Info row */}
        <div className={styles.infoRow}>
          <div className={styles.infoItem}>
            <span className={styles.infoLbl}>Customer</span>
            <span className={styles.infoVal}>{claim.customerName}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLbl}>Vehicle</span>
            <span className={styles.infoVal}>{claim.vehicleName} · {claim.registrationNo}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLbl}>Glass</span>
            <span className={styles.infoVal}>{claim.glassPosition}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLbl}>Insurer</span>
            <span className={styles.infoVal}>{claim.insurer}</span>
          </div>
        </div>

        {/* Amounts */}
        <div className={styles.amounts}>
          <div className={styles.amtItem}>
            <div className={styles.amtLbl}>Claimed</div>
            <div className={styles.amtVal}>{fmt(claim.claimedAmount)}</div>
          </div>
          <span className={styles.amtArrow}>→</span>
          <div className={styles.amtItem}>
            <div className={styles.amtLbl}>Approved</div>
            <div className={styles.amtVal} style={{ color: hasApproval ? approvedColor : 'rgba(255,255,255,0.3)' }}>
              {hasApproval ? fmt(claim.approvedAmount) : 'Pending'}
            </div>
          </div>
          <span className={styles.amtArrow}>→</span>
          <div className={styles.amtItem}>
            <div className={styles.amtLbl}>Customer Pays</div>
            <div className={styles.amtVal} style={{ color: hasApproval ? balanceColor : 'rgba(255,255,255,0.3)' }}>
              {hasApproval
                ? (claim.customerBalance > 0 ? fmt(claim.customerBalance) : '₹0')
                : 'TBD'}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${pct}%`, background: progressBg }} />
        </div>
        <div className={styles.progressLabel}>
          {pct > 0
            ? <span style={{ color: approvedColor }}>{pct}% covered</span>
            : <span style={{ color: 'rgba(255,255,255,0.35)' }}>Awaiting decision</span>
          }
        </div>
      </div>

      {/* ── Footer ── */}
      <div className={styles.footer}>
        <div className={styles.timeline}>
          {claim.history.map((step, i) => (
            <span
              key={i}
              className={`${styles.timelineDot} ${DOT_CLASS[step.state] ?? styles.dotPending}`}
              title={step.step}
            >
              ●
            </span>
          ))}
        </div>
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Update claim"
            onClick={(e) => { e.stopPropagation(); onEdit(claim); }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Delete claim"
            onClick={(e) => { e.stopPropagation(); onDelete(claim.id); }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
