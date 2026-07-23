import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useGetCarBrandsQuery } from '@/features/settings/services/carBrandsApi';
import { useGetCarModelsQuery } from '@/features/settings/services/carModelsApi';
import type { CarBrand } from '@/types/models/carBrand';
import styles from './EnquiryFormDrawer.module.css';

export interface EnquiryFormValues {
  customerName:   string;
  phone:          string;
  branchId:       string;
  source:         string;
  vehicleBrandId: string;
  vehicleBrand:   string;
  vehicleModel:   string;
  vehicleYear:    string;
  vehicleNumber:  string;
  vehicleType:    'Private' | 'Commercial' | '';
  glassType:      string;
  paymentType:    'Cash' | 'Insurance' | '';
  insurerName:    string;
  accidentDate:   string;
  appointmentDate:string;
  damageNotes:    string;
}

export const EMPTY_FORM: EnquiryFormValues = {
  customerName: '', phone: '', branchId: '', source: '',
  vehicleBrandId: '', vehicleBrand: '', vehicleModel: '',
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
  'Tata AIG', 'SBI General', 'Reliance General', 'Other',
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1999 }, (_, i) => String(CURRENT_YEAR - i));

const STEP_LABELS = ['Contact', 'Vehicle', 'Service', 'Docs'];

type FormErrors = Partial<Record<keyof EnquiryFormValues, string>>;

