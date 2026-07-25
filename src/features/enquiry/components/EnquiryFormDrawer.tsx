import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, AlertCircle, Lock, Loader2 } from 'lucide-react';
import { useGetCarBrandsQuery } from '@/features/settings/services/carBrandsApi';
import { useGetCarModelsQuery } from '@/features/settings/services/carModelsApi';
import { useGetVariantsQuery, useGetGlassTypesQuery, useGetDescriptionsQuery } from '@/services/catalogApi';
import { useAuth } from '@/context/AuthContext';
import { VehiclePickerModal } from '@/components/ui/VehiclePickerModal';
import styles from './EnquiryFormDrawer.module.css';

// ── Form value types ────────────────────────────────────────────────────────

export interface EnquiryFormValues {
  customerName:     string;
  phone:            string;
  branchId:         string;
  source:           string;
  // vehicle — brand / model
  vehicleBrandId:   string;
  vehicleBrand:     string;
  vehicleModelId:   string; // internal id; not submitted directly
  vehicleModel:     string; // model name for API
  // model metadata — read-only display derived from selected model
  modelCc:          number | null;
  modelCcCondition: string;
  modelBodyType:    string[];
  // catalog cascade
  variantId:        string;
  variantName:      string;
  glassTypeId:      string; // internal id for catalog chain
  glassType:        string; // name for API submission
  description:      string;
  // service
  serviceType:      'Replacement' | 'Repair' | '';
  // vehicle details
  vehicleYear:      string;
  vehicleNumber:    string;
  vehicleType:      'Private' | 'Commercial' | '';
  // service
  paymentType:      'Cash' | 'Insurance' | '';
  insurerName:      string;
  accidentDate:     string;
  appointmentDate:  string;
  damageNotes:      string;
}

export const EMPTY_FORM: EnquiryFormValues = {
  customerName: '', phone: '', branchId: '', source: '',
  vehicleBrandId: '', vehicleBrand: '', vehicleModelId: '', vehicleModel: '',
  modelCc: null, modelCcCondition: '', modelBodyType: [],
  variantId: '', variantName: '',
  glassTypeId: '', glassType: '',
  description: '', serviceType: '',
  vehicleYear: '', vehicleNumber: '', vehicleType: '',
  paymentType: '', insurerName: '',
  accidentDate: '', appointmentDate: '', damageNotes: '',
};

// ── Component props ─────────────────────────────────────────────────────────

interface EnquiryFormDrawerProps {
  isOpen:         boolean;
  onClose:        () => void;
  onSave:         (values: EnquiryFormValues) => void;
  initialValues?: Partial<EnquiryFormValues>;
  mode:           'create' | 'complete' | 'update';
  enquiryNo?:     string;
  isSaving?:      boolean;
}

// ── Static options ──────────────────────────────────────────────────────────

const SOURCE_OPTIONS = [
  { value: 'phone',           label: 'Phone Call'        },
  { value: 'walk_in',         label: 'Walk In'           },
  { value: 'whatsapp',        label: 'WhatsApp'          },
  { value: 'google',          label: 'Google Search'     },
  { value: 'referral',        label: 'Friend / Referral' },
  { value: 'insurance_agent', label: 'Insurance Agent'   },
  { value: 'mechanic',        label: 'Mechanic'          },
  { value: 'other',           label: 'Other'             },
];

const INSURER_OPTIONS = [
  'HDFC Ergo', 'ICICI Lombard', 'Bajaj Allianz', 'New India Assurance',
  'Oriental Insurance', 'National Insurance', 'United India Insurance',
  'Tata AIG', 'SBI General', 'Reliance General', 'Acko', 'Go Digit', 'Other',
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1999 }, (_, i) => String(CURRENT_YEAR - i));

const STEP_LABELS = ['Contact', 'Vehicle', 'Service', 'Docs'];

type FormErrors = Partial<Record<keyof EnquiryFormValues, string>>;

// ── Component ───────────────────────────────────────────────────────────────

