import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/services/mockUtils';
import { INVOICE_STATUS } from '@/constants/statuses';
import type { Invoice, UpdateInvoiceDto } from '@/types/models/invoice';
import type { SelectOption } from '@/types/ui';
import styles from './InvoiceStatusModal.module.css';

const schema = z.object({
  status:   z.enum([
    INVOICE_STATUS.DRAFT, INVOICE_STATUS.SENT, INVOICE_STATUS.PAID,
    INVOICE_STATUS.OVERDUE, INVOICE_STATUS.VOID,
  ]),
  paidDate: z.string().optional(),
  notes:    z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const STATUS_OPTIONS: SelectOption[] = [
  { value: INVOICE_STATUS.DRAFT,   label: 'Draft'   },
  { value: INVOICE_STATUS.SENT,    label: 'Sent'    },
  { value: INVOICE_STATUS.PAID,    label: 'Paid'    },
  { value: INVOICE_STATUS.OVERDUE, label: 'Overdue' },
  { value: INVOICE_STATUS.VOID,    label: 'Void'    },
];

interface InvoiceStatusModalProps {
  isOpen:       boolean;
  onClose:      () => void;
  onSubmit:     (dto: UpdateInvoiceDto) => Promise<void>;
  invoice?:     Invoice | null;
  isSubmitting: boolean;
}

export function InvoiceStatusModal({
  isOpen,
  onClose,
  onSubmit,
  invoice,
  isSubmitting,
}: InvoiceStatusModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const watchedStatus = watch('status');

  useEffect(() => {
    if (isOpen && invoice) {
      reset({ status: invoice.status, paidDate: invoice.paidDate ?? '', notes: invoice.notes ?? '' });
    }
  }, [isOpen, invoice, reset]);

  const handleFormSubmit = async (data: FormData) => {
    const dto: UpdateInvoiceDto = {
      status:   data.status,
      paidDate: data.status === INVOICE_STATUS.PAID ? (data.paidDate || new Date().toISOString().slice(0, 10)) : undefined,
      notes:    data.notes || undefined,
    };
    await onSubmit(dto);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Invoice"
      maxWidth="440px"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="invoice-status-form" loading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      }
    >
      <form
        id="invoice-status-form"
        className={styles.form}
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
      >
        {invoice && (
          <div className={styles.infoBox}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Invoice</span>
              <span className={styles.infoValue}>{invoice.invoiceNumber}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Customer</span>
              <span className={styles.infoValue}>{invoice.customerName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Total</span>
              <span className={styles.infoValue}>{formatINR(invoice.totalAmount)}</span>
            </div>
          </div>
        )}

        <Select
          label="Status"
          options={STATUS_OPTIONS}
          error={errors.status?.message}
          fullWidth
          required
          {...register('status')}
        />

        {watchedStatus === INVOICE_STATUS.PAID && (
          <Input
            label="Payment Date"
            type="date"
            error={errors.paidDate?.message}
            fullWidth
            {...register('paidDate')}
          />
        )}

        <Input
          label="Notes (optional)"
          placeholder="Any additional notes…"
          error={errors.notes?.message}
          fullWidth
          {...register('notes')}
        />
      </form>
    </Modal>
  );
}
