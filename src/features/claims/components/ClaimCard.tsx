import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { claimStatusKey } from '@/i18n/statusKeys';
import type { Claim } from '@/types/models/claim';
import styles from './ClaimCard.module.css';

const STATUS_CLASS: Record<string, string> = {
  'Submitted':    styles.pillSubmitted,
  'Under Review': styles.pillUnderReview,
  'Surveyed':     styles.pillSurveyed,
  'Approved':     styles.pillApproved,
  'Partial':      styles.pillPartial,
  'Rejected':     styles.pillRejected,
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
  const { t } = useTranslation('claims');
  const hasApproval = claim.approvedAmount > 0;

  const pct = hasApproval
    ? Math.min(100, Math.round((claim.approvedAmount / claim.claimedAmount) * 100))
    : 0;

  const pillClass = STATUS_CLASS[claim.status] ?? styles.pillDefault;

  const progressClass =
    claim.status === 'Approved'     ? styles.progressApproved :
    claim.status === 'Partial'      ? styles.progressPartial  :
    claim.status === 'Rejected'     ? styles.progressRejected :
    styles.progressPending;

  const approvedAmtClass =
    !hasApproval               ? styles.amtPending  :
    claim.status === 'Approved' ? styles.amtApproved :
    styles.amtPartial;

  const balanceClass =
    !hasApproval               ? styles.amtPending :
    claim.customerBalance > 0   ? styles.balanceOwed :
    styles.balancePaid;

  const progressLabelClass =
    pct === 0                  ? styles.progressLabelWaiting  :
    claim.status === 'Approved' ? styles.progressLabelApproved :
    styles.progressLabelPartial;

  const submittedDate = new Date(claim.submittedAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div className={styles.card}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.idWrap}>
          <span className={styles.id}>{claim.claimNumber}</span>
          <span className={`${styles.statusPill} ${pillClass}`}>
            {t(`status.${claimStatusKey(claim.status)}`, claim.status)}
          </span>
        </div>
        <span className={styles.date}>{t('card.submittedOn')} {submittedDate}</span>
      </div>

      {/* ── Body ── */}
      <div className={styles.body}>
        {/* Info row */}
        <div className={styles.infoRow}>
          <div className={styles.infoItem}>
            <span className={styles.infoLbl}>{t('card.customer')}</span>
            <span className={styles.infoVal}>{claim.customerName}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLbl}>{t('card.vehicle')}</span>
            <span className={styles.infoVal}>{claim.vehicleName} · {claim.registrationNo}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLbl}>{t('card.glass')}</span>
            <span className={styles.infoVal}>{claim.glassPosition}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLbl}>{t('card.insurer')}</span>
            <span className={styles.infoVal}>{claim.insurer}</span>
          </div>
        </div>

        {/* Amounts */}
        <div className={styles.amounts}>
          <div className={styles.amtItem}>
            <div className={styles.amtLbl}>{t('card.claimed')}</div>
            <div className={styles.amtVal}>{fmt(claim.claimedAmount)}</div>
          </div>
          <span className={styles.amtArrow}>→</span>
          <div className={styles.amtItem}>
            <div className={styles.amtLbl}>{t('card.approved')}</div>
            <div className={`${styles.amtVal} ${approvedAmtClass}`}>
              {hasApproval ? fmt(claim.approvedAmount) : t('card.pending')}
            </div>
          </div>
          <span className={styles.amtArrow}>→</span>
          <div className={styles.amtItem}>
            <div className={styles.amtLbl}>{t('card.customerPays')}</div>
            <div className={`${styles.amtVal} ${balanceClass}`}>
              {hasApproval
                ? (claim.customerBalance > 0 ? fmt(claim.customerBalance) : '₹0')
                : t('card.tbd')}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div className={`${styles.progressFill} ${progressClass}`} style={{ width: `${pct}%` }} />
        </div>
        <div className={`${styles.progressLabel} ${progressLabelClass}`}>
          {pct > 0
            ? t('card.covered', { pct })
            : t('card.awaitingDecision')}
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
            aria-label={t('card.aria.update')}
            onClick={(e) => { e.stopPropagation(); onEdit(claim); }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={t('card.aria.delete')}
            onClick={(e) => { e.stopPropagation(); onDelete(claim.id); }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
