import { useState, useEffect, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { MapPin, Phone, Car, ChevronRight, Locate, CheckCircle, Search, PhoneCall, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLazyGetNearbyBranchesQuery } from './nearbyBranchesApi';
import type { NearbyBranch } from './nearbyBranchesApi';
import { BRANDS, BRAND_MODEL_MAP } from '@/types/models/vehicleModel';
import { useCreateEnquiryMutation } from './enquiryApi';
import { getRoleDefaultRoute } from '@/utils/roleRouting';
import { ROUTES } from '@/constants/routes';
import { InsurancePartners } from './components/InsurancePartners';
import styles from './EntryPage.module.css';

// ── Types ────────────────────────────────────────────────────

interface Confirmation {
  jobNumber:    string;
  branchName:   string;
  vehicleBrand: string;
  vehicleModel: string;
  phone:        string;
}

interface FormErrors {
  branchId?:     string;
  vehicleBrand?: string;
  vehicleModel?: string;
  phone?:        string;
}

// ── Top bar ──────────────────────────────────────────────────

function TopBar() {
  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>WX</span>
        <span className={styles.brandName}>WindX</span>
      </div>
      <Link to={ROUTES.LOGIN} className={styles.loginBtn}>
        Staff Login
      </Link>
    </header>
  );
}

// ── Hero panel ───────────────────────────────────────────────

interface HeroProps {
  onEnquiryOpen: () => void;
}

function Hero({ onEnquiryOpen }: HeroProps) {
  return (
    <div className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.heroLogoMark}>WX</div>
        <h1 className={styles.heroTitle}>
          Premium Glass<br />Replacement
        </h1>
        <p className={styles.heroSub}>
          Fast, affordable windshield and auto glass services across India.
          OEM-grade glass. Certified technicians.
        </p>
        <ul className={styles.heroFeatures}>
          {[
            'Doorstep service available',
            'Insurance claim assistance',
            'Real-time job tracking',
            '90-day workmanship warranty',
          ].map((feat) => (
            <li key={feat} className={styles.heroFeature}>
              <CheckCircle size={14} className={styles.heroCheck} />
              {feat}
            </li>
          ))}
        </ul>
        <button type="button" className={styles.heroCta} onClick={onEnquiryOpen}>
          <PhoneCall size={15} />
          Request a Callback
        </button>
      </div>
    </div>
  );
}

// ── Confirmation screen ───────────────────────────────────────

interface ConfirmationViewProps {
  confirmation: Confirmation;
  onReset: () => void;
}

