import { useState, useRef } from 'react';
import { CheckCircle2, Car, Wrench, MapPin, CreditCard, ClipboardList, Camera, X, ArrowLeft } from 'lucide-react';
import { BranchSelector } from './components/BranchSelector';
import styles from './CustomerSubmitPage.module.css';

// ── Types ──────────────────────────────────────────────────────────────────────

interface FormState {
  name:              string;
  phone:             string;
  whatsapp:          string;
  vehicleMake:       string;
  vehicleModel:      string;
  vehicleYear:       string;
  registrationNo:    string;
  rcFile:            File | null;
  glassPosition:     string;
  damageType:        string;
  description:       string;
  photos:            File[];
  branchId:          string;
  branchName:        string;
  paymentPreference: 'cash' | 'insurance' | 'card' | 'undecided' | '';
  insuranceInsurer:  string;
  insurancePolicyNo: string;
}

const EMPTY: FormState = {
  name: '', phone: '', whatsapp: '',
  vehicleMake: '', vehicleModel: '', vehicleYear: '', registrationNo: '', rcFile: null,
  glassPosition: '', damageType: '', description: '', photos: [],
  branchId: '', branchName: '',
  paymentPreference: '',
  insuranceInsurer: '', insurancePolicyNo: '',
};

const GLASS_POSITIONS = [
  'Front Windshield', 'Rear Windshield', 'Driver Side Window',
  'Passenger Side Window', 'Rear Left Window', 'Rear Right Window',
  'Sunroof Glass', 'Quarter Glass',
];

const DAMAGE_TYPES = [
  'Crack', 'Chip / Stone Impact', 'Complete Shatter', 'Scratch', 'Stress Fracture',
];

const VEHICLE_MAKES = [
  'Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Honda', 'Toyota',
  'Kia', 'MG', 'Renault', 'Nissan', 'Volkswagen', 'Skoda', 'Other',
];

const INSURERS = [
  'HDFC ERGO', 'ICICI Lombard', 'Bajaj Allianz', 'New India Assurance',
  'Oriental Insurance', 'United India Insurance', 'Tata AIG', 'Royal Sundaram',
];

const YEARS = Array.from({ length: 2025 - 2005 + 1 }, (_, i) => String(2025 - i));

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEPS = [
  { id: 1, icon: ClipboardList, label: 'Contact'  },
  { id: 2, icon: Car,           label: 'Vehicle'  },
  { id: 3, icon: Wrench,        label: 'Damage'   },
  { id: 4, icon: MapPin,        label: 'Branch'   },
  { id: 5, icon: CreditCard,    label: 'Payment'  },
  { id: 6, icon: CheckCircle2,  label: 'Review'   },
] as const;

// ── Main component ─────────────────────────────────────────────────────────────

