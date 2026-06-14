import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/services/mockUtils';
import { CLAIM_STATUS } from '@/constants/statuses';
import type { Claim } from '@/types/models/claim';
import type { SelectOption } from '@/types/ui';
import styles from './ClaimUpdateModal.module.css';

const schema = z.object({
  status: z.enum([
    CLAIM_STATUS.SUBMITTED, CLAIM_STATUS.UNDER_REVIEW, CLAIM_STATUS.SURVEYED,
    CLAIM_STATUS.APPROVED, CLAIM_STATUS.PARTIAL, CLAIM_STATUS.REJECTED,
  ]),
  approvedAmount: z.coerce.number().min(0).optional().or(z.literal('')),
  surveyorName:   z.string().optional(),
  remarks:        z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STATUS_OPTIONS: SelectOption[] = [
  { value: CLAIM_STATUS.SUBMITTED,    label: 'Submitted'    },
  { value: CLAIM_STATUS.UNDER_REVIEW, label: 'Under Review' },
  { value: CLAIM_STATUS.SURVEYED,     label: 'Surveyed'     },
  { value: CLAIM_STATUS.APPROVED,     label: 'Approved'     },
  { value: CLAIM_STATUS.PARTIAL,      label: 'Partial'      },
  { value: CLAIM_STATUS.REJECTED,     label: 'Rejected'     },
];

interface ClaimUpdateModalProps {
  isOpen:       boolean;
  onClose:      () => void;
  onSubmit:     (dto: { status?: Claim['status']; approvedAmount?: number; remarks?: string; surveyorName?: string }) => Promise<void>;
  claim?:       Claim | null;
  isSubmitting: boolean;
}

export function ClaimUpdateModal({
  isOpen,
  onClose,
  onSubmit,
  claim,
  isSubmitting,
}: ClaimUpdateModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isOpen && claim) {
      reset({
        status:         claim.status,
        approvedAmount: claim.approvedAmount > 0 ? claim.approvedAmount : '',
        surveyorName:   claim.surveyorName ?? '',
        remarks:        claim.remarks ?? '',
      });
    }
  }, [isOpen, claim, reset]);

  const handleFormSubmit = async (data: FormData) => {
    const amount = data.approvedAmount ? Number(data.approvedAmount) : 0;
    if (claim && amount > claim.claimedAmount) {
      setError('approvedAmount', {
        message: `Cannot exceed claimed amount (${formatINR(claim.claimedAmount)})`,
      });
      return;
    }
    await onSubmit({
      status:         data.status,
      approvedAmount: amount > 0 ? amount : undefined,
      surveyorName:   data.surveyorName || undefined,
      remarks:        data.remarks || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Claim"
      maxWidth="500px"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="claim-update-form" loading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      }
    >
      <form
        id="claim-update-form"
        className={styles.form}
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
      >
        {claim && (
          <div className={styles.infoBox}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Claim #</span>
              <span className={styles.infoValue}>{claim.claimNumber}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Customer</span>
              <span className={styles.infoValue}>{claim.customerName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Insurer</span>
              <span className={styles.infoValue}>{claim.insurer}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Claimed Amount</span>
              <span className={styles.infoValue}>{formatINR(claim.claimedAmount)}</span>
            </div>
          </div>
        )}

        <div className={styles.row}>
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            error={errors.status?.message}
            required
            {...register('status')}
          />
          <Input
            label="Approved Amount (₹)"
            type="number"
            placeholder="0"
            hint="Leave 0 if not yet approved"
            error={errors.approvedAmount?.message}
            {...register('approvedAmount')}
          />
        </div>

        <Input
          label="Surveyor Name"
          placeholder="e.g. Ramesh Nair"
          error={errors.surveyorName?.message}
          fullWidth
          {...register('surveyorName')}
        />

        <Input
          label="Remarks"
          placeholder="Notes on claim status or survey findings…"
          error={errors.remarks?.message}
          fullWidth
          {...register('remarks')}
        />
      </form>
    </Modal>
  );
}
