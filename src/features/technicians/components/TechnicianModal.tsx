import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { TECH_STATUS } from '@/constants/statuses';
import type { Technician, CreateTechnicianDto, UpdateTechnicianDto } from '@/types/models/technician';
import type { SelectOption } from '@/types/ui';
import styles from './TechnicianModal.module.css';

const techSchema = z.object({
  name:             z.string().min(2, 'Name is required'),
  phone:            z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email:            z.string().email('Enter a valid email').optional().or(z.literal('')),
  specialization:   z.string().optional(),
  yearsExperience:  z.coerce.number().int().min(0).max(60).optional().or(z.literal('')),
  joiningDate:      z.string().optional(),
  status:           z
    .enum([TECH_STATUS.ACTIVE, TECH_STATUS.TRAINING, TECH_STATUS.INACTIVE, TECH_STATUS.ON_LEAVE])
    .optional(),
});

type TechFormData = z.infer<typeof techSchema>;

const STATUS_OPTIONS: SelectOption[] = [
  { value: TECH_STATUS.ACTIVE,   label: 'Active'    },
  { value: TECH_STATUS.TRAINING, label: 'Training'  },
  { value: TECH_STATUS.ON_LEAVE, label: 'On Leave'  },
  { value: TECH_STATUS.INACTIVE, label: 'Inactive'  },
];

interface TechnicianModalProps {
  isOpen:       boolean;
  onClose:      () => void;
  onSubmit:     (data: CreateTechnicianDto | UpdateTechnicianDto) => Promise<void>;
  technician?:  Technician | null;
  isSubmitting: boolean;
}

export function TechnicianModal({
  isOpen,
  onClose,
  onSubmit,
  technician,
  isSubmitting,
}: TechnicianModalProps) {
  const isEdit = !!technician;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TechFormData>({ resolver: zodResolver(techSchema) });

  useEffect(() => {
    if (isOpen) {
      reset(
        technician
          ? {
              name:            technician.name,
              phone:           technician.phone,
              email:           technician.email ?? '',
              specialization:  technician.specialization ?? '',
              yearsExperience: technician.yearsExperience ?? '',
              joiningDate:     technician.joiningDate ?? '',
              status:          technician.status,
            }
          : {
              name: '', phone: '', email: '', specialization: '',
              yearsExperience: '', joiningDate: '',
            },
      );
    }
  }, [isOpen, technician, reset]);

  const handleFormSubmit = async (data: TechFormData) => {
    const { status, yearsExperience, ...rest } = data;
    const dto: CreateTechnicianDto | UpdateTechnicianDto = {
      ...rest,
      email:           data.email || undefined,
      specialization:  data.specialization || undefined,
      joiningDate:     data.joiningDate || undefined,
      yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
      ...(isEdit && status ? { status } : {}),
    };
    await onSubmit(dto);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Technician' : 'Add Technician'}
      maxWidth="560px"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="tech-form" loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Add Technician'}
          </Button>
        </div>
      }
    >
      <form
        id="tech-form"
        className={styles.form}
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
      >
        <Input
          label="Full Name"
          placeholder="e.g. Arun Mehta"
          error={errors.name?.message}
          fullWidth
          required
          {...register('name')}
        />

        <div className={styles.row}>
          <Input
            label="Phone"
            placeholder="10-digit mobile"
            error={errors.phone?.message}
            required
            {...register('phone')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="tech@windx.in"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Specialization"
            placeholder="e.g. Windshield Replacement"
            error={errors.specialization?.message}
            {...register('specialization')}
          />
          <Input
            label="Years of Experience"
            type="number"
            placeholder="0"
            error={errors.yearsExperience?.message}
            {...register('yearsExperience')}
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Joining Date"
            type="date"
            error={errors.joiningDate?.message}
            {...register('joiningDate')}
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