export function EnquiryFormDrawer({
  isOpen, onClose, onSave, initialValues, mode, enquiryNo, isSaving = false,
}: EnquiryFormDrawerProps) {
  const { session }       = useAuth();
  const sessionBranch     = session?.branch ?? null;

  const [step,       setStep]       = useState(1);
  const [form,       setForm]       = useState<EnquiryFormValues>({ ...EMPTY_FORM, ...initialValues });
  const [errors,     setErrors]     = useState<FormErrors>({});
  const [stepErrors, setStepErrors] = useState<Record<number, boolean>>({});
  const [brandSearch, setBrandSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setForm({ ...EMPTY_FORM, branchId: sessionBranch?.id ?? '', ...initialValues });
      setStep(1);
      setErrors({});
      setStepErrors({});
      setBrandSearch('');
      setModelSearch('');
    }
  // initialValues identity changes on every render — spread once at open
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // ── Data hooks (must run before any conditional return) ──────────────────

  const { data: carBrands = [], isFetching: brandsLoading } = useGetCarBrandsQuery({
    status: 'ACTIVE',
    search: brandSearch || undefined,
  });

  const { data: carModels = [], isFetching: modelsLoading } = useGetCarModelsQuery(
    form.vehicleBrandId
      ? { brandId: form.vehicleBrandId, status: 'ACTIVE', search: modelSearch || undefined }
      : undefined,
    { skip: !form.vehicleBrandId },
  );

  const { data: variants = [], isFetching: variantsLoading } = useGetVariantsQuery(
    { modelId: form.vehicleModelId },
    { skip: !form.vehicleModelId },
  );

  const { data: glassTypes = [], isFetching: glassTypesLoading } = useGetGlassTypesQuery(
    { variantId: form.variantId },
    { skip: !form.variantId },
  );

  const { data: descriptions = [], isFetching: descriptionsLoading } = useGetDescriptionsQuery(
    { variantId: form.variantId, glassPartTypeId: form.glassTypeId },
    { skip: !form.variantId || !form.glassTypeId },
  );

  if (!isOpen) return null;

  // ── Field helpers ────────────────────────────────────────────────────────

  function set<K extends keyof EnquiryFormValues>(key: K, value: EnquiryFormValues[K]) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  // Brand change: clear entire cascade downstream
  function handleBrandChange(brandId: string, brandName: string) {
    setModelSearch('');
    setForm((p) => ({
      ...p,
      vehicleBrandId:   brandId,
      vehicleBrand:     brandName,
      vehicleModelId:   '',
      vehicleModel:     '',
      modelCc:          null,
      modelCcCondition: '',
      modelBodyType:    [],
      variantId:        '',
      variantName:      '',
      glassTypeId:      '',
      glassType:        '',
      description:      '',
    }));
    setErrors((e) => ({
      ...e,
      vehicleBrand: undefined, vehicleModel: undefined,
      variantId: undefined, glassTypeId: undefined,
    }));
  }

  // Model change: capture metadata + clear variant/glass/description
  function handleModelChange(modelId: string, modelName: string) {
    const model = carModels.find((m) => m.id === modelId);
    setForm((p) => ({
      ...p,
      vehicleModelId:   modelId,
      vehicleModel:     modelName,
      modelCc:          model?.cc ?? null,
      modelCcCondition: model?.ccCondition ?? '',
      modelBodyType:    model?.bodyType ?? [],
      variantId:        '',
      variantName:      '',
      glassTypeId:      '',
      glassType:        '',
      description:      '',
    }));
    setErrors((e) => ({
      ...e,
      vehicleModel: undefined, variantId: undefined, glassTypeId: undefined,
    }));
  }

  // Variant change: clear glass type + description
  function handleVariantChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id      = e.target.value;
    const variant = variants.find((v) => v.id === id);
    setForm((p) => ({
      ...p,
      variantId:   id,
      variantName: variant?.variantName ?? '',
      glassTypeId: '',
      glassType:   '',
      description: '',
    }));
    setErrors((ev) => ({ ...ev, variantId: undefined, glassTypeId: undefined }));
  }

  // Glass type change (API-driven): clear description
  function handleGlassTypeChange(id: string, name: string) {
    setForm((p) => ({ ...p, glassTypeId: id, glassType: name, description: '' }));
    setErrors((e) => ({ ...e, glassTypeId: undefined }));
  }

  function handleBlur(key: keyof EnquiryFormValues) {
    const errs = runValidation(step);
    if (errs[key]) setErrors((prev) => ({ ...prev, [key]: errs[key] }));
  }

  // ── Validation ───────────────────────────────────────────────────────────

  function runValidation(s: number): FormErrors {
    const errs: FormErrors = {};

    if (s === 1) {
      if (!form.customerName.trim())          errs.customerName = 'Name is required';
      if (!form.phone)                        errs.phone        = 'Mobile number is required';
      else if (!/^\d{10}$/.test(form.phone)) errs.phone        = 'Enter a valid 10-digit number';
    }

    if (s === 2) {
      if (!form.vehicleBrandId)
        errs.vehicleBrandId = 'Select a car brand';
      if (form.vehicleBrandId && !modelsLoading && carModels.length > 0 && !form.vehicleModel)
        errs.vehicleModel = 'Select a model for the chosen brand';
      if (form.vehicleModelId && !variantsLoading && variants.length > 0 && !form.variantId)
        errs.variantId = 'Select a variant for the chosen model';
      if (!form.vehicleYear)
        errs.vehicleYear = 'Select the vehicle year';
      if (!form.vehicleNumber.trim())
        errs.vehicleNumber = 'Enter the vehicle registration number';
      if (!form.vehicleType)
        errs.vehicleType = 'Select vehicle type (Private or Commercial)';
    }

    if (s === 3) {
      if (!glassTypesLoading && glassTypes.length > 0 && !form.glassTypeId)
        errs.glassTypeId = 'Select the damaged glass type';
      if (!form.serviceType)
        errs.serviceType = 'Select service type (Replacement or Repair)';
      if (!form.paymentType)
        errs.paymentType = 'Select a payment type';
      if (form.paymentType === 'Insurance' && !form.insurerName)
        errs.insurerName = 'Select the insurance company';
    }

    return errs;
  }

  // ── Focus first invalid field on blocked Next ────────────────────────────

  function focusFirstError(errs: FormErrors) {
    const focusable: Array<[keyof EnquiryFormValues, string]> = [
      ['customerName',  'efd-customerName'],
      ['phone',         'efd-phone'],
      ['vehicleBrandId','efd-vehicleBrand'],
      ['vehicleModel',  'efd-vehicleModel'],
      ['variantId',     'efd-variantId'],
      ['vehicleYear',   'efd-vehicleYear'],
      ['vehicleNumber', 'efd-vehicleNumber'],
      ['glassTypeId',   'efd-glassTypeId'],
      ['serviceType',   'efd-serviceType'],
      ['insurerName',   'efd-insurerName'],
    ];
    for (const [key, id] of focusable) {
      if (errs[key]) {
        setTimeout(() => (document.getElementById(id) as HTMLElement | null)?.focus(), 0);
        return;
      }
    }
    setTimeout(() => {
      (document.querySelector('[data-form-err]') as HTMLElement | null)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 0);
  }

  // ── Step navigation ──────────────────────────────────────────────────────

  function handleNext() {
    const errs = runValidation(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setStepErrors((prev) => ({ ...prev, [step]: true }));
      focusFirstError(errs);
      return;
    }
    setErrors({});
    setStepErrors((prev) => ({ ...prev, [step]: false }));
    setStep((s) => s + 1);
  }

  function handleSubmit() {
    const errs = runValidation(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setStepErrors((prev) => ({ ...prev, [step]: true }));
      return;
    }
    onSave(form);
  }

  // ── Layout helpers ───────────────────────────────────────────────────────

  const progress = ((step - 1) / 3) * 100;
  const title    = mode === 'update' ? 'Update Enquiry'
                 : mode === 'complete' ? 'Complete Enquiry'
                 : 'New Enquiry';

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.card}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.headerTitle}>{title}</div>
            {enquiryNo && <div className={styles.headerSub}>{enquiryNo}</div>}
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>

        {/* Step indicators */}
        <div className={styles.steps}>
          {STEP_LABELS.map((label, i) => {
            const n      = i + 1;
            const done   = n < step;
            const active = n === step;
            const hasErr = active && Boolean(stepErrors[n]);
            return (
              <div
                key={n}
                className={[
                  styles.step,
                  active ? styles.stepActive : '',
                  done   ? styles.stepDone   : '',
                  hasErr ? styles.stepError  : '',
                ].filter(Boolean).join(' ')}
              >
                <div className={styles.stepDot}>
                  {done   ? <Check size={11} /> :
                   hasErr ? <AlertCircle size={13} /> :
                   n}
                </div>
                <span className={styles.stepLabel}>{label}</span>
                {i < STEP_LABELS.length - 1 && <div className={styles.stepLine} />}
              </div>
            );
          })}
        </div>

        {/* Scrollable form body */}
        <div className={styles.body}>

          {/* ── Step 1: Contact Details ────────────────────────────────── */}
          {step === 1 && (
            <div className={styles.section}>
              <div className={styles.sectionHead}>Contact Details</div>

              <div className={styles.grp}>
                <label className={styles.lbl} htmlFor="efd-customerName">
                  Full Name <span className={styles.req}>*</span>
                </label>
                <input
                  id="efd-customerName"
                  className={`${styles.input} ${errors.customerName ? styles.inputErr : ''}`}
                  value={form.customerName}
                  onChange={(e) => set('customerName', e.target.value)}
                  onBlur={() => handleBlur('customerName')}
                  placeholder="Enter customer full name"
                  aria-required="true"
                  aria-invalid={!!errors.customerName}
                  aria-describedby={errors.customerName ? 'err-customerName' : undefined}
                  autoFocus
                />
                {errors.customerName && (
                  <span id="err-customerName" className={styles.err} data-form-err role="alert">
                    {errors.customerName}
                  </span>
                )}
              </div>

              <div className={styles.grp}>
                <label className={styles.lbl} htmlFor="efd-phone">
                  Mobile Number <span className={styles.req}>*</span>
                </label>
                <div className={styles.phoneRow}>
                  <span className={styles.phoneCode}>+91</span>
                  <input
                    id="efd-phone"
                    className={`${styles.input} ${styles.phoneInput} ${errors.phone ? styles.inputErr : ''}`}
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onBlur={() => handleBlur('phone')}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    aria-required="true"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? 'err-phone' : undefined}
                  />
                </div>
                {errors.phone && (
                  <span id="err-phone" className={styles.err} data-form-err role="alert">
                    {errors.phone}
                  </span>
                )}
              </div>

              <div className={styles.grp}>
                <label className={styles.lbl} htmlFor="efd-branchId">Preferred Branch</label>
                <div className={styles.inputReadonly} id="efd-branchId" aria-label="Preferred Branch (locked to your branch)">
                  <span className={styles.inputReadonlyText}>
                    {sessionBranch?.name ?? (form.branchId || 'Your branch')}
                  </span>
                  <Lock size={13} className={styles.inputReadonlyIcon} aria-hidden="true" />
                </div>
              </div>

              <div className={styles.grp}>
                <label className={styles.lbl} htmlFor="efd-source">How did they reach us?</label>
                <select
                  id="efd-source"
                  className={styles.input}
                  value={form.source}
                  onChange={(e) => set('source', e.target.value)}
                >
                  <option value="">Select source</option>
                  {SOURCE_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── Step 2: Vehicle Details ────────────────────────────────── */}
          {step === 2 && (
            <div className={styles.section}>
              <div className={styles.sectionHead}>Vehicle Details</div>

              {/* Brand + Model pickers */}
              <div className={styles.twoCol}>
                <div className={styles.grp}>
                  <label className={styles.lbl} htmlFor="efd-vehicleBrand">
                    Car Brand <span className={styles.req}>*</span>
                  </label>
                  <VehiclePickerModal
                    id="efd-vehicleBrand"
                    type="brand"
                    value={form.vehicleBrandId}
                    displayValue={form.vehicleBrand || undefined}
                    options={carBrands}
                    isLoading={brandsLoading}
                    placeholder="Select brand"
                    error={!!errors.vehicleBrandId}
                    ariaInvalid={!!errors.vehicleBrandId}
                    ariaDescribedBy={errors.vehicleBrandId ? 'err-vehicleBrand' : undefined}
                    onSearch={setBrandSearch}
                    onChange={handleBrandChange}
                    className={styles.ssDrawer}
                  />
                  {errors.vehicleBrandId && (
                    <span id="err-vehicleBrand" className={styles.err} data-form-err role="alert">
                      {errors.vehicleBrandId}
                    </span>
                  )}
                </div>

                <div className={styles.grp}>
                  <label className={styles.lbl} htmlFor="efd-vehicleModel">
                    Model
                    {form.vehicleBrandId && carModels.length > 0 && (
                      <span className={styles.req}> *</span>
                    )}
                  </label>
                  <VehiclePickerModal
                    id="efd-vehicleModel"
                    type="model"
                    value={form.vehicleModelId}
                    displayValue={form.vehicleModel || undefined}
                    options={carModels}
                    isLoading={modelsLoading}
                    placeholder={!form.vehicleBrandId ? 'Select brand first' : 'Select model'}
                    disabled={!form.vehicleBrandId}
                    error={!!errors.vehicleModel}
                    ariaInvalid={!!errors.vehicleModel}
                    ariaDescribedBy={errors.vehicleModel ? 'err-vehicleModel' : undefined}
                    onSearch={setModelSearch}
                    onChange={handleModelChange}
                    className={styles.ssDrawer}
                  />
                  {errors.vehicleModel && (
                    <span id="err-vehicleModel" className={styles.err} data-form-err role="alert">
                      {errors.vehicleModel}
                    </span>
                  )}
                </div>
              </div>

              {/* Model metadata chips — shown after model is selected */}
              {form.vehicleModelId && (form.modelBodyType.length > 0 || form.modelCc) && (
                <div className={styles.modelMeta}>
                  {form.modelBodyType.map((bt) => (
                    <span key={bt} className={styles.metaChip}>{bt}</span>
                  ))}
                  {form.modelCc && (
                    <span className={styles.metaChip}>{form.modelCc} cc</span>
                  )}
                  {form.modelCcCondition && (
                    <span className={styles.metaChip}>
                      {form.modelCcCondition.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              )}

              {/* Variant */}
              <div className={styles.grp}>
                <label className={styles.lbl} htmlFor="efd-variantId">
                  Variant <span className={styles.req}>*</span>
                </label>
                {variantsLoading ? (
                  <div className={styles.catalogHint}>
                    <Loader2 size={13} className={styles.spinning} />
                    Loading variants…
                  </div>
                ) : (
                  <select
                    id="efd-variantId"
                    className={`${styles.input} ${errors.variantId ? styles.inputErr : ''}`}
                    value={form.variantId}
                    onChange={handleVariantChange}
                    disabled={!form.vehicleModelId || variantsLoading}
                    aria-required="true"
                    aria-invalid={!!errors.variantId}
                    aria-describedby={errors.variantId ? 'err-variantId' : undefined}
                  >
                    <option value="">
                      {!form.vehicleModelId
                        ? 'Select model first'
                        : variants.length === 0
                          ? 'No variants found'
                          : 'Select variant'}
                    </option>
                    {variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.variantName}{v.period ? ` (${v.period})` : ''}
                      </option>
                    ))}
                  </select>
                )}
                {errors.variantId && (
                  <span id="err-variantId" className={styles.err} data-form-err role="alert">
                    {errors.variantId}
                  </span>
                )}
              </div>

              {/* Year + Vehicle Number */}
              <div className={styles.twoCol}>
                <div className={styles.grp}>
                  <label className={styles.lbl} htmlFor="efd-vehicleYear">
                    Year <span className={styles.req}>*</span>
                  </label>
                  <select
                    id="efd-vehicleYear"
                    className={`${styles.input} ${errors.vehicleYear ? styles.inputErr : ''}`}
                    value={form.vehicleYear}
                    onChange={(e) => set('vehicleYear', e.target.value)}
                    onBlur={() => handleBlur('vehicleYear')}
                    aria-required="true"
                    aria-invalid={!!errors.vehicleYear}
                    aria-describedby={errors.vehicleYear ? 'err-vehicleYear' : undefined}
                  >
                    <option value="">Select year</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  {errors.vehicleYear && (
                    <span id="err-vehicleYear" className={styles.err} data-form-err role="alert">
                      {errors.vehicleYear}
                    </span>
                  )}
                </div>

                <div className={styles.grp}>
                  <label className={styles.lbl} htmlFor="efd-vehicleNumber">
                    Vehicle Number <span className={styles.req}>*</span>
                  </label>
                  <input
                    id="efd-vehicleNumber"
                    className={`${styles.input} ${errors.vehicleNumber ? styles.inputErr : ''}`}
                    value={form.vehicleNumber}
                    onChange={(e) => set('vehicleNumber', e.target.value.toUpperCase())}
                    onBlur={() => handleBlur('vehicleNumber')}
                    placeholder="DL 01 AB 1234"
                    aria-required="true"
                    aria-invalid={!!errors.vehicleNumber}
                    aria-describedby={errors.vehicleNumber ? 'err-vehicleNumber' : undefined}
                  />
                  {errors.vehicleNumber && (
                    <span id="err-vehicleNumber" className={styles.err} data-form-err role="alert">
                      {errors.vehicleNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Vehicle Type */}
              <div className={styles.grp}>
                <label className={styles.lbl} id="lbl-vehicleType">
                  Vehicle Type <span className={styles.req}>*</span>
                </label>
                <div
                  className={`${styles.radioGroup} ${errors.vehicleType ? styles.radioGroupErr : ''}`}
                  role="radiogroup"
                  aria-labelledby="lbl-vehicleType"
                  aria-required="true"
                >
                  {(['Private', 'Commercial'] as const).map((vt) => (
                    <label
                      key={vt}
                      className={`${styles.radioOpt} ${form.vehicleType === vt ? styles.radioOptActive : ''}`}
                    >
                      <input
                        type="radio"
                        name="vehicleType"
                        value={vt}
                        checked={form.vehicleType === vt}
                        onChange={() => set('vehicleType', vt)}
                      />
                      <span>{vt}</span>
                      <span className={styles.radioSub}>
                        {vt === 'Private' ? 'White board' : 'Yellow board'}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.vehicleType && (
                  <span className={styles.err} data-form-err role="alert">
                    {errors.vehicleType}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Glass & Service ────────────────────────────────── */}
          {step === 3 && (
            <div className={styles.section}>
              <div className={styles.sectionHead}>Glass &amp; Service</div>

              {/* Glass Type — API-driven from catalog, cascades from variant */}
              <div className={styles.grp}>
                <label className={styles.lbl} htmlFor="efd-glassTypeId">
                  Glass Type <span className={styles.req}>*</span>
                </label>
                {glassTypesLoading ? (
                  <div className={styles.catalogHint}>
                    <Loader2 size={13} className={styles.spinning} />
                    Loading glass types…
                  </div>
                ) : (
                  <select
                    id="efd-glassTypeId"
                    className={`${styles.input} ${errors.glassTypeId ? styles.inputErr : ''}`}
                    value={form.glassTypeId}
                    onChange={(e) => {
                      const gt = glassTypes.find((g) => g.id === e.target.value);
                      handleGlassTypeChange(e.target.value, gt?.name ?? '');
                    }}
                    disabled={!form.variantId || glassTypesLoading}
                    aria-required="true"
                    aria-invalid={!!errors.glassTypeId}
                    aria-describedby={errors.glassTypeId ? 'err-glassTypeId' : undefined}
                  >
                    <option value="">
                      {!form.variantId
                        ? 'Select a variant first'
                        : glassTypes.length === 0
                          ? 'No glass types found'
                          : 'Select glass type'}
                    </option>
                    {glassTypes.map((gt) => (
                      <option key={gt.id} value={gt.id}>{gt.name}</option>
                    ))}
                  </select>
                )}
                {errors.glassTypeId && (
                  <span id="err-glassTypeId" className={styles.err} data-form-err role="alert">
                    {errors.glassTypeId}
                  </span>
                )}
              </div>

              {/* Description — optional, cascades from glass type */}
              {form.glassTypeId && (
                <div className={styles.grp}>
                  <label className={styles.lbl} htmlFor="efd-description">
                    Description
                    <span className={styles.optLabel}> (optional)</span>
                  </label>
                  <select
                    id="efd-description"
                    className={styles.input}
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    disabled={descriptionsLoading}
                  >
                    <option value="">
                      {descriptionsLoading
                        ? 'Loading…'
                        : descriptions.length === 0
                          ? 'No descriptions available'
                          : 'Select description'}
                    </option>
                    {descriptions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Service Type */}
              <div className={styles.grp}>
                <label className={styles.lbl} id="lbl-serviceType">
                  Service Type <span className={styles.req}>*</span>
                </label>
                <div
                  className={`${styles.radioGroup} ${errors.serviceType ? styles.radioGroupErr : ''}`}
                  role="radiogroup"
                  aria-labelledby="lbl-serviceType"
                  aria-required="true"
                >
                  {(['Replacement', 'Repair'] as const).map((st, i) => (
                    <label
                      key={st}
                      className={`${styles.radioOpt} ${form.serviceType === st ? styles.radioOptActive : ''}`}
                    >
                      <input
                        id={i === 0 ? 'efd-serviceType' : undefined}
                        type="radio"
                        name="serviceType"
                        value={st}
                        checked={form.serviceType === st}
                        onChange={() => set('serviceType', st)}
                      />
                      <span>{st}</span>
                      <span className={styles.radioSub}>
                        {st === 'Replacement' ? 'Full glass swap' : 'Chip / crack fix'}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.serviceType && (
                  <span className={styles.err} data-form-err role="alert">
                    {errors.serviceType}
                  </span>
                )}
              </div>

              {/* Payment Type */}
              <div className={styles.grp}>
                <label className={styles.lbl} id="lbl-paymentType">
                  Payment Type <span className={styles.req}>*</span>
                </label>
                <div
                  className={`${styles.radioGroup} ${errors.paymentType ? styles.radioGroupErr : ''}`}
                  role="radiogroup"
                  aria-labelledby="lbl-paymentType"
                  aria-required="true"
                >
                  {(['Cash', 'Insurance'] as const).map((pt) => (
                    <label
                      key={pt}
                      className={`${styles.radioOpt} ${form.paymentType === pt ? styles.radioOptActive : ''}`}
                    >
                      <input
                        type="radio"
                        name="paymentType"
                        value={pt}
                        checked={form.paymentType === pt}
                        onChange={() => set('paymentType', pt)}
                      />
                      <span>{pt}</span>
                    </label>
                  ))}
                </div>
                {errors.paymentType && (
                  <span className={styles.err} data-form-err role="alert">
                    {errors.paymentType}
                  </span>
                )}
              </div>

              {form.paymentType === 'Insurance' && (
                <div className={styles.insuranceBlock}>
                  <div className={styles.twoCol}>
                    <div className={styles.grp}>
                      <label className={styles.lbl} htmlFor="efd-insurerName">
                        Insurance Company <span className={styles.req}>*</span>
                      </label>
                      <select
                        id="efd-insurerName"
                        className={`${styles.input} ${errors.insurerName ? styles.inputErr : ''}`}
                        value={form.insurerName}
                        onChange={(e) => set('insurerName', e.target.value)}
                        aria-required="true"
                        aria-invalid={!!errors.insurerName}
                        aria-describedby={errors.insurerName ? 'err-insurerName' : undefined}
                      >
                        <option value="">Select insurer</option>
                        {INSURER_OPTIONS.map((ins) => (
                          <option key={ins} value={ins}>{ins}</option>
                        ))}
                      </select>
                      {errors.insurerName && (
                        <span id="err-insurerName" className={styles.err} data-form-err role="alert">
                          {errors.insurerName}
                        </span>
                      )}
                    </div>
                    <div className={styles.grp}>
                      <label className={styles.lbl} htmlFor="efd-accidentDate">Accident Date</label>
                      <input
                        id="efd-accidentDate"
                        className={styles.input}
                        type="date"
                        value={form.accidentDate}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => set('accidentDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.twoCol}>
                <div className={styles.grp}>
                  <label className={styles.lbl} htmlFor="efd-appointmentDate">Preferred Appointment</label>
                  <input
                    id="efd-appointmentDate"
                    className={styles.input}
                    type="date"
                    value={form.appointmentDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => set('appointmentDate', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.grp}>
                <label className={styles.lbl} htmlFor="efd-damageNotes">Damage Description</label>
                <textarea
                  id="efd-damageNotes"
                  className={`${styles.input} ${styles.textarea}`}
                  value={form.damageNotes}
                  onChange={(e) => set('damageNotes', e.target.value)}
                  placeholder="Describe the damage — cracks, chips, shatter, location…"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* ── Step 4: Upload Documents ───────────────────────────────── */}
          {step === 4 && (
            <div className={styles.section}>
              <div className={styles.sectionHead}>Upload Documents</div>
              <p className={styles.docNote}>
                Documents are optional at this stage and can be collected from the customer later.
              </p>

              <div className={styles.uploadBox}>
                <div className={styles.uploadIcon}>📷</div>
                <div className={styles.uploadLabel}>Damage Photo</div>
                <div className={styles.uploadSub}>JPG / PNG · max 5 MB</div>
                <button type="button" className={styles.uploadBtn}>Choose Photo</button>
              </div>

              <div className={styles.uploadBox}>
                <div className={styles.uploadIcon}>📄</div>
                <div className={styles.uploadLabel}>RC Document</div>
                <div className={styles.uploadSub}>Registration Certificate · PDF / JPG</div>
                <button type="button" className={styles.uploadBtn}>Choose File</button>
              </div>

              {form.paymentType === 'Insurance' && (
                <div className={styles.uploadBox}>
                  <div className={styles.uploadIcon}>🛡️</div>
                  <div className={styles.uploadLabel}>Insurance Policy</div>
                  <div className={styles.uploadSub}>Policy document · PDF / JPG</div>
                  <button type="button" className={styles.uploadBtn}>Choose File</button>
                </div>
              )}

              <div className={styles.securityNote}>
                🔒 Documents are stored securely and only accessible to authorized staff.
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {step > 1 && (
            <button type="button" className={styles.btnBack} onClick={() => setStep((s) => s - 1)}>
              <ChevronLeft size={15} />
              Back
            </button>
          )}
          <div className={styles.footerRight}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>
              Cancel
            </button>
            {step < 4 ? (
              <button type="button" className={styles.btnPrimary} onClick={handleNext}>
                Continue
                <ChevronRight size={15} />
              </button>
            ) : (
              <button type="button" className={styles.btnPrimary} onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? 'Saving…' : (
                  <><Check size={15} />{mode === 'update' ? 'Update Enquiry' : 'Create Enquiry'}</>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
