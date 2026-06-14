import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { StockEntry, AdjustStockDto } from '@/types/models/stock';
import styles from './AdjustStockModal.module.css';

const schema = z.object({
  adjustment: z.coerce.number().int().refine((n) => n !== 0, 'Cannot adjust by 0'),
  reason:     z.string().min(3, 'Enter a reason for the adjustment'),
});

type FormData = z.infer<typeof schema>;

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
      title="Adjust Stock"
      maxWidth="440px"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="adjust-stock-form" loading={isSubmitting}>
            Apply Adjustment
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
            <div className={styles.currentQty}>Current stock: {entry.currentQty} units</div>
          </div>
        )}

        <Input
          label="Adjustment"
          type="number"
          placeholder="e.g. +5 or -2"
          hint="Use positive numbers to add stock, negative to remove"
          error={errors.adjustment?.message}
          fullWidth
          required
          {...register('adjustment')}
        />

        <Input
          label="Reason"
          placeholder="e.g. Received from PO-2025-001, Damaged unit removed"
          error={errors.reason?.message}
          fullWidth
          required
          {...register('reason')}
        />
      </form>
    </Modal>
  );
}
