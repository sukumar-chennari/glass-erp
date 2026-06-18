import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { TECH_STATUS } from '@/constants/statuses';
import { techStatusKey } from '@/i18n/statusKeys';
import type { Technician, CreateTechnicianDto, UpdateTechnicianDto } from '@/types/models/technician';
import type { SelectOption } from '@/types/ui';
import styles from './TechnicianModal.module.css';

interface TechFormData {
  name:             string;
  phone:            string;
  email?:           string;
  specialization?:  string;
  yearsExperience?: number | string;
  joiningDate?:     string;
  status?:          string;
}

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
  const { t } = useTranslation(['technicians', 'common']);
  const isEdit = !!technician;

  const techSchema = useMemo(() => z.object({
    name:             z.string().min(2, t('form.errors.nameRequired')),
    phone:            z.string().regex(/^[6-9]\d{9}$/, t('form.errors.phoneInvalid')),
    email:            z.string().email(t('form.errors.emailInvalid')).optional().or(z.literal('')),
    specialization:   z.string().optional(),
    yearsExperience:  z.coerce.number().int().min(0).max(60).optional().or(z.literal('')),
    joiningDate:      z.string().optional(),
    status:           z
      .enum([TECH_STATUS.ACTIVE, TECH_STATUS.TRAINING, TECH_STATUS.INACTIVE, TECH_STATUS.ON_LEAVE])
      .optional(),
  }), [t]);

  const statusOptions = useMemo<SelectOption[]>(() => [
    { value: TECH_STATUS.ACTIVE,   label: t(`status.${techStatusKey(TECH_STATUS.ACTIVE)}`) },
    { value: TECH_STATUS.TRAINING, label: t(`status.${techStatusKey(TECH_STATUS.TRAINING)}`) },
    { value: TECH_STATUS.ON_LEAVE, label: t(`status.${techStatusKey(TECH_STATUS.ON_LEAVE)}`) },
    { value: TECH_STATUS.INACTIVE, label: t(`status.${techStatusKey(TECH_STATUS.INACTIVE)}`) },
  ], [t]);

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
      title={isEdit ? t('form.title.edit') : t('form.title.add')}
      maxWidth="560px"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" form="tech-form" loading={isSubmitting}>
            {isEdit ? t('actions.saveChanges', { ns: 'common' }) : t('form.buttons.add')}
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
          label={t('form.name')}
          placeholder={t('form.placeholders.name')}
          error={errors.name?.message}
          fullWidth
          required
          {...register('name')}
        />

        <div className={styles.row}>
          <Input
            label={t('form.phone')}
            placeholder={t('form.placeholders.phone')}
            error={errors.phone?.message}
            required
            {...register('phone')}
          />
          <Input
            label={t('form.email')}
            type="email"
            placeholder={t('form.placeholders.email')}
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className={styles.row}>
          <Input
            label={t('form.specialization')}
            placeholder={t('form.placeholders.specialization')}
            error={errors.specialization?.message}
            {...register('specialization')}
          />
          <Input
            label={t('form.yearsExperience')}
            type="number"
            placeholder="0"
            error={errors.yearsExperience?.message}
            {...register('yearsExperience')}
          />
        </div>

        <div className={styles.row}>
          <Input
            label={t('form.joiningDate')}
            type="date"
            error={errors.joiningDate?.message}
            {...register('joiningDate')}
          />
          {isEdit && (
            <Select
              label={t('form.status')}
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
