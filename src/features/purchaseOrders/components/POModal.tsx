import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/services/mockUtils';
import { PO_STATUS } from '@/constants/statuses';
import { poStatusKey } from '@/i18n/statusKeys';
import type { PurchaseOrder, CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from '@/types/models/purchaseOrder';
import type { SelectOption } from '@/types/ui';
import styles from './POModal.module.css';

interface POItemData {
  productName: string;
  quantity:    number;
  unitPrice:   number;
}

interface POFormData {
  vendorId:             string;
  items:                POItemData[];
  expectedDeliveryDate?: string;
  notes?:               string;
  status?:              string;
}

interface POModalProps {
  isOpen:        boolean;
  onClose:       () => void;
  onSubmit:      (data: CreatePurchaseOrderDto | UpdatePurchaseOrderDto) => Promise<void>;
  order?:        PurchaseOrder | null;
  isSubmitting:  boolean;
  vendorOptions: SelectOption[];
}

export function POModal({
  isOpen,
  onClose,
  onSubmit,
  order,
  isSubmitting,
  vendorOptions,
}: POModalProps) {
  const { t } = useTranslation(['purchaseOrders', 'common']);
  const isEdit = !!order;

  const itemSchema = useMemo(() => z.object({
    productName: z.string().min(1, t('form.errors.productRequired')),
    quantity:    z.coerce.number().int().min(1, t('form.errors.minQty')),
    unitPrice:   z.coerce.number().positive(t('form.errors.enterPrice')),
  }), [t]);

  const poSchema = useMemo(() => z.object({
    vendorId:             z.string().min(1, t('form.errors.selectVendor')),
    items:                z.array(itemSchema).min(1, t('form.errors.addItem')),
    expectedDeliveryDate: z.string().optional(),
    notes:                z.string().optional(),
    status: z.enum([
      PO_STATUS.DRAFT, PO_STATUS.SENT, PO_STATUS.ACCEPTED,
      PO_STATUS.IN_TRANSIT, PO_STATUS.RECEIVED, PO_STATUS.CANCELLED,
    ]).optional(),
  }), [t, itemSchema]);

  const statusOptions = useMemo<SelectOption[]>(() => [
    { value: PO_STATUS.DRAFT,      label: t(`status.${poStatusKey(PO_STATUS.DRAFT)}`)      },
    { value: PO_STATUS.SENT,       label: t(`status.${poStatusKey(PO_STATUS.SENT)}`)       },
    { value: PO_STATUS.ACCEPTED,   label: t(`status.${poStatusKey(PO_STATUS.ACCEPTED)}`)   },
    { value: PO_STATUS.IN_TRANSIT, label: t(`status.${poStatusKey(PO_STATUS.IN_TRANSIT)}`) },
    { value: PO_STATUS.RECEIVED,   label: t(`status.${poStatusKey(PO_STATUS.RECEIVED)}`)   },
    { value: PO_STATUS.CANCELLED,  label: t(`status.${poStatusKey(PO_STATUS.CANCELLED)}`)  },
  ], [t]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<POFormData>({
    resolver: zodResolver(poSchema),
    defaultValues: { items: [{ productName: '', quantity: 1, unitPrice: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedItems = useWatch({ control, name: 'items' });

  const subtotal    = watchedItems?.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0) ?? 0;
  const gstAmount   = Math.round(subtotal * 0.18);
  const totalAmount = subtotal + gstAmount;

  useEffect(() => {
    if (isOpen) {
      reset(
        order
          ? {
              vendorId:             order.vendorId,
              items:                order.items.map((i) => ({
                productName: i.productName,
                quantity:    i.quantity,
                unitPrice:   i.unitPrice,
              })),
              expectedDeliveryDate: order.expectedDeliveryDate ?? '',
              notes:                order.notes ?? '',
              status:               order.status,
            }
          : {
              vendorId: '',
              items: [{ productName: '', quantity: 1, unitPrice: 0 }],
              expectedDeliveryDate: '',
              notes: '',
            },
      );
    }
  }, [isOpen, order, reset]);

  const handleFormSubmit = async (data: POFormData) => {
    const { status, ...rest } = data;
    const dto: CreatePurchaseOrderDto | UpdatePurchaseOrderDto = {
      ...rest,
      notes:                rest.notes || undefined,
      expectedDeliveryDate: rest.expectedDeliveryDate || undefined,
      ...(isEdit && status ? { status } : {}),
    };
    await onSubmit(dto);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('form.title.edit', { poNumber: order.poNumber }) : t('form.title.add')}
      maxWidth="700px"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="po-form" loading={isSubmitting}>
            {isEdit ? t('actions.saveChanges', { ns: 'common' }) : t('form.buttons.create')}
          </Button>
        </div>
      }
    >
      <form
        id="po-form"
        className={styles.form}
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
      >
        <div className={styles.row}>
          <Select
            label={t('form.vendor')}
            options={vendorOptions}
            placeholder={t('form.vendorPlaceholder')}
            error={errors.vendorId?.message}
            required
            {...register('vendorId')}
          />
          <Input
            label={t('form.expectedDelivery')}
            type="date"
            error={errors.expectedDeliveryDate?.message}
            {...register('expectedDeliveryDate')}
          />
        </div>

        <hr className={styles.divider} />
        <div className={styles.sectionLabel}>{t('form.lineItems')}</div>

        {fields.map((field, index) => (
          <div key={field.id} className={styles.itemRow}>
            <Input
              label={index === 0 ? t('form.product') : undefined}
              placeholder={t('form.productPlaceholder')}
              error={errors.items?.[index]?.productName?.message}
              {...register(`items.${index}.productName`)}
            />
            <Input
              label={index === 0 ? t('form.qty') : undefined}
              type="number"
              placeholder="1"
              error={errors.items?.[index]?.quantity?.message}
              {...register(`items.${index}.quantity`)}
            />
            <Input
              label={index === 0 ? t('form.unitPrice') : undefined}
              type="number"
              placeholder="0"
              error={errors.items?.[index]?.unitPrice?.message}
              {...register(`items.${index}.unitPrice`)}
            />
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={t('form.aria.removeItem')}
              className={styles.removeBtn}
              onClick={() => fields.length > 1 && remove(index)}
              disabled={fields.length <= 1}
              type="button"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Plus size={14} />}
          className={styles.addItemBtn}
          type="button"
          onClick={() => append({ productName: '', quantity: 1, unitPrice: 0 })}
        >
          {t('actions.addItem', { ns: 'common' })}
        </Button>

        <div className={styles.totalsBox}>
          <div className={styles.totalRow}>
            <span>{t('form.totals.subtotal')}</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>{t('form.totals.gst')}</span>
            <span>{formatINR(gstAmount)}</span>
          </div>
          <div className={styles.totalRowBold}>
            <span>{t('form.totals.total')}</span>
            <span>{formatINR(totalAmount)}</span>
          </div>
        </div>

        <div className={styles.row}>
          <Input
            label={t('form.notes')}
            placeholder={t('form.notesPlaceholder')}
            {...register('notes')}
          />
          {isEdit && (
            <Select
              label={t('form.statusLabel')}
              options={statusOptions}
              error={errors.status?.message}
              {...register('status')}
            />
          )}
        </div>
      </form>
    </Modal>
  );
}
