import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { StockEntry, AdjustStockDto } from '@/types/models/stock';
import styles from './AdjustStockModal.module.css';

interface FormData {
  adjustment: number;
  reason:     string;
}

interface AdjustStockModalProps {
  isOpen:       boolean;
  onClose:      () => void;
  onSubmit:     (dto: AdjustStockDto) => Promise<void>;
  entry?:       StockEntry | null;
  isSubmitting: boolean;
}

export function AdjustStockModal({
  isOpen,
  onClose,
  onSubmit,
  entry,
  isSubmitting,
}: AdjustStockModalProps) {
  const { t } = useTranslation(['stock', 'common']);

  const schema = useMemo(() => z.object({
    adjustment: z.coerce.number().int().refine((n) => n !== 0, t('adjust.validation.nonZero')),
    reason:     z.string().min(3, t('adjust.validation.reason')),
  }), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isOpen) reset({ adjustment: 0, reason: '' });
  }, [isOpen, reset]);

  const handleFormSubmit = async (data: FormData) => {
    if (!entry) return;
    await onSubmit({ productId: entry.productId, adjustment: data.adjustment, reason: data.reason });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('adjust.title')}
      maxWidth="440px"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="adjust-stock-form" loading={isSubmitting}>
            {t('actions.applyAdjustment', { ns: 'common' })}
          </Button>
        </div>
      }
    >
      <form
        id="adjust-stock-form"
        className={styles.form}
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
      >
        {entry && (
          <div className={styles.productInfo}>
            <div className={styles.productName}>{entry.productName}</div>
            <div className={styles.currentQty}>
              {t('adjust.currentStock', { qty: entry.currentQty })}
            </div>
          </div>
        )}

        <Input
          label={t('adjust.adjustment')}
          type="number"
          placeholder={t('adjust.placeholders.adjustment')}
          hint={t('adjust.hint')}
          error={errors.adjustment?.message}
          fullWidth
          required
          {...register('adjustment')}
        />

        <Input
          label={t('adjust.reason')}
          placeholder={t('adjust.placeholders.reason')}
          error={errors.reason?.message}
          fullWidth
          required
          {...register('reason')}
        />
      </form>
    </Modal>
  );
}
