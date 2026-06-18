import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/services/mockUtils';
import { CLAIM_STATUS } from '@/constants/statuses';
import { claimStatusKey } from '@/i18n/statusKeys';
import type { Claim } from '@/types/models/claim';
import type { SelectOption } from '@/types/ui';
import styles from './ClaimUpdateModal.module.css';

interface ClaimFormData {
  status:         string;
  approvedAmount: number | string;
  surveyorName?:  string;
  remarks?:       string;
}

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
  const { t } = useTranslation(['claims', 'common']);

  const schema = useMemo(() => z.object({
    status: z.enum([
      CLAIM_STATUS.SUBMITTED, CLAIM_STATUS.UNDER_REVIEW, CLAIM_STATUS.SURVEYED,
      CLAIM_STATUS.APPROVED, CLAIM_STATUS.PARTIAL, CLAIM_STATUS.REJECTED,
    ]),
    approvedAmount: z.coerce.number().min(0).optional().or(z.literal('')),
    surveyorName:   z.string().optional(),
    remarks:        z.string().optional(),
  }), []);

  const statusOptions = useMemo<SelectOption[]>(() => [
    { value: CLAIM_STATUS.SUBMITTED,    label: t(`status.${claimStatusKey(CLAIM_STATUS.SUBMITTED)}`)    },
    { value: CLAIM_STATUS.UNDER_REVIEW, label: t(`status.${claimStatusKey(CLAIM_STATUS.UNDER_REVIEW)}`) },
    { value: CLAIM_STATUS.SURVEYED,     label: t(`status.${claimStatusKey(CLAIM_STATUS.SURVEYED)}`)     },
    { value: CLAIM_STATUS.APPROVED,     label: t(`status.${claimStatusKey(CLAIM_STATUS.APPROVED)}`)     },
    { value: CLAIM_STATUS.PARTIAL,      label: t(`status.${claimStatusKey(CLAIM_STATUS.PARTIAL)}`)      },
    { value: CLAIM_STATUS.REJECTED,     label: t(`status.${claimStatusKey(CLAIM_STATUS.REJECTED)}`)     },
  ], [t]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ClaimFormData>({ resolver: zodResolver(schema) });

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

  const handleFormSubmit = async (data: ClaimFormData) => {
    const amount = data.approvedAmount ? Number(data.approvedAmount) : 0;
    if (claim && amount > claim.claimedAmount) {
      setError('approvedAmount', {
        message: t('form.errors.exceedsClaimed', { amount: formatINR(claim.claimedAmount) }),
      });
      return;
    }
    await onSubmit({
      status:         data.status as Claim['status'],
      approvedAmount: amount > 0 ? amount : undefined,
      surveyorName:   data.surveyorName || undefined,
      remarks:        data.remarks || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('form.title')}
      maxWidth="500px"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="claim-update-form" loading={isSubmitting}>
            {t('actions.saveChanges', { ns: 'common' })}
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
              <span className={styles.infoLabel}>{t('form.info.claimNo')}</span>
              <span className={styles.infoValue}>{claim.claimNumber}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('form.info.customer')}</span>
              <span className={styles.infoValue}>{claim.customerName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('form.info.insurer')}</span>
              <span className={styles.infoValue}>{claim.insurer}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('form.info.claimedAmount')}</span>
              <span className={styles.infoValue}>{formatINR(claim.claimedAmount)}</span>
            </div>
          </div>
        )}

        <div className={styles.row}>
          <Select
            label={t('form.status')}
            options={statusOptions}
            error={errors.status?.message}
            required
            {...register('status')}
          />
          <Input
            label={t('form.approvedAmount')}
            type="number"
            placeholder="0"
            hint={t('form.approvedHint')}
            error={errors.approvedAmount?.message}
            {...register('approvedAmount')}
          />
        </div>

        <Input
          label={t('form.surveyorName')}
          placeholder={t('form.placeholders.surveyorName')}
          error={errors.surveyorName?.message}
          fullWidth
          {...register('surveyorName')}
        />

        <Input
          label={t('form.remarks')}
          placeholder={t('form.placeholders.remarks')}
          error={errors.remarks?.message}
          fullWidth
          {...register('remarks')}
        />
      </form>
    </Modal>
  );
}
