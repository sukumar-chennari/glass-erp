import { useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useUpdateJobMutation } from '@/features/jobs/services/jobsApi';
import type { Job, InsuranceProcessing, InsuranceProcessingState } from '@/types/models/job';
import styles from './InsuranceWorkflowPanel.module.css';

// Step index mapping: lower = earlier in the process
const STATE_STEP: Record<InsuranceProcessingState, number> = {
  verifying_policy:   0,
  break_in_review:    0,
  documents_pending:  1,
  claim_submitted:    2,
  surveyor_assigned:  3,
  approved:           4,
  excess_pending:     5,
  excess_collected:   5,
  settlement_pending: 6,
  settled:            7,
  rejected:           -1,
};

const DEFAULT_DOCS = [
  { id: 'rc',     label: 'RC (Registration Certificate)',  required: true,  uploaded: false },
  { id: 'dl',     label: 'Driving Licence Copy',           required: true,  uploaded: false },
  { id: 'claim',  label: 'Claim Form (Insurer Template)',  required: true,  uploaded: false },
  { id: 'photos', label: 'Damage Photos (min 3)',          required: true,  uploaded: false },
  { id: 'fir',    label: 'FIR Copy (theft/accident only)', required: false, uploaded: false },
];

interface Props { job: Job; }

export function InsuranceWorkflowPanel({ job }: Props) {
  const [updateJob, { isLoading }] = useUpdateJobMutation();
  const toast = useToast();

  const [proc, setProc] = useState<InsuranceProcessing | null>(job.insuranceProcessing ?? null);
  const [claimInput,    setClaimInput]    = useState('');
  const [surveyorInput, setSurveyorInput] = useState('');
  const [approvedInput, setApprovedInput] = useState('');

  async function advance(newState: InsuranceProcessingState, extra?: Partial<InsuranceProcessing>) {
    const base = proc ?? {
      state:     'verifying_policy' as InsuranceProcessingState,
      documents: DEFAULT_DOCS.map((d) => ({ ...d })),
      updatedAt: new Date().toISOString(),
    };
    const updated: InsuranceProcessing = {
      ...base,
      ...extra,
      state:     newState,
      updatedAt: new Date().toISOString(),
    };
    setProc(updated);
    try {
      await updateJob({ id: job.id, insuranceProcessing: updated }).unwrap();
    } catch {
      toast.error('Failed to save insurance status.');
    }
  }

  async function toggleDoc(docId: string) {
    if (!proc) return;
    const docs    = proc.documents.map((d) => d.id === docId ? { ...d, uploaded: !d.uploaded } : d);
    const updated = { ...proc, documents: docs, updatedAt: new Date().toISOString() };
    setProc(updated);
    try {
      await updateJob({ id: job.id, insuranceProcessing: updated }).unwrap();
    } catch {
      toast.error('Failed to save document status.');
    }
  }

  if (!proc) {
    return (
      <div className={styles.panel}>
        <div className={styles.heading}>Insurance Processing</div>
        <div className={styles.empty}>Processing not yet initialised for this job.</div>
        <Button size="sm" onClick={() => advance('verifying_policy', { documents: DEFAULT_DOCS.map((d) => ({ ...d })) })}>
          Initialise Processing
        </Button>
      </div>
    );
  }

  const curStep   = STATE_STEP[proc.state] ?? 0;
  const isRejected = proc.state === 'rejected';

  function stepStatus(stepIdx: number): 'done' | 'active' | 'pending' | 'blocked' {
    if (isRejected) return stepIdx < curStep ? 'done' : 'blocked';
    if (stepIdx < curStep)   return 'done';
    if (stepIdx === curStep) return 'active';
    return 'pending';
  }

  const allRequiredUploaded = proc.documents.filter((d) => d.required).every((d) => d.uploaded);
  const hasExcess           = (job.insuranceDetails?.excessAmount ?? 0) > 0;

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>
        Insurance Processing
        {proc.state === 'settled'  && <span className={styles.settledBadge}>Settled</span>}
        {isRejected                && <span className={styles.rejectedBadge}>Rejected</span>}
        {proc.isBreakIn && curStep >= 1 && <span className={styles.breakInBadge}>Break-In</span>}
      </div>

      <div className={styles.steps}>

        {/* ── Step 0: Policy Verification ─────────────────────────── */}
        <StepRow
          label="Policy Verification"
          status={stepStatus(0)}
          sub={
            curStep > 0
              ? proc.isBreakIn ? 'Policy verified — break-in flag set' : 'Policy active and valid'
              : 'Verify policy is active for this claim type'
          }
        >
          {stepStatus(0) === 'active' && (
            <div className={styles.stepActions}>
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={!!proc.isBreakIn}
                  onChange={(e) => setProc({ ...proc, isBreakIn: e.target.checked })}
                />
                Flag as Break-In (theft/vandalism)
              </label>
              <Button size="sm" disabled={isLoading} onClick={() => advance('documents_pending')}>
                Verify Policy (Mock)
              </Button>
            </div>
          )}
        </StepRow>

        {/* ── Step 1: Documents ───────────────────────────────────── */}
        <StepRow
          label="Documents Collection"
          status={stepStatus(1)}
          sub={
            curStep > 1
              ? `${proc.documents.filter((d) => d.uploaded).length}/${proc.documents.length} documents collected`
              : `${proc.documents.filter((d) => d.uploaded && d.required).length}/${proc.documents.filter((d) => d.required).length} required docs uploaded`
          }
        >
          {stepStatus(1) === 'active' && (
            <div className={styles.docList}>
              {proc.documents.map((doc) => (
                <label key={doc.id} className={`${styles.docRow} ${doc.uploaded ? styles.docDone : ''}`}>
                  <input type="checkbox" checked={doc.uploaded} onChange={() => toggleDoc(doc.id)} />
                  <span className={styles.docLabel}>
                    {doc.label}
                    {!doc.required && <span className={styles.optional}> (optional)</span>}
                  </span>
                </label>
              ))}
              <Button
                size="sm"
                disabled={!allRequiredUploaded || isLoading}
                onClick={() => advance('claim_submitted', {
                  claimNumber: claimInput || `CLM-${Date.now().toString().slice(-6)}`,
                })}
              >
                {allRequiredUploaded ? 'Submit Claim →' : `Upload remaining ${proc.documents.filter((d) => d.required && !d.uploaded).length} docs first`}
              </Button>
            </div>
          )}
        </StepRow>

        {/* ── Step 2: Claim Submitted ─────────────────────────────── */}
        <StepRow
          label="Claim Submitted"
          status={stepStatus(2)}
          sub={proc.claimNumber ? `Claim #${proc.claimNumber}` : 'Awaiting claim submission'}
        >
          {stepStatus(2) === 'active' && (
            <div className={styles.stepActions}>
              <input
                className={styles.smallInput}
                placeholder="Surveyor ref / leave blank"
                value={claimInput}
                onChange={(e) => setClaimInput(e.target.value)}
              />
              <Button size="sm" disabled={isLoading} onClick={() => advance('surveyor_assigned', { surveyorName: 'Pending assignment' })}>
                Mark Surveyor Assigned
              </Button>
            </div>
          )}
        </StepRow>

        {/* ── Step 3: Surveyor Assessment ────────────────────────── */}
        <StepRow
          label="Surveyor Assessment"
          status={stepStatus(3)}
          sub={proc.surveyorName && proc.surveyorName !== 'Pending assignment' ? `Surveyor: ${proc.surveyorName}` : 'Awaiting surveyor visit'}
        >
          {stepStatus(3) === 'active' && (
            <div className={styles.stepActions}>
              <input
                className={styles.smallInput}
                placeholder="Surveyor name (optional)"
                value={surveyorInput}
                onChange={(e) => setSurveyorInput(e.target.value)}
              />
              <div className={styles.btnRow}>
                <Button
                  size="sm"
                  disabled={isLoading}
                  onClick={() => advance('approved', { surveyorName: surveyorInput || 'Assessment done' })}
                >
                  Mark Approved
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isLoading}
                  onClick={() => advance('rejected')}
                >
                  Mark Rejected
                </Button>
              </div>
            </div>
          )}
        </StepRow>

        {/* ── Step 4: Approval ────────────────────────────────────── */}
        <StepRow
          label="Claim Approved"
          status={stepStatus(4)}
          sub={
            proc.approvedAmount
              ? `Approved ₹${proc.approvedAmount.toLocaleString('en-IN')}`
              : curStep > 4 ? 'Approved' : 'Awaiting insurer approval'
          }
        >
          {stepStatus(4) === 'active' && (
            <div className={styles.stepActions}>
              <input
                className={styles.smallInput}
                type="number"
                placeholder="Approved amount ₹"
                value={approvedInput}
                onChange={(e) => setApprovedInput(e.target.value)}
              />
              <Button
                size="sm"
                disabled={isLoading}
                onClick={() => advance(
                  hasExcess ? 'excess_pending' : 'settlement_pending',
                  { approvedAmount: approvedInput ? Number(approvedInput) : undefined },
                )}
              >
                Confirm Approval
              </Button>
            </div>
          )}
        </StepRow>

        {/* ── Step 5: Excess (conditional) ────────────────────────── */}
        {hasExcess && (
          <StepRow
            label="Excess Amount Collection"
            status={stepStatus(5)}
            sub={
              proc.excessCollected || curStep > 5
                ? `₹${job.insuranceDetails?.excessAmount?.toLocaleString('en-IN')} collected from customer`
                : `Collect ₹${job.insuranceDetails?.excessAmount?.toLocaleString('en-IN')} from customer`
            }
          >
            {proc.state === 'excess_pending' && (
              <Button
                size="sm"
                disabled={isLoading}
                onClick={() => advance('settlement_pending', { excessCollected: true })}
              >
                Mark Excess Collected
              </Button>
            )}
          </StepRow>
        )}

        {/* ── Step 6: Settlement ──────────────────────────────────── */}
        <StepRow
          label="Insurance Settlement"
          status={stepStatus(6)}
          sub={
            proc.state === 'settled'
              ? 'Insurer transfer received — job financially closed'
              : 'Awaiting insurer payment transfer'
          }
        >
          {proc.state === 'settlement_pending' && (
            <Button size="sm" disabled={isLoading} onClick={() => advance('settled')}>
              Mark Settlement Received
            </Button>
          )}
        </StepRow>

      </div>

      {isRejected && (
        <div className={styles.rejectedAlert}>
          <AlertTriangle size={14} />
          Claim rejected by insurer. Contact customer to discuss alternatives.
        </div>
      )}
    </div>
  );
}

// ── Step row sub-component ────────────────────────────────────────────
type StepStatus = 'done' | 'active' | 'pending' | 'blocked';

function StepRow({
  label, sub, status, children,
}: {
  label: string;
  sub: string;
  status: StepStatus;
  children?: React.ReactNode;
}) {
  const dotClass =
    status === 'done'    ? styles.dotDone    :
    status === 'active'  ? styles.dotActive  :
    status === 'blocked' ? styles.dotBlocked : styles.dotPending;

  return (
    <div className={`${styles.step} ${status === 'active' ? styles.stepActive : ''}`}>
      <div className={styles.stepLeft}>
        <div className={`${styles.dot} ${dotClass}`}>
          {status === 'done' && <CheckCircle2 size={12} />}
          {status === 'active' && <Clock size={12} />}
        </div>
        <div className={styles.connector} />
      </div>
      <div className={styles.stepBody}>
        <div className={styles.stepLabel}>{label}</div>
        <div className={styles.stepSub}>{sub}</div>
        {children && <div className={styles.stepChildren}>{children}</div>}
      </div>
    </div>
  );
}
