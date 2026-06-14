import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
      title={isEdit ? 'Edit Vendor' : 'Add Vendor'}
      maxWidth="640px"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="vendor-form"
            loading={isSubmitting}
          >
            {isEdit ? 'Save Changes' : 'Add Vendor'}
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
          label="Company Name"
          placeholder="e.g. Bajaj Glass Supplies"
          error={errors.companyName?.message}
          fullWidth
          required
          {...register('companyName')}
        />

        <div className={styles.row}>
          <Input
            label="Contact Person"
            placeholder="e.g. Rajesh Patel"
            error={errors.contactPerson?.message}
            required
            {...register('contactPerson')}
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
            placeholder="vendor@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="GST Number"
            placeholder="e.g. 27AABCB1234A1Z5"
            error={errors.gstNumber?.message}
            required
            {...register('gstNumber')}
          />
        </div>

        <div className={styles.row}>
          <Input
            label="City"
            placeholder="e.g. Mumbai"
            error={errors.city?.message}
            required
            {...register('city')}
          />
          <Input
            label="State"
            placeholder="e.g. Maharashtra"
            error={errors.state?.message}
            {...register('state')}
          />
        </div>

        <Input
          label="Address"
          placeholder="Street address (optional)"
          error={errors.address?.message}
          fullWidth
          {...register('address')}
        />

        <Input
          label="Products Supplied"
          placeholder="e.g. Windshields, Side Glass, Sunroof"
          hint="Separate multiple products with commas"
          error={errors.productsSupplied?.message}
          fullWidth
          {...register('productsSupplied')}
        />

        {isEdit && (
          <Select
            label="Status"
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
