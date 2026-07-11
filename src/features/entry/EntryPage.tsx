import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { MapPin, Phone, Car, ChevronRight, Locate, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGetBranchesQuery } from '@/features/settings/services/branchesApi';
import { BRANDS, BRAND_MODEL_MAP } from '@/types/models/vehicleModel';
import { useCreateEnquiryMutation } from './enquiryApi';
import { getRoleDefaultRoute } from '@/utils/roleRouting';
import { ROUTES } from '@/constants/routes';
import type { BranchListItem } from '@/types/models/branch';
import styles from './EntryPage.module.css';

// ── Types ───────────────────────────────────────────────────

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

// ── Haversine (km) ───────────────────────────────────────────

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

function Hero() {
  return (
    <div className={styles.hero} aria-hidden="true">
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

// ── Main component ───────────────────────────────────────────

export function EntryPage() {
  const { session, isLoading: authLoading } = useAuth();
  const { data: branchRes, isLoading: branchesLoading } = useGetBranchesQuery('ACTIVE');
  const [createEnquiry, { isLoading: submitting }] = useCreateEnquiryMutation();

  const [branchId,      setBranchId]      = useState('');
  const [vehicleBrand,  setVehicleBrand]  = useState('');
  const [vehicleModel,  setVehicleModel]  = useState('');
  const [phone,         setPhone]         = useState('');
  const [errors,        setErrors]        = useState<FormErrors>({});
  const [confirmation,  setConfirmation]  = useState<Confirmation | null>(null);
  const [locating,      setLocating]      = useState(false);

  // While AuthProvider bootstraps, render nothing (avoids flash of the form before redirect).
  if (authLoading) return null;

  // Authenticated users bypass the form and go straight to their dashboard.
  if (session) return <Navigate to={getRoleDefaultRoute(session.role)} replace />;

  const branches: BranchListItem[] = branchRes?.data ?? [];
  const models: string[] = vehicleBrand ? (BRAND_MODEL_MAP[vehicleBrand] ?? []) : [];

  // ── Handlers ──────────────────────────────────────────────

  function clearError(key: keyof FormErrors) {
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleBrandChange(brand: string) {
    setVehicleBrand(brand);
    setVehicleModel('');
    setErrors((e) => ({ ...e, vehicleBrand: undefined, vehicleModel: undefined }));
  }

  function handleLocate() {
    if (!navigator.geolocation || branches.length === 0) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        let nearest = branches[0];
        let minDist = Infinity;
        for (const branch of branches) {
          const d = distanceKm(latitude, longitude, branch.latitude, branch.longitude);
          if (d < minDist) { minDist = d; nearest = branch; }
        }
        setBranchId(nearest.id);
        clearError('branchId');
        setLocating(false);
      },
      () => setLocating(false),
    );
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!branchId)    errs.branchId    = 'Please select a branch';
    if (!vehicleBrand) errs.vehicleBrand = 'Please select your car brand';
    if (!vehicleModel) errs.vehicleModel = 'Please select your car model';
    if (!phone)        errs.phone       = 'Mobile number is required';
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
        <Hero />

        <div className={styles.formPanel}>
          <form className={styles.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Book a Service</h2>
              <p className={styles.formSub}>Fill in 3 quick details to get started</p>
            </div>

            {/* Branch */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="entry-branch">
                <MapPin size={13} />
                Nearest Branch
              </label>
              <div className={styles.branchRow}>
                <select
                  id="entry-branch"
                  className={`${styles.select} ${errors.branchId ? styles.selectError : ''}`}
                  value={branchId}
                  onChange={(e) => { setBranchId(e.target.value); clearError('branchId'); }}
                  disabled={branchesLoading}
                  aria-invalid={!!errors.branchId}
                  aria-describedby={errors.branchId ? 'err-branch' : undefined}
                >
                  <option value="">
                    {branchesLoading ? 'Loading branches…' : 'Select a branch'}
                  </option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}{b.district ? ` — ${b.district}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.locateBtn}
                  onClick={handleLocate}
                  disabled={locating || branchesLoading}
                  title="Auto-detect nearest branch"
                  aria-label="Detect nearest branch using GPS"
                >
                  <Locate size={16} />
                </button>
              </div>
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
                  onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); clearError('phone'); }}
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

            <p className={styles.privacy}>
              By submitting, you agree to be contacted by our service team.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