export function EnquiryFormDrawer({
  isOpen, onClose, onSave, initialValues, mode, enquiryNo, isSaving = false,
}: EnquiryFormDrawerProps) {
  const [step,   setStep]   = useState(1);
  const [form,   setForm]   = useState<EnquiryFormValues>({ ...EMPTY_FORM, ...initialValues });
  const [errors, setErrors] = useState<FormErrors>({});


  useEffect(() => {
    if (isOpen) {
      setForm({ ...EMPTY_FORM, ...initialValues });
      setStep(1);
      setErrors({});
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
  const { data: carBrands = [], isLoading: brandsLoading } = useGetCarBrandsQuery({ status: 'ACTIVE' });
  const { data: carModels = [], isLoading: modelsLoading } = useGetCarModelsQuery(
    form.vehicleBrandId ? { brandId: form.vehicleBrandId, status: 'ACTIVE' } : undefined,
    { skip: !form.vehicleBrandId },
  );

  if (!isOpen) return null;

  function set<K extends keyof EnquiryFormValues>(key: K, value: EnquiryFormValues[K]) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  // Brand change resets model — must update three fields atomically.
  // RC autofill entry point: pass a matched brand and set vehicleModel separately
  // to prefill from extracted RC data while keeping fields user-editable.
  function handleBrandChange(brandId: string) {
    const brand: CarBrand | undefined = carBrands.find((b) => b.id === brandId);
    setForm((p) => ({
      ...p,
      vehicleBrandId: brandId,
      vehicleBrand:   brand?.name ?? '',
      vehicleModel:   '',
    }));
    setErrors((e) => ({ ...e, vehicleBrand: undefined, vehicleModel: undefined }));
  }

  function validateStep(s: number): boolean {
    const errs: FormErrors = {};
    if (s === 1) {
      if (!form.customerName.trim()) errs.customerName = 'Name is required';
      if (form.phone.length !== 10)  errs.phone        = 'Enter a valid 10-digit number';
    }
    if (s === 3) {
      if (!form.glassType) errs.glassType = 'Select the damaged glass';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (!validateStep(step)) return;
    setStep((s) => s + 1);
  }

  function handleSubmit() {
    if (!validateStep(step)) return;
    onSave(form);
  }

  const progress = ((step - 1) / 3) * 100;
  const title = mode === 'update' ? 'Update Enquiry' : mode === 'complete' ? 'Complete Enquiry' : 'New Enquiry';

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
            const n = i + 1;
            const done   = n < step;
            const active = n === step;
            return (
              <div
                key={n}
                className={[
                  styles.step,
                  active ? styles.stepActive : '',
                  done   ? styles.stepDone   : '',
                ].join(' ')}
              >
                <div className={styles.stepDot}>
                  {done ? <Check size={11} /> : n}
                </div>
                <span className={styles.stepLabel}>{label}</span>
                {i < STEP_LABELS.length - 1 && <div className={styles.stepLine} />}
              </div>
            );
          })}
        </div>

        {/* Scrollable form body */}
        <div className={styles.body}>

          {step === 1 && (
            <div className={styles.section}>
              <div className={styles.sectionHead}>Contact Details</div>

              <div className={styles.grp}>
                <label className={styles.lbl}>
                  Full Name <span className={styles.req}>*</span>
                </label>
                <input
                  className={`${styles.input} ${errors.customerName ? styles.inputErr : ''}`}
                  value={form.customerName}
                  onChange={(e) => set('customerName', e.target.value)}
                  placeholder="Enter customer full name"
                  autoFocus
                />
                {errors.customerName && <span className={styles.err}>{errors.customerName}</span>}
              </div>

              <div className={styles.grp}>
                <label className={styles.lbl}>
                  Mobile Number <span className={styles.req}>*</span>
                </label>
                <div className={styles.phoneRow}>
                  <span className={styles.phoneCode}>+91</span>
                  <input
                    className={`${styles.input} ${styles.phoneInput} ${errors.phone ? styles.inputErr : ''}`}
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />
                </div>
                {errors.phone && <span className={styles.err}>{errors.phone}</span>}
              </div>

              <div className={styles.grp}>
                <label className={styles.lbl}>Preferred Branch</label>
                <input
                  className={styles.input}
                  value={form.branchId}
                  onChange={(e) => set('branchId', e.target.value)}
                  placeholder="Branch name"
                />
              </div>

              <div className={styles.grp}>
                <label className={styles.lbl}>How did they reach us?</label>
                <select
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

          {step === 2 && (
            <div className={styles.section}>
              <div className={styles.sectionHead}>Vehicle Details</div>

              <div className={styles.twoCol}>
                <div className={styles.grp}>
                  <label className={styles.lbl}>Car Brand</label>
                  <select
                    className={styles.input}
                    value={form.vehicleBrandId}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    disabled={brandsLoading}
                  >
                    <option value="">
                      {brandsLoading ? 'Loading brands…' : 'Select brand'}
                    </option>
                    {carBrands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.grp}>
                  <label className={styles.lbl}>Model</label>
                  <select
                    className={styles.input}
                    value={form.vehicleModel}
                    onChange={(e) => set('vehicleModel', e.target.value)}
                    disabled={!form.vehicleBrandId || modelsLoading}
                  >
                    <option value="">
                      {!form.vehicleBrandId
                        ? 'Select brand first'
                        : modelsLoading
                          ? 'Loading models…'
                          : carModels.length === 0
                            ? 'No models available'
                            : 'Select model'}
                    </option>
                    {carModels.map((m) => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.twoCol}>
                <div className={styles.grp}>
                  <label className={styles.lbl}>Year</label>
                  <select
                    className={styles.input}
                    value={form.vehicleYear}
                    onChange={(e) => set('vehicleYear', e.target.value)}
                  >
                    <option value="">Select year</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.grp}>
                  <label className={styles.lbl}>Vehicle Number</label>
                  <input
                    className={styles.input}
                    value={form.vehicleNumber}
                    onChange={(e) => set('vehicleNumber', e.target.value.toUpperCase())}
                    placeholder="DL 01 AB 1234"
                  />
                </div>
              </div>

              <div className={styles.grp}>
                <label className={styles.lbl}>Vehicle Type</label>
                <div className={styles.radioGroup}>
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
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={styles.section}>
              <div className={styles.sectionHead}>Glass &amp; Service</div>

              <div className={styles.grp}>
                <label className={styles.lbl}>
                  Which glass is damaged? <span className={styles.req}>*</span>
                </label>
                <div className={styles.glassGrid}>
                  {GLASS_TYPES.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      className={`${styles.glassOpt} ${form.glassType === g.value ? styles.glassOptActive : ''}`}
                      onClick={() => set('glassType', g.value)}
                    >
                      <span className={styles.glassIcon}>{g.icon}</span>
                      <span>{g.value}</span>
                    </button>
                  ))}
                </div>
                {errors.glassType && <span className={styles.err}>{errors.glassType}</span>}
              </div>

              <div className={styles.grp}>
                <label className={styles.lbl}>Payment Type</label>
                <div className={styles.radioGroup}>
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
              </div>

              {form.paymentType === 'Insurance' && (
                <div className={styles.insuranceBlock}>
                  <div className={styles.twoCol}>
                    <div className={styles.grp}>
                      <label className={styles.lbl}>Insurance Company</label>
                      <select
                        className={styles.input}
                        value={form.insurerName}
                        onChange={(e) => set('insurerName', e.target.value)}
                      >
                        <option value="">Select insurer</option>
                        {INSURER_OPTIONS.map((ins) => (
                          <option key={ins} value={ins}>{ins}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.grp}>
                      <label className={styles.lbl}>Accident Date</label>
                      <input
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
                  <label className={styles.lbl}>Preferred Appointment</label>
                  <input
                    className={styles.input}
                    type="date"
                    value={form.appointmentDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => set('appointmentDate', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.grp}>
                <label className={styles.lbl}>Damage Description</label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  value={form.damageNotes}
                  onChange={(e) => set('damageNotes', e.target.value)}
                  placeholder="Describe the damage — cracks, chips, shatter, location…"
                  rows={3}
                />
              </div>
            </div>
          )}

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
