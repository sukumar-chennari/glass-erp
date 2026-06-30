import { useState } from 'react';
import { CheckCircle2, Banknote, CreditCard, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useUpdateJobMutation } from '@/features/jobs/services/jobsApi';
import { PAYMENT_STATUS } from '@/constants/statuses';
import type { PaymentStatus } from '@/constants/statuses';
import type { Job } from '@/types/models/job';
import styles from './PaymentStatusPanel.module.css';

interface Props { job: Job; }

export function PaymentStatusPanel({ job }: Props) {
  const [updateJob, { isLoading }] = useUpdateJobMutation();
  const toast = useToast();

  const [status, setStatus] = useState<PaymentStatus>(
    job.paymentStatus ?? PAYMENT_STATUS.PENDING
  );

  async function advance(next: PaymentStatus) {
    setStatus(next);
    try {
      await updateJob({ id: job.id, paymentStatus: next }).unwrap();
      toast.success(`Payment: ${next}`);
    } catch {
      toast.error('Failed to update payment status.');
      setStatus(job.paymentStatus ?? PAYMENT_STATUS.PENDING);
    }
  }

  const isClosed = status === PAYMENT_STATUS.FINANCIALLY_CLOSED;
  const excess   = job.insuranceDetails?.excessAmount ?? 0;
  const amount   = job.estimatedCost;

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>
        <span>Payment Status</span>
        {isClosed && <span className={styles.closedBadge}>Financially Closed</span>}
      </div>

      <div className={styles.meta}>
        {job.paymentType === 'Cash'      && <Banknote  size={13} />}
        {job.paymentType === 'Insurance' && <Shield    size={13} />}
        {(job.paymentType === 'Card' || job.paymentType === 'UPI') && <CreditCard size={13} />}
        <span>{job.paymentType} payment</span>
        {amount && <span className={styles.metaAmt}>· ₹{amount.toLocaleString('en-IN')}</span>}
      </div>

      {isClosed ? (
        <div className={styles.closed}>
          <CheckCircle2 size={14} />
          All payments settled — job financially closed.
        </div>
      ) : job.paymentType === 'Insurance' ? (
        <InsurancePaymentFlow
          status={status}
          excess={excess}
          isLoading={isLoading}
          onAdvance={advance}
        />
      ) : (
        <SimplePaymentFlow
          paymentType={job.paymentType}
          status={status}
          isLoading={isLoading}
          onAdvance={advance}
        />
      )}
    </div>
  );
}

// ── Simple (Cash / Card / UPI) ────────────────────────────────────────
function SimplePaymentFlow({
  paymentType, status, isLoading, onAdvance,
}: {
  paymentType: string;
  status: PaymentStatus;
  isLoading: boolean;
  onAdvance: (s: PaymentStatus) => void;
}) {
  if (status === PAYMENT_STATUS.CASH_COLLECTED) {
    return (
      <div className={styles.row}>
        <div className={styles.collected}>
          <CheckCircle2 size={13} />
          {paymentType === 'Cash' ? 'Cash collected' : 'Payment received'}
        </div>
        <Button size="sm" disabled={isLoading} onClick={() => onAdvance(PAYMENT_STATUS.FINANCIALLY_CLOSED)}>
          Close Financially
        </Button>
      </div>
    );
  }
  return (
    <Button
      size="sm"
      disabled={isLoading}
      onClick={() => onAdvance(PAYMENT_STATUS.CASH_COLLECTED)}
    >
      {paymentType === 'Cash' ? <Banknote size={13} /> : <CreditCard size={13} />}
      Mark {paymentType === 'Cash' ? 'Cash' : 'Payment'} Collected
    </Button>
  );
}

// ── Insurance payment flow ────────────────────────────────────────────
function InsurancePaymentFlow({
  status, excess, isLoading, onAdvance,
}: {
  status: PaymentStatus;
  excess: number;
  isLoading: boolean;
  onAdvance: (s: PaymentStatus) => void;
}) {
  // settled → ask to close
  if (status === PAYMENT_STATUS.INSURANCE_SETTLED) {
    return (
      <div className={styles.row}>
        <div className={styles.collected}><CheckCircle2 size={13} /> Insurance settled</div>
        <Button size="sm" disabled={isLoading} onClick={() => onAdvance(PAYMENT_STATUS.FINANCIALLY_CLOSED)}>
          Mark Financially Closed
        </Button>
      </div>
    );
  }
  // excess collected → can mark settled
  if (status === PAYMENT_STATUS.EXCESS_COLLECTED) {
    return (
      <div className={styles.stageList}>
        <div className={styles.collected}><CheckCircle2 size={13} /> Excess collected</div>
        <Button size="sm" disabled={isLoading} onClick={() => onAdvance(PAYMENT_STATUS.INSURANCE_SETTLED)}>
          Mark Insurance Settled
        </Button>
      </div>
    );
  }
  // excess pending → collect it
  if (status === PAYMENT_STATUS.EXCESS_PENDING) {
    return (
      <div className={styles.stageList}>
        <div className={styles.alert}>
          <AlertCircle size={13} />
          Collect excess ₹{excess.toLocaleString('en-IN')} from customer
        </div>
        <Button size="sm" disabled={isLoading} onClick={() => onAdvance(PAYMENT_STATUS.EXCESS_COLLECTED)}>
          Mark Excess Collected
        </Button>
      </div>
    );
  }
  // insurance pending → can mark settled or set excess pending
  if (status === PAYMENT_STATUS.INSURANCE_PENDING) {
    return (
      <div className={styles.stageList}>
        <div className={styles.note}>Claim submitted. Awaiting insurer settlement.</div>
        {excess > 0 && (
          <Button size="sm" variant="secondary" disabled={isLoading} onClick={() => onAdvance(PAYMENT_STATUS.EXCESS_PENDING)}>
            Set Excess Pending (₹{excess.toLocaleString('en-IN')})
          </Button>
        )}
        <Button size="sm" disabled={isLoading} onClick={() => onAdvance(PAYMENT_STATUS.INSURANCE_SETTLED)}>
          Mark Insurance Settled
        </Button>
      </div>
    );
  }
  // initial state
  return (
    <div className={styles.stageList}>
      <div className={styles.note}>Insurance claim in progress.</div>
      {excess > 0 && (
        <Button size="sm" variant="secondary" disabled={isLoading} onClick={() => onAdvance(PAYMENT_STATUS.EXCESS_PENDING)}>
          Collect Excess ₹{excess.toLocaleString('en-IN')}
        </Button>
      )}
      <Button size="sm" disabled={isLoading} onClick={() => onAdvance(PAYMENT_STATUS.INSURANCE_PENDING)}>
        Mark Claim Submitted
      </Button>
    </div>
  );
}
