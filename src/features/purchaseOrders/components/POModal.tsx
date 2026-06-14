import { useEffect } from 'react';
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
import type { PurchaseOrder, CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from '@/types/models/purchaseOrder';
import type { SelectOption } from '@/types/ui';
import styles from './POModal.module.css';

const itemSchema = z.object({
  productName: z.string().min(1, 'Product name required'),
  quantity:    z.coerce.number().int().min(1, 'Min 1'),
  unitPrice:   z.coerce.number().positive('Enter price'),
});

const poSchema = z.object({
  vendorId:              z.string().min(1, 'Select a vendor'),
  items:                 z.array(itemSchema).min(1, 'Add at least one item'),
  expectedDeliveryDate:  z.string().optional(),
  notes:                 z.string().optional(),
  status: z.enum([
    PO_STATUS.DRAFT, PO_STATUS.SENT, PO_STATUS.ACCEPTED,
    PO_STATUS.IN_TRANSIT, PO_STATUS.RECEIVED, PO_STATUS.CANCELLED,
  ]).optional(),
});

type POFormData = z.infer<typeof poSchema>;

const STATUS_OPTIONS: SelectOption[] = [
  { value: PO_STATUS.DRAFT,      label: 'Draft'      },
  { value: PO_STATUS.SENT,       label: 'Sent'       },
  { value: PO_STATUS.ACCEPTED,   label: 'Accepted'   },
  { value: PO_STATUS.IN_TRANSIT, label: 'In Transit' },
  { value: PO_STATUS.RECEIVED,   label: 'Received'   },
  { value: PO_STATUS.CANCELLED,  label: 'Cancelled'  },
];

interface POModalProps {
  isOpen:         boolean;
  onClose:        () => void;
  onSubmit:       (data: CreatePurchaseOrderDto | UpdatePurchaseOrderDto) => Promise<void>;
  order?:         PurchaseOrder | null;
  isSubmitting:   boolean;
  vendorOptions:  SelectOption[];
}

export function POModal({
  isOpen,
  onClose,
  onSubmit,
  order,
  isSubmitting,
  vendorOptions,
}: POModalProps) {
  const isEdit = !!order;

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
      title={isEdit ? `Edit ${order.poNumber}` : 'New Purchase Order'}
      maxWidth="700px"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="po-form" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Order'}
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
            label="Vendor"
            options={vendorOptions}
            placeholder="Select vendor"
            error={errors.vendorId?.message}
            required
            {...register('vendorId')}
          />
          <Input
            label="Expected Delivery"
            type="date"
            error={errors.expectedDeliveryDate?.message}
            {...register('expectedDeliveryDate')}
          />
        </div>

        <hr className={styles.divider} />
        <div className={styles.sectionLabel}>Line Items</div>

        {fields.map((field, index) => (
          <div key={field.id} className={styles.itemRow}>
            <Input
              label={index === 0 ? 'Product / Description' : undefined}
              placeholder="e.g. Swift Front Windshield"
              error={errors.items?.[index]?.productName?.message}
              {...register(`items.${index}.productName`)}
            />
            <Input
              label={index === 0 ? 'Qty' : undefined}
              type="number"
              placeholder="1"
              error={errors.items?.[index]?.quantity?.message}
              {...register(`items.${index}.quantity`)}
            />
            <Input
              label={index === 0 ? 'Unit Price (₹)' : undefined}
              type="number"
              placeholder="0"
              error={errors.items?.[index]?.unitPrice?.message}
              {...register(`items.${index}.unitPrice`)}
            />
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Remove item"
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
          Add Item
        </Button>

        <div className={styles.totalsBox}>
          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>GST (18%)</span>
            <span>{formatINR(gstAmount)}</span>
          </div>
          <div className={styles.totalRowBold}>
            <span>Total</span>
            <span>{formatINR(totalAmount)}</span>
          </div>
        </div>

        <div className={styles.row}>
          <Input
            label="Notes (optional)"
            placeholder="Any special instructions…"
            {...register('notes')}
          />
          {isEdit && (
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              error={errors.status?.message}
              {...register('status')}
            />
          )}
        </div>
      </form>
    </Modal>
  );
}
