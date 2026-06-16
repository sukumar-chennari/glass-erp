import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { VENDOR_STATUS } from '@/constants/statuses';
import type { Vendor, CreateVendorDto, UpdateVendorDto } from '@/types/models/vendor';
import type { SelectOption } from '@/types/ui';
import styles from './VendorModal.module.css';

const vendorSchema = z.object({
  companyName:   z.string().min(2, 'Company name is required'),
  contactPerson: z.string().min(2, 'Contact person is required'),
  phone:         z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email:         z.string().email('Enter a valid email address').optional().or(z.literal('')),
  gstNumber:     z
    .string()
    .length(15, 'GST number must be 15 characters')
    .regex(
      /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/,
      'Enter a valid GST number (e.g. 27AABCB1234A1Z5)',
    ),
  city:             z.string().min(1, 'City is required'),
  state:            z.string().optional(),
  address:          z.string().optional(),
  productsSupplied: z.string().optional(),
  status:           z
    .enum([VENDOR_STATUS.ACTIVE, VENDOR_STATUS.ON_HOLD, VENDOR_STATUS.INACTIVE])
    .optional(),
});

type VendorFormData = z.infer<typeof vendorSchema>;

const STATUS_OPTIONS: SelectOption[] = [
  { value: VENDOR_STATUS.ACTIVE,   label: 'Active'   },
  { value: VENDOR_STATUS.ON_HOLD,  label: 'On Hold'  },
  { value: VENDOR_STATUS.INACTIVE, label: 'Inactive' },
];

interface VendorModalProps {
  isOpen:       boolean;
  onClose:      () => void;
  onSubmit:     (data: CreateVendorDto | UpdateVendorDto) => Promise<void>;
  vendor?:      Vendor | null;
  isSubmitting: boolean;
}

export function VendorModal({
  isOpen,
  onClose,
  onSubmit,
  vendor,
  isSubmitting,
}: VendorModalProps) {
  const { t } = useTranslation(['vendors', 'common']);
  const isEdit = !!vendor;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
  });

  useEffect(() => {
    if (isOpen) {
      reset(
        vendor
          ? {
              companyName:      vendor.companyName,
              contactPerson:    vendor.contactPerson,
              phone:            vendor.phone,
              email:            vendor.email ?? '',
              gstNumber:        vendor.gstNumber,
              city:             vendor.city,
              state:            vendor.state ?? '',
              address:          vendor.address ?? '',
              productsSupplied: vendor.productsSupplied?.join(', ') ?? '',
              status:           vendor.status,
            }
          : {
              companyName: '', contactPerson: '', phone: '', email: '',
              gstNumber: '', city: '', state: '', address: '',
              productsSupplied: '',
            },
      );
    }
  }, [isOpen, vendor, reset]);

  const handleFormSubmit = async (data: VendorFormData) => {
    const { productsSupplied, status, ...rest } = data;
    const dto: CreateVendorDto | UpdateVendorDto = {
      ...rest,
      email: data.email || undefined,
      productsSupplied: productsSupplied
        ? productsSupplied.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined,
      ...(isEdit && status ? { status } : {}),
    };
    await onSubmit(dto);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('form.title.edit') : t('form.title.add')}
      maxWidth="640px"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('actions.cancel')}
          </Button>
          <Button
            type="submit"
            form="vendor-form"
            loading={isSubmitting}
          >
            {isEdit ? t('actions.saveChanges') : t('form.title.add')}
          </Button>
        </div>
      }
    >
      <form
        id="vendor-form"
        className={styles.form}
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
      >
        <Input
          label={t('form.companyName')}
          placeholder={t('form.placeholders.companyName')}
          error={errors.companyName?.message}
          fullWidth
          required
          {...register('companyName')}
        />

        <div className={styles.row}>
          <Input
            label={t('form.contactPerson')}
            placeholder={t('form.placeholders.contactPerson')}
            error={errors.contactPerson?.message}
            required
            {...register('contactPerson')}
          />
          <Input
            label={t('form.phone')}
            placeholder={t('form.placeholders.phone')}
            error={errors.phone?.message}
            required
            {...register('phone')}
          />
        </div>

        <div className={styles.row}>
          <Input
            label={t('form.email')}
            type="email"
            placeholder={t('form.placeholders.email')}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label={t('form.gstNumber')}
            placeholder={t('form.placeholders.gstNumber')}
            error={errors.gstNumber?.message}
            required
            {...register('gstNumber')}
          />
        </div>

        <div className={styles.row}>
          <Input
            label={t('form.city')}
            placeholder={t('form.placeholders.city')}
            error={errors.city?.message}
            required
            {...register('city')}
          />
          <Input
            label={t('form.state')}
            placeholder={t('form.placeholders.state')}
            error={errors.state?.message}
            {...register('state')}
          />
        </div>

        <Input
          label={t('form.address')}
          placeholder={t('form.placeholders.address')}
          error={errors.address?.message}
          fullWidth
          {...register('address')}
        />

        <Input
          label={t('form.productsSupplied')}
          placeholder={t('form.placeholders.productsSupplied')}
          hint={t('form.productsHint')}
          error={errors.productsSupplied?.message}
          fullWidth
          {...register('productsSupplied')}
        />

        {isEdit && (
          <Select
            label={t('form.status')}
            options={STATUS_OPTIONS}
            error={errors.status?.message}
            fullWidth
            {...register('status')}
          />
        )}
      </form>
    </Modal>
  );
}
