import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { StockAvailabilityPanel } from './StockAvailabilityPanel';
import { StockResolutionPanel } from './StockResolutionPanel';
import { InsuranceDetailsPanel, type InsuranceFormState } from './InsuranceDetailsPanel';
import { InsuranceWorkflowPanel } from './InsuranceWorkflowPanel';
import { PaymentStatusPanel } from './PaymentStatusPanel';
import { JOB_STATUS } from '@/constants/statuses';
import { glassPositionKey, damageTypeKey, paymentTypeKey } from '@/i18n/statusKeys';
import type { Job, CreateJobDto, DamageType, PaymentType, Insurer } from '@/types/models/job';
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

// Statuses that trigger the operations/payment panels
const OPS_STATUSES = new Set<string>([
  JOB_STATUS.ACCEPTED, JOB_STATUS.TRAVELLING, JOB_STATUS.ARRIVED,
  JOB_STATUS.WORKING, JOB_STATUS.IN_PROGRESS, JOB_STATUS.COMPLETED,
]);

const EMPTY_INSURANCE: InsuranceFormState = {
  insurer: '', policyNo: '', accidentDate: '', excessAmount: '',
};

type ModalTab = 'details' | 'ops';

interface JobFormData {
  customerId:     string;
  vehicleName:    string;
  registrationNo: string;
  glassPosition:  GlassPosition;
  damageType:     DamageType;
  technicianId?:  string;
  paymentType:    PaymentType;
  estimatedCost?: number | '';
  scheduledDate:  string;
  notes?:         string;
  status?: typeof JOB_STATUS[keyof typeof JOB_STATUS];
}

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
  const { t } = useTranslation(['jobs', 'common']);
  const isEdit = !!job;

  const [insuranceData, setInsuranceData] = useState<InsuranceFormState>(EMPTY_INSURANCE);
  const [activeTab, setActiveTab]         = useState<ModalTab>('details');

  const jobSchema = useMemo(() => z.object({
    customerId:     z.string().min(1, t('form.errors.selectCustomer')),
    vehicleName:    z.string().min(2, t('form.errors.vehicleRequired')),
    registrationNo: z.string().min(4, t('form.errors.regNoRequired')),
    glassPosition:  z.enum(GLASS_POSITIONS as [GlassPosition, ...GlassPosition[]], {
      errorMap: () => ({ message: t('form.errors.selectPosition') }),
    }),
    damageType: z.enum(DAMAGE_TYPES as [DamageType, ...DamageType[]], {
      errorMap: () => ({ message: t('form.errors.selectDamage') }),
    }),
    technicianId:  z.string().optional(),
    paymentType: z.enum(PAYMENT_TYPES as [PaymentType, ...PaymentType[]], {
      errorMap: () => ({ message: t('form.errors.selectPayment') }),
    }),
    estimatedCost: z.coerce.number().positive().optional().or(z.literal('')),
    scheduledDate: z.string().min(1, t('form.errors.dateRequired')),
    notes:         z.string().optional(),
    status: z.enum([
      JOB_STATUS.PENDING,    JOB_STATUS.ASSIGNED,   JOB_STATUS.ACCEPTED,
      JOB_STATUS.TRAVELLING, JOB_STATUS.ARRIVED,    JOB_STATUS.WORKING,
      JOB_STATUS.IN_PROGRESS,JOB_STATUS.COMPLETED,  JOB_STATUS.ON_HOLD,
      JOB_STATUS.CANCELLED,
    ]).optional(),
  }), [t]);

  const glassPositionOptions: SelectOption[] = GLASS_POSITIONS.map((p) => ({
    value: p, label: t(`glassPositions.${glassPositionKey(p)}`),
  }));
  const damageTypeOptions: SelectOption[] = DAMAGE_TYPES.map((d) => ({
    value: d, label: t(`damageTypes.${damageTypeKey(d)}`),
  }));
  const paymentTypeOptions: SelectOption[] = PAYMENT_TYPES.map((p) => ({
    value: p, label: t(`paymentTypes.${paymentTypeKey(p)}`),
  }));
  const statusOptions: SelectOption[] = [
    { value: JOB_STATUS.PENDING,     label: t('status.pending')    },
    { value: JOB_STATUS.ASSIGNED,    label: 'Assigned'              },
    { value: JOB_STATUS.IN_PROGRESS, label: t('status.inProgress') },
    { value: JOB_STATUS.COMPLETED,   label: t('status.completed')  },
    { value: JOB_STATUS.ON_HOLD,     label: t('status.onHold')     },
    { value: JOB_STATUS.CANCELLED,   label: t('status.cancelled')  },
  ];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<JobFormData>({ resolver: zodResolver(jobSchema) });

  const paymentType   = watch('paymentType');
  const vehicleName   = watch('vehicleName');
  const glassPosition = watch('glassPosition');
  const showInsurance = paymentType === 'Insurance';
  const showStock     = !!glassPosition;

  useEffect(() => {
    if (isOpen) {
      setActiveTab('details');
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
      setInsuranceData(
        job?.insuranceDetails
          ? {
              insurer:      job.insuranceDetails.insurer,
              policyNo:     job.insuranceDetails.policyNumber,
              accidentDate: job.insuranceDetails.accidentDate,
              excessAmount: String(job.insuranceDetails.excessAmount ?? ''),
            }
          : EMPTY_INSURANCE,
      );
    }
  }, [isOpen, job, reset]);

  const handleFormSubmit = async (data: JobFormData) => {
    const { status, estimatedCost, ...rest } = data;
    const dto: CreateJobDto & { status?: Job['status'] } = {
      ...rest,
      technicianId:  rest.technicianId || undefined,
      notes:         rest.notes || undefined,
      estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
      ...(isEdit && status ? { status } : {}),
      ...(showInsurance && insuranceData.insurer
        ? {
            insuranceDetails: {
              insurer:       insuranceData.insurer as Insurer,
              policyNumber:  insuranceData.policyNo,
              accidentDate:  insuranceData.accidentDate,
              excessAmount:  insuranceData.excessAmount
                ? Number(insuranceData.excessAmount)
                : undefined,
            },
          }
        : {}),
    };
    await onSubmit(dto);
  };

  const showOpsTab = isEdit && job && (
    job.paymentType === 'Insurance' ||
    OPS_STATUSES.has(job.status)    ||
    !!job.stockResolution
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? t('form.title.edit', { jobNumber: job.jobNumber }) : t('form.title.add')}
      maxWidth="680px"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {activeTab === 'ops' ? 'Close' : t('actions.cancel')}
          </Button>
          {activeTab === 'details' && (
            <Button type="submit" form="job-form" loading={isSubmitting}>
              {isEdit ? t('actions.saveChanges') : t('form.title.add')}
            </Button>
          )}
        </div>
      }
    >
      {/* Tab bar — only in edit mode when ops tab is applicable */}
      {showOpsTab && (
        <div className={styles.tabBar}>
          <button
            className={`${styles.tab} ${activeTab === 'details' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Job Details
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'ops' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('ops')}
          >
            Operations
          </button>
        </div>
      )}

      {/* Details form — hidden (not unmounted) when ops tab active */}
      <form
        id="job-form"
        className={styles.form}
        style={{ display: activeTab === 'details' ? 'flex' : 'none' }}
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
      >
        <Select
          label={t('form.customer')}
          options={customerOptions}
          placeholder={t('placeholders.select')}
          error={errors.customerId?.message}
          fullWidth
          required
          {...register('customerId')}
        />

        <div className={styles.row}>
          <Input
            label={t('form.vehicle')}
            placeholder={t('form.placeholders.vehicle')}
            error={errors.vehicleName?.message}
            required
            {...register('vehicleName')}
          />
          <Input
            label={t('form.registrationNo')}
            placeholder={t('form.placeholders.registrationNo')}
            error={errors.registrationNo?.message}
            required
            {...register('registrationNo')}
          />
        </div>

        <div className={styles.row}>
          <Select
            label={t('form.glassPosition')}
            options={glassPositionOptions}
            placeholder={t('placeholders.select')}
            error={errors.glassPosition?.message}
            required
            {...register('glassPosition')}
          />
          <Select
            label={t('form.damageType')}
            options={damageTypeOptions}
            placeholder={t('placeholders.select')}
            error={errors.damageType?.message}
            required
            {...register('damageType')}
          />
        </div>

        {/* Stock availability — shown when glass position is selected */}
        {showStock && (
          <StockAvailabilityPanel
            glassPosition={glassPosition}
            vehicleModel={vehicleName ?? ''}
          />
        )}

        <hr className={styles.divider} />
        <div className={styles.sectionLabel}>{t('form.assignment')}</div>

        <div className={styles.row3}>
          <Select
            label={t('form.technician')}
            options={technicianOptions}
            placeholder={t('form.placeholders.assignLater')}
            error={errors.technicianId?.message}
            {...register('technicianId')}
          />
          <Select
            label={t('form.paymentType')}
            options={paymentTypeOptions}
            placeholder={t('placeholders.select')}
            error={errors.paymentType?.message}
            required
            {...register('paymentType')}
          />
          <Input
            label={t('form.estimatedCost')}
            type="number"
            placeholder="0"
            error={errors.estimatedCost?.message}
            {...register('estimatedCost')}
          />
        </div>

        {/* Insurance details — shown when payment type is Insurance */}
        {showInsurance && (
          <InsuranceDetailsPanel value={insuranceData} onChange={setInsuranceData} />
        )}

        <div className={styles.row}>
          <Input
            label={t('form.scheduledDate')}
            type="date"
            error={errors.scheduledDate?.message}
            required
            {...register('scheduledDate')}
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

        <Input
          label={t('form.notes')}
          placeholder={t('form.placeholders.notes')}
          error={errors.notes?.message}
          fullWidth
          {...register('notes')}
        />
      </form>

      {/* Operations tab — insurance workflow, stock resolution, payment */}
      {activeTab === 'ops' && job && (
        <div className={styles.opsPanel}>
          {job.paymentType === 'Insurance' && (
            <InsuranceWorkflowPanel job={job} />
          )}
          {showStock && (
            <StockResolutionPanel
              job={job}
              glassPosition={job.glassPosition}
              vehicleModel={job.vehicleName}
            />
          )}
          {OPS_STATUSES.has(job.status) && (
            <PaymentStatusPanel job={job} />
          )}
        </div>
      )}
    </Modal>
  );
}
