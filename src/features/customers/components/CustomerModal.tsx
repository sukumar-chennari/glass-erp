import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Customer, CreateCustomerDto } from '@/types/models/customer';
import styles from './CustomerModal.module.css';

const customerSchema = z.object({
  name:    z.string().min(2, 'Customer name is required'),
  phone:   z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email:   z.string().email('Enter a valid email').optional().or(z.literal('')),
  city:    z.string().optional(),
  address: z.string().optional(),
  // Vehicle fields
  vehicleMake:  z.string().min(1, 'Vehicle make is required'),
  vehicleModel: z.string().min(1, 'Vehicle model is required'),
  vehicleYear:  z.coerce
    .number()
    .int()
    .min(1990, 'Enter year after 1990')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the future'),
  registrationNo: z.string().min(5, 'Registration number is required'),
  vehicleColor:   z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

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
  const isEdit = !!customer;

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
      title={isEdit ? 'Edit Customer' : 'Add Customer'}
      maxWidth="640px"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="customer-form" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Add Customer'}
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
            label="Full Name"
            placeholder="e.g. Ravi Kumar"
            error={errors.name?.message}
            required
            {...register('name')}
          />
          <Input
            label="Phone"
            placeholder="10-digit mobile"
            error={errors.phone?.message}
            required
            {...register('phone')}
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Email"
            type="email"
            placeholder="customer@gmail.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="City"
            placeholder="e.g. New Delhi"
            error={errors.city?.message}
            {...register('city')}
          />
        </div>

        <Input
          label="Address"
          placeholder="Street address (optional)"
          error={errors.address?.message}
          fullWidth
          {...register('address')}
        />

        <hr className={styles.divider} />
        <div className={styles.sectionLabel}>Vehicle Details</div>

        <div className={styles.row}>
          <Input
            label="Make"
            placeholder="e.g. Honda"
            error={errors.vehicleMake?.message}
            required
            {...register('vehicleMake')}
          />
          <Input
            label="Model"
            placeholder="e.g. City"
            error={errors.vehicleModel?.message}
            required
            {...register('vehicleModel')}
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Year"
            type="number"
            placeholder={String(new Date().getFullYear())}
            error={errors.vehicleYear?.message}
            required
            {...register('vehicleYear')}
          />
          <Input
            label="Color"
            placeholder="e.g. White"
            error={errors.vehicleColor?.message}
            {...register('vehicleColor')}
          />
        </div>

        <Input
          label="Registration Number"
          placeholder="e.g. DL 01 AB 1234"
          error={errors.registrationNo?.message}
          fullWidth
          required
          {...register('registrationNo')}
        />
      </form>
    </Modal>
  );
}