export function CustomerSubmitPage() {
  const [step,      setStep]      = useState<Step>(1);
  const [form,      setForm]      = useState<FormState>(EMPTY);
  const [errors,    setErrors]    = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [refNo,     setRefNo]     = useState('');

  function update<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (step === 1) {
      if (!form.name.trim())               errs.name  = 'Name is required';
      if (!/^\d{10}$/.test(form.phone))    errs.phone = 'Enter a valid 10-digit phone number';
    }
    if (step === 2) {
      if (!form.vehicleMake)               errs.vehicleMake    = 'Select vehicle make';
      if (!form.vehicleModel.trim())       errs.vehicleModel   = 'Model is required';
      if (!form.vehicleYear)               errs.vehicleYear    = 'Select year';
      if (!form.registrationNo.trim())     errs.registrationNo = 'Registration number is required';
    }
    if (step === 3) {
      if (!form.glassPosition)             errs.glassPosition = 'Select glass position';
      if (!form.damageType)                errs.damageType    = 'Select damage type';
    }
    if (step === 4) {
      if (!form.branchId)                  errs.branchId = 'Select a service branch';
    }
    if (step === 5) {
      if (!form.paymentPreference)         errs.paymentPreference = 'Select a payment option';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (!validate()) return;
    if (step === 6) {
      handleSubmit();
      return;
    }
    setStep((s) => (s + 1) as Step);
  }

  function back() {
    setStep((s) => Math.max(1, s - 1) as Step);
  }

  function handleSubmit() {
    const ref = `SUB-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    setRefNo(ref);
    setSubmitted(true);
    // TODO (backend): POST /submissions with form data
  }

  if (submitted) {
    return <ConfirmationScreen refNo={refNo} branchName={form.branchName} onNew={() => { setForm(EMPTY); setStep(1); setSubmitted(false); }} />;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logo}>WindX Glass</div>
        <div className={styles.headerSub}>Book a glass repair or replacement</div>
      </div>

      {/* Step indicator */}
      <div className={styles.stepBar}>
        {STEPS.map((s) => {
          const done   = s.id < step;
          const active = s.id === step;
          return (
            <div key={s.id} className={`${styles.stepItem} ${done ? styles.stepDone : ''} ${active ? styles.stepActive : ''}`}>
              <div className={styles.stepDot}>
                {done ? <CheckCircle2 size={14} /> : <span>{s.id}</span>}
              </div>
              <span className={styles.stepLabel}>{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className={styles.content}>
        {step === 1 && <StepContact   form={form} errors={errors} update={update} />}
        {step === 2 && <StepVehicle   form={form} errors={errors} update={update} />}
        {step === 3 && <StepDamage    form={form} errors={errors} update={update} />}
        {step === 4 && <StepBranch    form={form} errors={errors} update={update} />}
        {step === 5 && <StepPayment   form={form} errors={errors} update={update} />}
        {step === 6 && <StepReview    form={form} />}
      </div>

      {/* Navigation */}
      <div className={styles.nav}>
        {step > 1 && (
          <button type="button" className={styles.btnBack} onClick={back}>
            <ArrowLeft size={16} />
            Back
          </button>
        )}
        <button type="button" className={styles.btnNext} onClick={next}>
          {step === 6 ? 'Submit Request' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

// ── Step 1: Contact ────────────────────────────────────────────────────────────

type UpdateFn = <K extends keyof FormState>(key: K, val: FormState[K]) => void;
interface StepProps {
  form:   FormState;
  errors: Partial<Record<keyof FormState, string>>;
  update: UpdateFn;
}

function StepContact({ form, errors, update }: StepProps) {
  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>Your contact details</h2>
      <p className={styles.stepDesc}>We'll call or WhatsApp you to confirm your appointment.</p>

      <div className={styles.field}>
        <label className={styles.label}>Full Name <span className={styles.req}>*</span></label>
        <input
          className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
          type="text"
          placeholder="e.g. Ravi Kumar"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          autoComplete="name"
        />
        {errors.name && <span className={styles.errMsg}>{errors.name}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Mobile Number <span className={styles.req}>*</span></label>
        <input
          className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
          type="tel"
          placeholder="10-digit mobile number"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
          autoComplete="tel"
          inputMode="numeric"
        />
        {errors.phone && <span className={styles.errMsg}>{errors.phone}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>WhatsApp Number</label>
        <div className={styles.sameCheckRow}>
          <input
            type="checkbox"
            id="sameWa"
            checked={form.whatsapp === form.phone}
            onChange={(e) => update('whatsapp', e.target.checked ? form.phone : '')}
          />
          <label htmlFor="sameWa" className={styles.checkLabel}>Same as mobile number</label>
        </div>
        {form.whatsapp !== form.phone && (
          <input
            className={styles.input}
            type="tel"
            placeholder="WhatsApp number"
            value={form.whatsapp}
            onChange={(e) => update('whatsapp', e.target.value.replace(/\D/g, '').slice(0, 10))}
            inputMode="numeric"
          />
        )}
      </div>
    </div>
  );
}

// ── Step 2: Vehicle ────────────────────────────────────────────────────────────

function StepVehicle({ form, errors, update }: StepProps) {
  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>Vehicle details</h2>
      <p className={styles.stepDesc}>Tell us about your vehicle so we can check stock availability.</p>

      <div className={styles.row2}>
        <div className={styles.field}>
          <label className={styles.label}>Make <span className={styles.req}>*</span></label>
          <select
            className={`${styles.input} ${errors.vehicleMake ? styles.inputError : ''}`}
            value={form.vehicleMake}
            onChange={(e) => update('vehicleMake', e.target.value)}
          >
            <option value="">Select make</option>
            {VEHICLE_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          {errors.vehicleMake && <span className={styles.errMsg}>{errors.vehicleMake}</span>}
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Year <span className={styles.req}>*</span></label>
          <select
            className={`${styles.input} ${errors.vehicleYear ? styles.inputError : ''}`}
            value={form.vehicleYear}
            onChange={(e) => update('vehicleYear', e.target.value)}
          >
            <option value="">Year</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          {errors.vehicleYear && <span className={styles.errMsg}>{errors.vehicleYear}</span>}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Model <span className={styles.req}>*</span></label>
        <input
          className={`${styles.input} ${errors.vehicleModel ? styles.inputError : ''}`}
          type="text"
          placeholder="e.g. Swift, Creta, Nexon"
          value={form.vehicleModel}
          onChange={(e) => update('vehicleModel', e.target.value)}
        />
        {errors.vehicleModel && <span className={styles.errMsg}>{errors.vehicleModel}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Registration Number <span className={styles.req}>*</span></label>
        <input
          className={`${styles.input} ${errors.registrationNo ? styles.inputError : ''}`}
          type="text"
          placeholder="e.g. TS 09 AB 1234"
          value={form.registrationNo}
          onChange={(e) => update('registrationNo', e.target.value.toUpperCase())}
          autoCapitalize="characters"
        />
        {errors.registrationNo && <span className={styles.errMsg}>{errors.registrationNo}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>RC Document <span className={styles.optLabel}>(optional — can upload later)</span></label>
        <RcUpload value={form.rcFile} onChange={(f) => update('rcFile', f)} />
      </div>
    </div>
  );
}

function RcUpload({ value, onChange }: { value: File | null; onChange: (f: File | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className={styles.uploadBox}>
      {value ? (
        <div className={styles.uploadedFile}>
          <span>{value.name}</span>
          <button type="button" onClick={() => onChange(null)} className={styles.removeFile}>
            <X size={14} />
          </button>
        </div>
      ) : (
        <button type="button" className={styles.uploadBtn} onClick={() => ref.current?.click()}>
          Upload RC
        </button>
      )}
      <input ref={ref} type="file" accept="image/*,.pdf" hidden onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </div>
  );
}

// ── Step 3: Glass & Damage ─────────────────────────────────────────────────────

function StepDamage({ form, errors, update }: StepProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const next = [...form.photos, ...Array.from(files)].slice(0, 8);
    update('photos', next);
  }

  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>Glass damage details</h2>
      <p className={styles.stepDesc}>Photos help us prepare a faster, more accurate quote.</p>

      <div className={styles.field}>
        <label className={styles.label}>Glass Position <span className={styles.req}>*</span></label>
        <div className={styles.chipGroup}>
          {GLASS_POSITIONS.map((pos) => (
            <button
              key={pos}
              type="button"
              className={`${styles.chip} ${form.glassPosition === pos ? styles.chipActive : ''}`}
              onClick={() => update('glassPosition', pos)}
            >
              {pos}
            </button>
          ))}
        </div>
        {errors.glassPosition && <span className={styles.errMsg}>{errors.glassPosition}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Damage Type <span className={styles.req}>*</span></label>
        <div className={styles.chipGroup}>
          {DAMAGE_TYPES.map((dt) => (
            <button
              key={dt}
              type="button"
              className={`${styles.chip} ${form.damageType === dt ? styles.chipActive : ''}`}
              onClick={() => update('damageType', dt)}
            >
              {dt}
            </button>
          ))}
        </div>
        {errors.damageType && <span className={styles.errMsg}>{errors.damageType}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Describe the damage</label>
        <textarea
          className={styles.textarea}
          placeholder="e.g. Long crack from corner, spreading about 30 cm"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          rows={3}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Damage Photos</label>
        <div className={styles.photoGrid}>
          {form.photos.map((f, i) => (
            <div key={i} className={styles.photoThumb}>
              <img src={URL.createObjectURL(f)} alt={`Damage ${i + 1}`} />
              <button
                type="button"
                className={styles.removePhoto}
                onClick={() => update('photos', form.photos.filter((_, j) => j !== i))}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {form.photos.length < 8 && (
            <button
              type="button"
              className={styles.addPhotoBtn}
              onClick={() => photoInputRef.current?.click()}
            >
              <Camera size={20} />
              <span>Add</span>
            </button>
          )}
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          hidden
          onChange={(e) => addPhotos(e.target.files)}
        />
        <span className={styles.photoHint}>
          {form.photos.length === 0
            ? 'Take or upload damage photos (up to 8)'
            : `${form.photos.length} photo${form.photos.length !== 1 ? 's' : ''} added`}
        </span>
      </div>
    </div>
  );
}

// ── Step 4: Branch ─────────────────────────────────────────────────────────────

function StepBranch({ form, errors, update }: StepProps) {
  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>Choose a service branch</h2>
      <p className={styles.stepDesc}>Select the WindX location most convenient for you.</p>

      <BranchSelector
        value={form.branchId || null}
        onChange={(id, name) => { update('branchId', id); update('branchName', name); }}
      />
      {errors.branchId && <span className={styles.errMsg}>{errors.branchId}</span>}
    </div>
  );
}

// ── Step 5: Payment ────────────────────────────────────────────────────────────

const PAYMENT_OPTIONS = [
  { id: 'cash',      label: 'Cash',       sub: 'Pay at the branch or to the technician' },
  { id: 'insurance', label: 'Insurance',  sub: 'Claim through your vehicle insurance'  },
  { id: 'card',      label: 'Card / UPI',  sub: 'Pay by card or UPI at the branch'     },
  { id: 'undecided', label: 'Decide Later', sub: 'Our team will help you choose'       },
] as const;

function StepPayment({ form, errors, update }: StepProps) {
  const isInsurance = form.paymentPreference === 'insurance';
  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>Payment preference</h2>
      <p className={styles.stepDesc}>This helps us prepare the right paperwork in advance.</p>

      <div className={styles.field}>
        <div className={styles.paymentOptions}>
          {PAYMENT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`${styles.paymentCard} ${form.paymentPreference === opt.id ? styles.paymentCardActive : ''}`}
              onClick={() => update('paymentPreference', opt.id)}
            >
              <span className={styles.paymentLabel}>{opt.label}</span>
              <span className={styles.paymentSub}>{opt.sub}</span>
            </button>
          ))}
        </div>
        {errors.paymentPreference && <span className={styles.errMsg}>{errors.paymentPreference}</span>}
      </div>

      {isInsurance && (
        <>
          <div className={styles.field}>
            <label className={styles.label}>Insurance Company</label>
            <select
              className={styles.input}
              value={form.insuranceInsurer}
              onChange={(e) => update('insuranceInsurer', e.target.value)}
            >
              <option value="">Select insurer</option>
              {INSURERS.map((ins) => <option key={ins} value={ins}>{ins}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Policy Number</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. HDFC-2024-XYZ-001"
              value={form.insurancePolicyNo}
              onChange={(e) => update('insurancePolicyNo', e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ── Step 6: Review ─────────────────────────────────────────────────────────────

function StepReview({ form }: { form: FormState }) {
  return (
    <div className={styles.step}>
      <h2 className={styles.stepTitle}>Review your request</h2>
      <p className={styles.stepDesc}>Please verify the details before submitting.</p>

      <ReviewSection title="Contact">
        <ReviewRow label="Name"    value={form.name} />
        <ReviewRow label="Phone"   value={form.phone} />
        {form.whatsapp && <ReviewRow label="WhatsApp" value={form.whatsapp} />}
      </ReviewSection>

      <ReviewSection title="Vehicle">
        <ReviewRow label="Make & Model" value={`${form.vehicleMake} ${form.vehicleModel} (${form.vehicleYear})`} />
        <ReviewRow label="Registration" value={form.registrationNo} />
        <ReviewRow label="RC Document"  value={form.rcFile ? form.rcFile.name : 'Not uploaded'} />
      </ReviewSection>

      <ReviewSection title="Damage">
        <ReviewRow label="Glass Position" value={form.glassPosition} />
        <ReviewRow label="Damage Type"    value={form.damageType} />
        {form.description && <ReviewRow label="Description" value={form.description} />}
        <ReviewRow label="Photos" value={form.photos.length > 0 ? `${form.photos.length} photo(s)` : 'None'} />
      </ReviewSection>

      <ReviewSection title="Branch">
        <ReviewRow label="Branch" value={form.branchName} />
      </ReviewSection>

      <ReviewSection title="Payment">
        <ReviewRow label="Preference" value={form.paymentPreference || '—'} />
        {form.insuranceInsurer  && <ReviewRow label="Insurer"       value={form.insuranceInsurer}  />}
        {form.insurancePolicyNo && <ReviewRow label="Policy Number" value={form.insurancePolicyNo} />}
      </ReviewSection>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.reviewSection}>
      <div className={styles.reviewSectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.reviewRow}>
      <span className={styles.reviewLabel}>{label}</span>
      <span className={styles.reviewValue}>{value || '—'}</span>
    </div>
  );
}

// ── Confirmation screen ────────────────────────────────────────────────────────

function ConfirmationScreen({
  refNo, branchName, onNew,
}: { refNo: string; branchName: string; onNew: () => void }) {
  return (
    <div className={styles.page}>
      <div className={styles.confirmScreen}>
        <div className={styles.confirmIcon}>
          <CheckCircle2 size={52} />
        </div>
        <h2 className={styles.confirmTitle}>Request Submitted!</h2>
        <p className={styles.confirmDesc}>
          Our team will contact you within 2 business hours to confirm your appointment.
        </p>
        <div className={styles.refBox}>
          <span className={styles.refLabel}>Reference Number</span>
          <span className={styles.refNo}>{refNo}</span>
        </div>
        {branchName && (
          <div className={styles.confirmBranch}>
            <MapPin size={14} />
            {branchName}
          </div>
        )}
        <button type="button" className={styles.btnNext} onClick={onNew}>
          Submit another request
        </button>
      </div>
    </div>
  );
}
