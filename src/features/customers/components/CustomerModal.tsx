import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Customer, CreateCustomerDto } from '@/types/models/customer';
import styles from './CustomerModal.module.css';

interface CustomerFormData {
  name:           string;
  phone:          string;
  email?:         string;
  city?:          string;
  address?:       string;
  vehicleMake:    string;
  vehicleModel:   string;
  vehicleYear:    number;
  registrationNo: string;
  vehicleColor?:  string;
}

interface CustomerModalProps {
  isOpen:       boolean;
  onClose:      () => void;
  onSubmit:     (data: CreateCustomerDto) => Promise<void>;
  customer?:    Customer | null;
  isSubmitting: boolean;
}

export function CustomerModal({
  isOpen,
  onClose,
  onSubmit,
  customer,
  isSubmitting,
}: CustomerModalProps) {
  const { t } = useTranslation(['customers', 'common']);
  const isEdit = !!customer;

  const customerSchema = useMemo(() => z.object({
    name:    z.string().min(2, t('form.errors.nameRequired')),
    phone:   z.string().regex(/^[6-9]\d{9}$/, t('validation.phone')),
    email:   z.string().email(t('validation.email')).optional().or(z.literal('')),
    city:    z.string().optional(),
    address: z.string().optional(),
    vehicleMake:    z.string().min(1, t('form.errors.vehicleMakeRequired')),
    vehicleModel:   z.string().min(1, t('form.errors.vehicleModelRequired')),
    vehicleYear:    z.coerce
      .number()
      .int()
      .min(1990, t('form.errors.yearMin'))
      .max(new Date().getFullYear() + 1, t('form.errors.yearMax')),
    registrationNo: z.string().min(5, t('form.errors.regNoRequired')),
    vehicleColor:   z.string().optional(),
  }), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  useEffect(() => {
    if (isOpen) {
      const v = customer?.vehicles[0];
      reset(
        customer
          ? {
              name:    customer.name,
              phone:   customer.phone,
              email:   customer.email ?? '',
              city:    customer.city ?? '',
              address: customer.address ?? '',
              vehicleMake:    v?.make ?? '',
              vehicleModel:   v?.model ?? '',
              vehicleYear:    v?.year ?? new Date().getFullYear(),
              registrationNo: v?.registrationNo ?? '',
              vehicleColor:   v?.color ?? '',
            }
          : {
              name: '', phone: '', email: '', city: '', address: '',
              vehicleMake: '', vehicleModel: '',
              vehicleYear: new Date().getFullYear(),
              registrationNo: '', vehicleColor: '',
            },
      );
    }
  }, [isOpen, customer, reset]);

  const handleFormSubmit = async (data: CustomerFormData) => {
    const dto: CreateCustomerDto = {
      name:    data.name,
      phone:   data.phone,
      email:   data.email || undefined,
      city:    data.city  || undefined,
      address: data.address || undefined,
      vehicles: [
        {
          make:           data.vehicleMake,
          model:          data.vehicleModel,
          year:           Number(data.vehicleYear),
          registrationNo: data.registrationNo,
          color:          data.vehicleColor || undefined,
        },
      ],
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
          <Button type="submit" form="customer-form" loading={isSubmitting}>
            {isEdit ? t('actions.saveChanges') : t('form.title.add')}
          </Button>
        </div>
      }
    >
      <form
        id="customer-form"
        className={styles.form}
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
      >
        <div className={styles.row}>
          <Input
            label={t('form.name')}
            placeholder={t('form.placeholders.name')}
            error={errors.name?.message}
            required
            {...register('name')}
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
            label={t('form.city')}
            placeholder={t('form.placeholders.city')}
            error={errors.city?.message}
            {...register('city')}
          />
        </div>

        <Input
          label={t('form.address')}
          placeholder={t('form.placeholders.address')}
          error={errors.address?.message}
          fullWidth
          {...register('address')}
        />

        <hr className={styles.divider} />
        <div className={styles.sectionLabel}>{t('form.vehicle.sectionLabel')}</div>

        <div className={styles.row}>
          <Input
            label={t('form.vehicle.make')}
            placeholder={t('form.placeholders.vehicleMake')}
            error={errors.vehicleMake?.message}
            required
            {...register('vehicleMake')}
          />
          <Input
            label={t('form.vehicle.model')}
            placeholder={t('form.placeholders.vehicleModel')}
            error={errors.vehicleModel?.message}
            required
            {...register('vehicleModel')}
          />
        </div>

        <div className={styles.row}>
          <Input
            label={t('form.vehicle.year')}
            type="number"
            placeholder={String(new Date().getFullYear())}
            error={errors.vehicleYear?.message}
            required
            {...register('vehicleYear')}
          />
          <Input
            label={t('form.vehicle.color')}
            placeholder={t('form.placeholders.vehicleColor')}
            error={errors.vehicleColor?.message}
            {...register('vehicleColor')}
          />
        </div>

        <Input
          label={t('form.vehicle.registrationNo')}
          placeholder={t('form.placeholders.registrationNo')}
          error={errors.registrationNo?.message}
          fullWidth
          required
          {...register('registrationNo')}
        />
      </form>
    </Modal>
  );
}
