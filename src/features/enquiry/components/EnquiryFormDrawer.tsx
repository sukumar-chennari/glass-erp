import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, AlertCircle, Lock } from 'lucide-react';
import { useGetCarBrandsQuery } from '@/features/settings/services/carBrandsApi';
import { useGetCarModelsQuery } from '@/features/settings/services/carModelsApi';
import { useAuth } from '@/context/AuthContext';

import { VehiclePickerModal } from '@/components/ui/VehiclePickerModal';
import styles from './EnquiryFormDrawer.module.css';

export interface EnquiryFormValues {
  customerName:    string;
  phone:           string;
  branchId:        string;
  source:          string;
  vehicleBrandId:  string;
  vehicleBrand:    string;
  vehicleModelId:  string; // internal id tracking; not sent to API
  vehicleModel:    string; // model name — this is what PATCH/submit API expects
  vehicleYear:     string;
  vehicleNumber:   string;
  vehicleType:     'Private' | 'Commercial' | '';
  glassType:       string;
  paymentType:     'Cash' | 'Insurance' | '';
  insurerName:     string;
  accidentDate:    string;
  appointmentDate: string;
  damageNotes:     string;
}

export const EMPTY_FORM: EnquiryFormValues = {
  customerName: '', phone: '', branchId: '', source: '',
  vehicleBrandId: '', vehicleBrand: '', vehicleModelId: '', vehicleModel: '',
  vehicleYear: '', vehicleNumber: '', vehicleType: '',
  glassType: '', paymentType: '', insurerName: '',
  accidentDate: '', appointmentDate: '', damageNotes: '',
};

interface EnquiryFormDrawerProps {
  isOpen:        boolean;
  onClose:       () => void;
  onSave:        (values: EnquiryFormValues) => void;
  initialValues?: Partial<EnquiryFormValues>;
  mode:          'create' | 'complete' | 'update';
  enquiryNo?:    string;
  isSaving?:     boolean;
}

const GLASS_TYPES = [
  { value: 'Front Windshield',      icon: '🔲' },
  { value: 'Rear Windshield',       icon: '🔳' },
  { value: 'Driver Side Window',    icon: '🪟' },
  { value: 'Passenger Side Window', icon: '🪟' },
  { value: 'Rear Left Window',      icon: '◧' },
  { value: 'Rear Right Window',     icon: '◨' },
  { value: 'Quarter Glass',         icon: '▪' },
  { value: 'Sunroof Glass',         icon: '⬡' },
  { value: 'Dicky Glass',           icon: '⬛' },
];

