import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { VENDOR_STATUS } from '@/constants/statuses';
import { vendorStatusKey } from '@/i18n/statusKeys';
import type { Vendor, CreateVendorDto, UpdateVendorDto } from '@/types/models/vendor';
import type { SelectOption } from '@/types/ui';
import styles from './VendorModal.module.css';

interface VendorFormData {
  companyName:      string;
  contactPerson:    string;
  phone:            string;
  email?:           string;
  gstNumber:        string;
  city:             string;
  state?:           string;
  address?:         string;
  productsSupplied?: string;
  status?:          string;
}

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

  const vendorSchema = useMemo(() => z.object({
    companyName:   z.string().min(2, t('form.errors.companyRequired')),
    contactPerson: z.string().min(2, t('form.errors.contactRequired')),
    phone:         z.string().regex(/^[6-9]\d{9}$/, t('form.errors.phoneInvalid')),
    email:         z.string().email(t('form.errors.emailInvalid')).optional().or(z.literal('')),
    gstNumber:     z
      .string()
      .length(15, t('form.errors.gstLength'))
      .regex(
        /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/,
        t('form.errors.gstFormat'),
      ),
    city:             z.string().min(1, t('form.errors.cityRequired')),
    state:            z.string().optional(),
    address:          z.string().optional(),
    productsSupplied: z.string().optional(),
    status:           z
      .enum([VENDOR_STATUS.ACTIVE, VENDOR_STATUS.ON_HOLD, VENDOR_STATUS.INACTIVE])
      .optional(),
  }), [t]);

  const statusOptions = useMemo<SelectOption[]>(() => [
    { value: VENDOR_STATUS.ACTIVE,   label: t(`status.${vendorStatusKey(VENDOR_STATUS.ACTIVE)}`)   },
    { value: VENDOR_STATUS.ON_HOLD,  label: t(`status.${vendorStatusKey(VENDOR_STATUS.ON_HOLD)}`)  },
    { value: VENDOR_STATUS.INACTIVE, label: t(`status.${vendorStatusKey(VENDOR_STATUS.INACTIVE)}`) },
  ], [t]);

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
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button
            type="submit"
            form="vendor-form"
            loading={isSubmitting}
          >
            {isEdit ? t('actions.saveChanges', { ns: 'common' }) : t('form.title.add')}
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
            options={statusOptions}
            error={errors.status?.message}
            fullWidth
            {...register('status')}
          />
        )}
      </form>
    </Modal>
  );
}