function ConfirmationView({ confirmation, onReset }: ConfirmationViewProps) {
  const trackUrl = `${ROUTES.TRACK}?phone=${encodeURIComponent(confirmation.phone)}`;
  return (
    <>
      <TopBar />
      <div className={styles.confirmWrap}>
        <div className={styles.confirmCard}>
          <div className={styles.confirmIconWrap}>
            <CheckCircle size={28} />
          </div>
          <h2 className={styles.confirmTitle}>Request Submitted!</h2>
          <p className={styles.confirmSub}>
            Your service request has been received. Our team will contact you shortly.
          </p>
          <div className={styles.confirmDetails}>
            <div className={styles.confirmRow}>
              <span>Reference</span>
              <strong>{confirmation.jobNumber}</strong>
            </div>
            <div className={styles.confirmRow}>
              <span>Branch</span>
              <strong>{confirmation.branchName}</strong>
            </div>
            <div className={styles.confirmRow}>
              <span>Vehicle</span>
              <strong>{confirmation.vehicleBrand} {confirmation.vehicleModel}</strong>
            </div>
            <div className={styles.confirmRow}>
              <span>Mobile</span>
              <strong>+91 {confirmation.phone}</strong>
            </div>
          </div>
          <div className={styles.confirmActions}>
            <Link to={trackUrl} className={styles.confirmTrackBtn}>
              Track My Service <ChevronRight size={14} />
            </Link>
            <button className={styles.confirmAgainBtn} onClick={onReset}>
              Submit another request
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Branch option label ───────────────────────────────────────

function branchLabel(b: NearbyBranch): string {
  let label = b.name;
  if (b.district) label += ` — ${b.district}`;
  if (b.distanceKm != null && b.distanceKm > 0) {
    label += ` (${b.distanceKm.toFixed(1)} km)`;
  }
  return label;
}

// ── Enquiry types ─────────────────────────────────────────────

const ENQUIRY_TYPES = [
  'Windshield Replacement',
  'Rear Glass Replacement',
  'Side Glass Replacement',
  'Glass Repair',
  'Insurance Claim Assistance',
  'General Enquiry',
];

// ── Main component ───────────────────────────────────────────

export function EntryPage() {
  const { session, isLoading: authLoading } = useAuth();

  const [fetchNearby, { data: nearbyBranches, isFetching: loadingBranches }] =
    useLazyGetNearbyBranchesQuery();

  const [createEnquiry, { isLoading: submitting }] = useCreateEnquiryMutation();

  // Main booking form state
  const [branchId,       setBranchId]       = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [vehicleBrand,   setVehicleBrand]   = useState('');
  const [vehicleModel,   setVehicleModel]   = useState('');
  const [phone,          setPhone]          = useState('');
  const [errors,         setErrors]         = useState<FormErrors>({});
  const [confirmation,   setConfirmation]   = useState<Confirmation | null>(null);
  const [locating,       setLocating]       = useState(false);

  // Floating callback panel state (UI-only — no backend API wired yet)
  const [panelOpen,   setPanelOpen]   = useState(false);
  const [cbName,      setCbName]      = useState('');
  const [cbPhone,     setCbPhone]     = useState('');
  const [cbCity,      setCbCity]      = useState('');
  const [cbType,      setCbType]      = useState('');
  const [cbErrors,    setCbErrors]    = useState<Partial<Record<string, string>>>({});
  const [cbSubmitted, setCbSubmitted] = useState(false);

  // Auto-detect nearest branch on mount.
  const autoLocatedRef = useRef(false);
  useEffect(() => {
    if (authLoading || session) return;
    if (autoLocatedRef.current || !navigator.geolocation) return;
    autoLocatedRef.current = true;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        void (async () => {
          try {
            const results = await fetchNearby({ lat: latitude, lng: longitude }).unwrap();
            if (results.length > 0) setBranchId(results[0].id);
          } finally {
            setLocating(false);
          }
        })();
      },
      () => setLocating(false),
    );
  }, [authLoading, session, fetchNearby]);

  // Auto-open the callback panel when an unauthenticated visitor lands on the page.
  // Ref guard prevents re-opening after the user manually closes it.
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (authLoading || session) return;
    if (autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    setPanelOpen(true);
  }, [authLoading, session]);

  if (authLoading) return null;
  if (session) return <Navigate to={getRoleDefaultRoute(session.role)} replace />;

  const branches: NearbyBranch[] = nearbyBranches ?? [];
  const models: string[] = vehicleBrand ? (BRAND_MODEL_MAP[vehicleBrand] ?? []) : [];

  // ── Booking form helpers ────────────────────────────────────

  function clearError(key: keyof FormErrors) {
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleBrandChange(brand: string) {
    setVehicleBrand(brand);
    setVehicleModel('');
    setErrors((e) => ({ ...e, vehicleBrand: undefined, vehicleModel: undefined }));
  }

  function handleLocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        void (async () => {
          try {
            const results = await fetchNearby({ lat: latitude, lng: longitude }).unwrap();
            if (results.length > 0) {
              setBranchId(results[0].id);
              setErrors((e) => ({ ...e, branchId: undefined }));
            }
          } finally {
            setLocating(false);
          }
        })();
      },
      () => setLocating(false),
    );
  }

  function handleDistrictSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const term = districtSearch.trim();
    if (!term) return;
    setBranchId('');
    void fetchNearby({ district: term });
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!branchId)     errs.branchId     = 'Please select a branch';
    if (!vehicleBrand) errs.vehicleBrand = 'Please select your car brand';
    if (!vehicleModel) errs.vehicleModel = 'Please select your car model';
    if (!phone)        errs.phone        = 'Mobile number is required';
    else if (!/^\d{10}$/.test(phone)) errs.phone = 'Enter a valid 10-digit mobile number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const result = await createEnquiry({ branchId, vehicleBrand, vehicleModel, customerPhone: phone });
    if ('data' in result && result.data) {
      const branchName = branches.find((b) => b.id === branchId)?.name ?? branchId;
      setConfirmation({ jobNumber: result.data.jobNumber, branchName, vehicleBrand, vehicleModel, phone });
    }
  }

  // ── Callback panel helpers ───────────────────────────────────

  function openPanel() {
    setCbName(''); setCbPhone(''); setCbCity(''); setCbType('');
    setCbErrors({}); setCbSubmitted(false);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
  }

  function handleCallbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<Record<string, string>> = {};
    if (!cbName.trim())            errs.name  = 'Please enter your name';
    if (!/^\d{10}$/.test(cbPhone)) errs.phone = 'Enter a valid 10-digit number';
    if (!cbCity.trim())            errs.city  = 'Please enter your city';
    if (!cbType)                   errs.type  = 'Please select an enquiry type';
    setCbErrors(errs);
    if (Object.keys(errs).length === 0) setCbSubmitted(true);
  }

  // ── Confirmation state ────────────────────────────────────

  if (confirmation) {
    return (
      <div className={styles.page}>
        <ConfirmationView confirmation={confirmation} onReset={() => setConfirmation(null)} />
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <TopBar />
      <div className={styles.content}>
        <Hero onEnquiryOpen={openPanel} />

        <div className={styles.formPanel}>
          <form className={styles.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Book a Service</h2>
              <p className={styles.formSub}>Fill in 3 quick details to get started</p>
            </div>

            {/* Branch */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="entry-district">
                <MapPin size={13} />
                Nearest Branch
              </label>
              <div className={styles.districtRow}>
                <input
                  id="entry-district"
                  type="search"
                  className={styles.districtInput}
                  placeholder="Type your city or district…"
                  value={districtSearch}
                  onChange={(e) => setDistrictSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDistrictSearch(e); }}
                  aria-label="Search branches by city or district"
                />
                <button
                  type="button"
                  className={styles.locateBtn}
                  onClick={() => handleDistrictSearch()}
                  disabled={!districtSearch.trim() || loadingBranches}
                  title="Search branches in this district"
                  aria-label="Search branches"
                >
                  <Search size={15} />
                </button>
                <button
                  type="button"
                  className={styles.locateBtn}
                  onClick={handleLocate}
                  disabled={locating || loadingBranches}
                  title="Auto-detect nearest branch using GPS"
                  aria-label="Detect nearest branch using GPS"
                >
                  <Locate size={15} />
                </button>
              </div>
              <select
                id="entry-branch"
                className={`${styles.select} ${errors.branchId ? styles.selectError : ''}`}
                value={branchId}
                onChange={(e) => { setBranchId(e.target.value); clearError('branchId'); }}
                disabled={loadingBranches || locating || branches.length === 0}
                aria-invalid={!!errors.branchId}
                aria-describedby={errors.branchId ? 'err-branch' : undefined}
              >
                <option value="">
                  {loadingBranches || locating
                    ? 'Finding branches…'
                    : branches.length === 0
                      ? 'Search above or use GPS ↑'
                      : 'Select a branch'}
                </option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{branchLabel(b)}</option>
                ))}
              </select>
              {errors.branchId && (
                <span id="err-branch" role="alert" className={styles.error}>{errors.branchId}</span>
              )}
            </div>

            {/* Car Brand */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="entry-brand">
                <Car size={13} />
                Car Brand
              </label>
              <select
                id="entry-brand"
                className={`${styles.select} ${errors.vehicleBrand ? styles.selectError : ''}`}
                value={vehicleBrand}
                onChange={(e) => handleBrandChange(e.target.value)}
                aria-invalid={!!errors.vehicleBrand}
                aria-describedby={errors.vehicleBrand ? 'err-brand' : undefined}
              >
                <option value="">Select car brand</option>
                {BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {errors.vehicleBrand && (
                <span id="err-brand" role="alert" className={styles.error}>{errors.vehicleBrand}</span>
              )}
            </div>

            {/* Car Model */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="entry-model">
                Car Model
              </label>
              <select
                id="entry-model"
                className={`${styles.select} ${errors.vehicleModel ? styles.selectError : ''}`}
                value={vehicleModel}
                onChange={(e) => { setVehicleModel(e.target.value); clearError('vehicleModel'); }}
                disabled={!vehicleBrand}
                aria-invalid={!!errors.vehicleModel}
                aria-describedby={errors.vehicleModel ? 'err-model' : undefined}
              >
                <option value="">{vehicleBrand ? 'Select car model' : 'Select brand first'}</option>
                {models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {errors.vehicleModel && (
                <span id="err-model" role="alert" className={styles.error}>{errors.vehicleModel}</span>
              )}
            </div>

            {/* Mobile */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="entry-phone">
                <Phone size={13} />
                Mobile Number
              </label>
              <div className={styles.phoneRow}>
                <span className={styles.dialCode}>+91</span>
                <input
                  id="entry-phone"
                  type="tel"
                  inputMode="numeric"
                  className={`${styles.phoneInput} ${errors.phone ? styles.phoneInputError : ''}`}
                  placeholder="10-digit mobile number"
                  value={phone}
                  maxLength={10}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    clearError('phone');
                  }}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'err-phone' : undefined}
                />
              </div>
              {errors.phone && (
                <span id="err-phone" role="alert" className={styles.error}>{errors.phone}</span>
              )}
            </div>

            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Submitting…' : (
                <>Request Service <ChevronRight size={16} /></>
              )}
            </button>

            {/* Mobile-only enquiry trigger — hero CTA is not visible at ≤768px */}
            <button type="button" className={styles.mobileEnquiryTrigger} onClick={openPanel}>
              <PhoneCall size={14} />
              Just need a callback?
            </button>

            <p className={styles.privacy}>
              By submitting, you agree to be contacted by our service team.
            </p>
          </form>
        </div>
      </div>

      <InsurancePartners />

      {/* ── Floating callback panel — fixed top-right, auto-opens on page entry ── */}
      {panelOpen && (
        <div
          className={styles.cbPanel}
          role="dialog"
          aria-modal="false"
          aria-label="Request a Callback"
        >
          <div className={styles.cbPanelHeader}>
            <span className={styles.cbPanelTitle}>
              <PhoneCall size={13} className={styles.cbPanelIcon} />
              Request a Callback
            </span>
            <button
              type="button"
              className={styles.cbPanelClose}
              onClick={closePanel}
              aria-label="Close callback panel"
            >
              <X size={14} />
            </button>
          </div>

          <div className={styles.cbPanelBody}>
            {cbSubmitted ? (
              <div className={styles.cbSuccess}>
                <CheckCircle size={32} className={styles.cbSuccessIcon} />
                <p className={styles.cbSuccessTitle}>We&apos;ll call you back!</p>
                <p className={styles.cbSuccessMsg}>
                  Thanks, {cbName}. Our team will reach you on +91&nbsp;{cbPhone} shortly.
                </p>
                <button type="button" className={styles.cbDoneBtn} onClick={closePanel}>
                  Close
                </button>
              </div>
            ) : (
              <form className={styles.cbForm} onSubmit={handleCallbackSubmit} noValidate>
                {/* Name */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="cb-name">Your Name</label>
                  <input
                    id="cb-name"
                    type="text"
                    className={`${styles.cbInput} ${cbErrors.name ? styles.cbInputError : ''}`}
                    placeholder="Full name"
                    value={cbName}
                    onChange={(e) => { setCbName(e.target.value); setCbErrors((p) => ({ ...p, name: undefined })); }}
                    aria-invalid={!!cbErrors.name}
                  />
                  {cbErrors.name && <span role="alert" className={styles.error}>{cbErrors.name}</span>}
                </div>

                {/* Phone */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="cb-phone">
                    <Phone size={13} />
                    Mobile Number
                  </label>
                  <div className={styles.phoneRow}>
                    <span className={styles.dialCode}>+91</span>
                    <input
                      id="cb-phone"
                      type="tel"
                      inputMode="numeric"
                      className={`${styles.phoneInput} ${cbErrors.phone ? styles.phoneInputError : ''}`}
                      placeholder="10-digit number"
                      value={cbPhone}
                      maxLength={10}
                      onChange={(e) => {
                        setCbPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                        setCbErrors((p) => ({ ...p, phone: undefined }));
                      }}
                      aria-invalid={!!cbErrors.phone}
                    />
                  </div>
                  {cbErrors.phone && <span role="alert" className={styles.error}>{cbErrors.phone}</span>}
                </div>

                {/* City */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="cb-city">
                    <MapPin size={13} />
                    City / District
                  </label>
                  <input
                    id="cb-city"
                    type="text"
                    className={`${styles.cbInput} ${cbErrors.city ? styles.cbInputError : ''}`}
                    placeholder="e.g. Hyderabad"
                    value={cbCity}
                    onChange={(e) => { setCbCity(e.target.value); setCbErrors((p) => ({ ...p, city: undefined })); }}
                    aria-invalid={!!cbErrors.city}
                  />
                  {cbErrors.city && <span role="alert" className={styles.error}>{cbErrors.city}</span>}
                </div>

                {/* Enquiry type */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="cb-type">Enquiry Type</label>
                  <select
                    id="cb-type"
                    className={`${styles.select} ${cbErrors.type ? styles.selectError : ''}`}
                    value={cbType}
                    onChange={(e) => { setCbType(e.target.value); setCbErrors((p) => ({ ...p, type: undefined })); }}
                    aria-invalid={!!cbErrors.type}
                  >
                    <option value="">Select type</option>
                    {ENQUIRY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {cbErrors.type && <span role="alert" className={styles.error}>{cbErrors.type}</span>}
                </div>

                <div className={styles.cbFooter}>
                  <button type="button" className={styles.cbCancelBtn} onClick={closePanel}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.cbSubmitBtn}>
                    Request Callback
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