const SOURCE_OPTIONS = [
  { value: 'phone',           label: 'Phone Call'       },
  { value: 'walk_in',         label: 'Walk In'          },
  { value: 'whatsapp',        label: 'WhatsApp'         },
  { value: 'google',          label: 'Google Search'    },
  { value: 'referral',        label: 'Friend / Referral'},
  { value: 'insurance_agent', label: 'Insurance Agent'  },
  { value: 'mechanic',        label: 'Mechanic'         },
  { value: 'other',           label: 'Other'            },
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

// ── Required fields per step ─────────────────────────────────────────────────
// Step 1: customerName, phone
// Step 2: vehicleType; vehicleModel when vehicleBrandId is set AND models are loaded
// Step 3: glassType, paymentType; insurerName when paymentType === 'Insurance'
// Step 4: none (documents are optional)

export function EnquiryFormDrawer({
  isOpen, onClose, onSave, initialValues, mode, enquiryNo, isSaving = false,
}: EnquiryFormDrawerProps) {
  const { session } = useAuth();
  const sessionBranch = session?.branch ?? null;

  const [step,        setStep]        = useState(1);
  const [form,        setForm]        = useState<EnquiryFormValues>({ ...EMPTY_FORM, ...initialValues });
  const [errors,      setErrors]      = useState<FormErrors>({});
  // tracks whether the most-recent Next attempt on each step failed — drives indicator error badge
  const [stepErrors,  setStepErrors]  = useState<Record<number, boolean>>({});
  const [brandSearch, setBrandSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm({
        ...EMPTY_FORM,
        branchId: sessionBranch?.id ?? '',
        ...initialValues,
      });
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

  // Hooks must be called before any conditional return.
  const { data: carBrands = [], isFetching: brandsLoading } = useGetCarBrandsQuery({
    status: 'ACTIVE',
    search: brandSearch || undefined,
  });
  const { data: carModels = [], isFetching: modelsLoading } = useGetCarModelsQuery(
    form.vehicleBrandId ? { brandId: form.vehicleBrandId, status: 'ACTIVE', search: modelSearch || undefined } : undefined,
    { skip: !form.vehicleBrandId },
  );

  if (!isOpen) return null;

  // ── Field helpers ──────────────────────────────────────────────────────────

  function set<K extends keyof EnquiryFormValues>(key: K, value: EnquiryFormValues[K]) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  // Brand change resets model — clears all four model/brand fields atomically.
  function handleBrandChange(brandId: string, brandName: string) {
    setModelSearch('');
    setForm((p) => ({
      ...p,
      vehicleBrandId:  brandId,
      vehicleBrand:    brandName,
      vehicleModelId:  '',
      vehicleModel:    '',
    }));
    setErrors((e) => ({ ...e, vehicleBrand: undefined, vehicleModel: undefined }));
  }

  // Blur validation — only fires for the specific field that was blurred,
  // prevents noisy full-step validation on every focus-out.
  function handleBlur(key: keyof EnquiryFormValues) {
    const errs = runValidation(step);
    if (errs[key]) setErrors((prev) => ({ ...prev, [key]: errs[key] }));
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  // Pure validation — returns errors dict, does NOT call setErrors.
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
      if (!form.vehicleYear)
        errs.vehicleYear  = 'Select the vehicle year';
      if (!form.vehicleNumber.trim())
        errs.vehicleNumber = 'Enter the vehicle registration number';
      if (!form.vehicleType)
        errs.vehicleType  = 'Select vehicle type (Private or Commercial)';
    }

    if (s === 3) {
      if (!form.glassType)
        errs.glassType   = 'Select the damaged glass type';
      if (!form.paymentType)
        errs.paymentType = 'Select a payment type';
      if (form.paymentType === 'Insurance' && !form.insurerName)
        errs.insurerName = 'Select the insurance company';
    }

    // Step 4 — no required fields
    return errs;
  }

  // ── Focus first invalid field on blocked Next ──────────────────────────────

  function focusFirstError(errs: FormErrors) {
    // Text / select fields that can receive natural focus
    const focusable: Array<[keyof EnquiryFormValues, string]> = [
      ['customerName', 'efd-customerName'],
      ['phone',        'efd-phone'],
      ['vehicleBrandId','efd-vehicleBrand'],
      ['vehicleModel', 'efd-vehicleModel'],
      ['vehicleYear',  'efd-vehicleYear'],
      ['vehicleNumber','efd-vehicleNumber'],
      ['glassType',    'efd-glassType-0'],   // first glass button
      ['insurerName',  'efd-insurerName'],
    ];
    for (const [key, id] of focusable) {
      if (errs[key]) {
        setTimeout(() => (document.getElementById(id) as HTMLElement | null)?.focus(), 0);
        return;
      }
    }
    // Radio-group errors (vehicleType, paymentType) — scroll first error into view
    setTimeout(() => {
      (document.querySelector('[data-form-err]') as HTMLElement | null)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 0);
  }

  // ── Step navigation ────────────────────────────────────────────────────────

  function handleNext() {
    const errs = runValidation(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setStepErrors((prev) => ({ ...prev, [step]: true }));
      focusFirstError(errs);
      return;
    }
    // Step passed — clear its error badge and advance
    setErrors({});
    setStepErrors((prev) => ({ ...prev, [step]: false }));
    setStep((s) => s + 1);
  }

  function handleSubmit() {
    const errs = runValidation(step); // step 4 always returns {}
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setStepErrors((prev) => ({ ...prev, [step]: true }));
      return;
    }
    onSave(form);
  }

  // ── Layout helpers ─────────────────────────────────────────────────────────

  const progress = ((step - 1) / 3) * 100;
  const title    = mode === 'update' ? 'Update Enquiry' : mode === 'complete' ? 'Complete Enquiry' : 'New Enquiry';

  // ── Render ─────────────────────────────────────────────────────────────────

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

          {/* ── Step 1: Contact Details ─────────────────────────────────── */}
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

          {/* ── Step 2: Vehicle Details ─────────────────────────────────── */}
          {step === 2 && (
            <div className={styles.section}>
              <div className={styles.sectionHead}>Vehicle Details</div>

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
                    onChange={(id, name) => {
                      setForm((p) => ({ ...p, vehicleModelId: id, vehicleModel: name }));
                      setErrors((e) => ({ ...e, vehicleModel: undefined }));
                    }}
                    className={styles.ssDrawer}
                  />
                  {errors.vehicleModel && (
                    <span id="err-vehicleModel" className={styles.err} data-form-err role="alert">
                      {errors.vehicleModel}
                    </span>
                  )}
                </div>
              </div>

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

          {/* ── Step 3: Glass & Service ─────────────────────────────────── */}
          {step === 3 && (
            <div className={styles.section}>
              <div className={styles.sectionHead}>Glass &amp; Service</div>

              <div className={styles.grp}>
                <label className={styles.lbl} id="lbl-glassType">
                  Which glass is damaged? <span className={styles.req}>*</span>
                </label>
                <div
                  className={`${styles.glassGrid} ${errors.glassType ? styles.glassGridErr : ''}`}
                  role="group"
                  aria-labelledby="lbl-glassType"
                >
                  {GLASS_TYPES.map((g, gi) => (
                    <button
                      key={g.value}
                      id={gi === 0 ? 'efd-glassType-0' : undefined}
                      type="button"
                      className={`${styles.glassOpt} ${form.glassType === g.value ? styles.glassOptActive : ''}`}
                      onClick={() => set('glassType', g.value)}
                      aria-pressed={form.glassType === g.value}
                    >
                      <span className={styles.glassIcon}>{g.icon}</span>
                      <span>{g.value}</span>
                    </button>
                  ))}
                </div>
                {errors.glassType && (
                  <span className={styles.err} data-form-err role="alert">
                    {errors.glassType}
                  </span>
                )}
              </div>

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

          {/* ── Step 4: Upload Documents ────────────────────────────────── */}
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
