import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { JOB_STATUS } from '@/constants/statuses';
import type { Job, CreateJobDto, DamageType, PaymentType } from '@/types/models/job';
import type { GlassPosition } from '@/types/models/product';
import type { SelectOption } from '@/types/ui';
import styles from './JobModal.module.css';

const GLASS_POSITIONS: GlassPosition[] = [
  'Front Windshield', 'Rear Windshield', 'Driver Side Window',
  'Passenger Side Window', 'Rear Left Window', 'Rear Right Window',
  'Sunroof Glass', 'Quarter Glass',
];

const DAMAGE_TYPES: DamageType[] = [
  'Crack', 'Chip / Stone Impact', 'Complete Shatter', 'Scratch', 'Stress Fracture',
];

const PAYMENT_TYPES: PaymentType[] = ['Cash', 'Insurance', 'Card', 'UPI'];

const STATUS_OPTIONS: SelectOption[] = [
  { value: JOB_STATUS.PENDING,     label: 'Pending'     },
  { value: JOB_STATUS.IN_PROGRESS, label: 'In Progress' },
  { value: JOB_STATUS.COMPLETED,   label: 'Completed'   },
  { value: JOB_STATUS.ON_HOLD,     label: 'On Hold'     },
  { value: JOB_STATUS.CANCELLED,   label: 'Cancelled'   },
];

const jobSchema = z.object({
  customerId:     z.string().min(1, 'Select a customer'),
  vehicleName:    z.string().min(2, 'Vehicle name required'),
  registrationNo: z.string().min(4, 'Registration number required'),
  glassPosition:  z.enum(GLASS_POSITIONS as [GlassPosition, ...GlassPosition[]], {
    errorMap: () => ({ message: 'Select glass position' }),
  }),
  damageType: z.enum(DAMAGE_TYPES as [DamageType, ...DamageType[]], {
    errorMap: () => ({ message: 'Select damage type' }),
  }),
  technicianId:  z.string().optional(),
  paymentType: z.enum(PAYMENT_TYPES as [PaymentType, ...PaymentType[]], {
    errorMap: () => ({ message: 'Select payment type' }),
  }),
  estimatedCost: z.coerce.number().positive().optional().or(z.literal('')),
  scheduledDate: z.string().min(1, 'Scheduled date required'),
  notes:         z.string().optional(),
  status: z.enum([
    JOB_STATUS.PENDING, JOB_STATUS.IN_PROGRESS, JOB_STATUS.COMPLETED,
    JOB_STATUS.ON_HOLD, JOB_STATUS.CANCELLED,
  ]).optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

interface JobModalProps {
  isOpen:            boolean;
  onClose:           () => void;
  onSubmit:          (data: CreateJobDto & { status?: Job['status'] }) => Promise<void>;
  job?:              Job | null;
  isSubmitting:      boolean;
  customerOptions:   SelectOption[];
  technicianOptions: SelectOption[];
}

export function JobModal({
  isOpen,
  onClose,
  onSubmit,
  job,
  isSubmitting,
  customerOptions,
  technicianOptions,
}: JobModalProps) {
  const isEdit = !!job;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobFormData>({ resolver: zodResolver(jobSchema) });

  useEffect(() => {
    if (isOpen) {
      reset(
        job
          ? {
              customerId:     job.customerId,
              vehicleName:    job.vehicleName,
              registrationNo: job.registrationNo,
              glassPosition:  job.glassPosition,
              damageType:     job.damageType,
              technicianId:   job.technicianId ?? '',
              paymentType:    job.paymentType,
              estimatedCost:  job.estimatedCost ?? '',
              scheduledDate:  job.scheduledDate,
              notes:          job.notes ?? '',
              status:         job.status,
            }
          : {
              customerId: '', vehicleName: '', registrationNo: '',
              glassPosition: undefined, damageType: undefined,
              technicianId: '', paymentType: undefined,
              estimatedCost: '', scheduledDate: '', notes: '',
            },
      );
    }
  }, [isOpen, job, reset]);

  const handleFormSubmit = async (data: JobFormData) => {
    const { status, estimatedCost, ...rest } = data;
    const dto = {
      ...rest,
      technicianId:  rest.technicianId || undefined,
      notes:         rest.notes || undefined,
      estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
      ...(isEdit && status ? { status } : {}),
    };
    await onSubmit(dto);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit ${job.jobNumber}` : 'New Job Card'}
      maxWidth="680px"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="job-form" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Job'}
          </Button>
        </div>
      }
    >
      <form
        id="job-form"
        className={styles.form}
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
      >
        <Select
          label="Customer"
          options={customerOptions}
          placeholder="Select customer"
          error={errors.customerId?.message}
          fullWidth
          required
          {...register('customerId')}
        />

        <div className={styles.row}>
          <Input
            label="Vehicle"
            placeholder="e.g. Honda City 2020"
            error={errors.vehicleName?.message}
            required
            {...register('vehicleName')}
          />
          <Input
            label="Registration Number"
            placeholder="e.g. DL 01 AB 1234"
            error={errors.registrationNo?.message}
            required
            {...register('registrationNo')}
          />
        </div>

        <div className={styles.row}>
          <Select
            label="Glass Position"
            options={GLASS_POSITIONS.map((p) => ({ value: p, label: p }))}
            placeholder="Select position"
            error={errors.glassPosition?.message}
            required
            {...register('glassPosition')}
          />
          <Select
            label="Damage Type"
            options={DAMAGE_TYPES.map((d) => ({ value: d, label: d }))}
            placeholder="Select damage type"
            error={errors.damageType?.message}
            required
            {...register('damageType')}
          />
        </div>

        <hr className={styles.divider} />
        <div className={styles.sectionLabel}>Assignment & Payment</div>

        <div className={styles.row3}>
          <Select
            label="Technician"
            options={technicianOptions}
            placeholder="Assign later"
            error={errors.technicianId?.message}
            {...register('technicianId')}
          />
          <Select
            label="Payment Type"
            options={PAYMENT_TYPES.map((p) => ({ value: p, label: p }))}
            placeholder="Select type"
            error={errors.paymentType?.message}
            required
            {...register('paymentType')}
          />
          <Input
            label="Estimated Cost (₹)"
            type="number"
            placeholder="0"
            error={errors.estimatedCost?.message}
            {...register('estimatedCost')}
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Scheduled Date"
            type="date"
            error={errors.scheduledDate?.message}
            required
            {...register('scheduledDate')}
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

        <Input
          label="Notes (optional)"
          placeholder="Any additional instructions…"
          error={errors.notes?.message}
          fullWidth
          {...register('notes')}
        />
      </form>
    </Modal>
  );
}
