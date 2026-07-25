import { useState, useEffect, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { MapPin, Phone, ChevronRight, Locate, CheckCircle, Search, Car } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLazyGetNearbyBranchesQuery } from './nearbyBranchesApi';
import type { NearbyBranch } from './nearbyBranchesApi';
import { useCreateQuickEnquiryMutation } from './enquiryApi';
import { useGetCarBrandsQuery } from '@/features/settings/services/carBrandsApi';
import { useGetCarModelsQuery } from '@/features/settings/services/carModelsApi';
import { getRoleDefaultRoute } from '@/utils/roleRouting';
import { ROUTES } from '@/constants/routes';
import { InsurancePartners } from './components/InsurancePartners';
import { EntryThemeSelector } from './components/EntryThemeSelector';
import windexLogo from '../../../assets/images/windex-logo.png';
import styles from './EntryPage.module.css';

// ── Types ────────────────────────────────────────────────────

interface Confirmation {
  enquiryId:   string;
  branchName:  string;
  phone:       string;
  customerName: string;
}

interface FormErrors {
  customerName?: string;
  phone?:        string;
  branchId?:     string;
}

// ── WhatsApp icon (inline SVG — lucide has no WhatsApp brand icon) ──

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
      className={className} aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── Top bar ──────────────────────────────────────────────────

function TopBar() {
  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>
        <img src={windexLogo} alt="WindX" className={styles.brandLogo} />
      </div>
      <div className={styles.headerContacts}>
        <a href="tel:18001204567" className={styles.headerTollFree}>
          <Phone size={12} />
          1800-120-4567
        </a>
        <span className={styles.headerContactSep} aria-hidden="true">|</span>
        <a
          href="https://wa.me/919848000000"
          className={styles.headerWhatsApp}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsAppIcon />
          +91 98480 00000
        </a>
      </div>
      <div className={styles.topBarActions}>
        <EntryThemeSelector />
        <Link to={ROUTES.LOGIN} className={styles.loginBtn}>
          Staff Login
        </Link>
      </div>
    </header>
  );
}

// ── Hero panel ───────────────────────────────────────────────

function Hero() {
  return (
    <div className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.heroLogoMark}>
          <img src={windexLogo} alt="WindX" className={styles.heroLogoImg} />
        </div>
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
              <strong>{confirmation.enquiryId || '—'}</strong>
            </div>
            <div className={styles.confirmRow}>
              <span>Name</span>
              <strong>{confirmation.customerName}</strong>
            </div>
            <div className={styles.confirmRow}>
              <span>Mobile</span>
              <strong>+91 {confirmation.phone}</strong>
            </div>
            <div className={styles.confirmRow}>
              <span>Branch</span>
              <strong>{confirmation.branchName}</strong>
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

// ── Main component ───────────────────────────────────────────

export function EntryPage() {
  const { session, isLoading: authLoading } = useAuth();

  const [fetchNearby, { data: nearbyBranches, isFetching: loadingBranches }] =
    useLazyGetNearbyBranchesQuery();

  const [createQuickEnquiry, { isLoading: submitting }] = useCreateQuickEnquiryMutation();

  const { data: carBrands = [] } = useGetCarBrandsQuery({ status: 'ACTIVE' });

  // Quick enquiry form state — only customerName/phone/branchId sent to POST /api/v1/enquiries/quick
  const [customerName,   setCustomerName]   = useState('');
  const [phone,          setPhone]          = useState('');
  const [branchId,       setBranchId]       = useState('');
  const [vehicleBrandId, setVehicleBrandId] = useState('');
  const [vehicleModelId, setVehicleModelId] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [errors,         setErrors]         = useState<FormErrors>({});
  const [confirmation,   setConfirmation]   = useState<Confirmation | null>(null);
  const [locating,       setLocating]       = useState(false);
  const [gpsError,       setGpsError]       = useState<string | null>(null);

  const { data: carModels = [] } = useGetCarModelsQuery(
    vehicleBrandId ? { brandId: vehicleBrandId, status: 'ACTIVE' } : undefined,
    { skip: !vehicleBrandId },
  );

  // Auto-detect nearest branch on mount.
  // Ref guard prevents React StrictMode double-invoke within one mount cycle;
  // the ref resets on every unmount/remount so GPS fires on every page visit.
  const autoLocatedRef = useRef(false);
  useEffect(() => {
    if (authLoading || session || !navigator.geolocation) return;
    if (autoLocatedRef.current) return;
    autoLocatedRef.current = true;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        if (!isFinite(latitude) || !isFinite(longitude)) {
          setLocating(false);
          return;
        }
        void (async () => {
          try {
            const results = await fetchNearby({ lat: latitude, lng: longitude }).unwrap();
            if (results.length > 0) setBranchId(results[0].id);
          } catch {
            // Silent on auto-locate failure — user can use the manual GPS button or search
          } finally {
            setLocating(false);
          }
        })();
      },
      (err: GeolocationPositionError) => {
        setLocating(false);
        if (err.code === 1) {
          setGpsError('Location access was denied. Allow location in your browser settings, or search manually.');
        } else if (err.code === 2) {
          setGpsError('Your location could not be determined. Try searching by city or district.');
        } else {
          setGpsError('Location request timed out. Please try again or search manually.');
        }
      },
      { timeout: 10_000 },
    );
  }, [authLoading, session, fetchNearby]);

  if (authLoading) return null;
  if (session) return <Navigate to={getRoleDefaultRoute(session.role)} replace />;

  const branches = nearbyBranches ?? [];

  // ── Booking form helpers ────────────────────────────────────

  function clearError(key: keyof FormErrors) {
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleLocate() {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        if (!isFinite(latitude) || !isFinite(longitude)) {
          setLocating(false);
          setGpsError('Received invalid location data. Please try again.');
          return;
        }
        void (async () => {
          try {
            const results = await fetchNearby({ lat: latitude, lng: longitude }).unwrap();
            if (results.length > 0) {
              setBranchId(results[0].id);
              setErrors((e) => ({ ...e, branchId: undefined }));
            } else {
              setGpsError('No branches found near your location. Try searching by city or district.');
            }
          } catch {
            setGpsError('Could not fetch nearby branches. Please search by city or district.');
          } finally {
            setLocating(false);
          }
        })();
      },
      (err: GeolocationPositionError) => {
        setLocating(false);
        if (err.code === 1) {
          setGpsError('Location access was denied. Allow location in your browser settings, or search manually.');
        } else if (err.code === 2) {
          setGpsError('Your location could not be determined. Try searching by city or district.');
        } else {
          setGpsError('Location request timed out. Please try again or search manually.');
        }
      },
      { timeout: 10_000 },
    );
  }

  function handleDistrictSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const term = districtSearch.trim();
    if (!term) return;
    setBranchId('');
    setGpsError(null);
    void fetchNearby({ district: term });
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!customerName.trim())           errs.customerName = 'Please enter your name';
    if (!phone)                         errs.phone        = 'Mobile number is required';
    else if (!/^\d{10}$/.test(phone))   errs.phone        = 'Enter a valid 10-digit mobile number';
    if (!branchId)                      errs.branchId     = 'Please select a branch';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;                          // double-submit guard
    if (!validate()) return;

    setErrors({});                                   // clear any previous API errors

    const result = await createQuickEnquiry({
      customerName: customerName.trim(),
      phone,
      branchId,
    });

    if ('error' in result) {
      const err = result.error as { status?: number; data?: { message?: string } };
      if (err?.status === 400) {
        // 400 means branch is no longer available
        setErrors({ branchId: 'Selected branch is not available. Please choose another.' });
      } else {
        // Network / server error
        setErrors({ branchId: 'Submission failed — please check your connection and try again.' });
      }
      return;
    }

    const enquiryId = result.data?.enquiryId ?? '';   // defensive: show confirmation even if missing
    const branchName = branches.find((b) => b.id === branchId)?.name ?? branchId;
    setConfirmation({ enquiryId, branchName, phone, customerName: customerName.trim() });
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
              <p className={styles.formSub}>Fill in a few quick details to get started</p>
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

            {/* Name */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="entry-name">Your Name</label>
              <input
                id="entry-name"
                type="text"
                className={`${styles.input} ${errors.customerName ? styles.inputError : ''}`}
                placeholder="Full name"
                value={customerName}
                onChange={(e) => { setCustomerName(e.target.value); clearError('customerName'); }}
                aria-invalid={!!errors.customerName}
                aria-describedby={errors.customerName ? 'err-name' : undefined}
              />
              {errors.customerName && (
                <span id="err-name" role="alert" className={styles.error}>{errors.customerName}</span>
              )}
            </div>

            {/* Car Brand (optional) */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="entry-brand">
                <Car size={13} />
                Car Brand <span style={{ fontWeight: 400, opacity: 0.6, fontSize: '0.75em' }}>(optional)</span>
              </label>
              <select
                id="entry-brand"
                className={styles.select}
                value={vehicleBrandId}
                onChange={(e) => { setVehicleBrandId(e.target.value); setVehicleModelId(''); }}
              >
                <option value="">Select brand</option>
                {carBrands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Car Model (optional, cascades from brand) */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="entry-model">
                Car Model <span style={{ fontWeight: 400, opacity: 0.6, fontSize: '0.75em' }}>(optional)</span>
              </label>
              <select
                id="entry-model"
                className={styles.select}
                value={vehicleModelId}
                onChange={(e) => setVehicleModelId(e.target.value)}
                disabled={!vehicleBrandId || carModels.length === 0}
              >
                <option value="">
                  {!vehicleBrandId ? 'Select brand first' : carModels.length === 0 ? 'No models available' : 'Select model'}
                </option>
                {carModels.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
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
                onChange={(e) => { setBranchId(e.target.value); clearError('branchId'); setGpsError(null); }}
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
              {(errors.branchId ?? gpsError) && (
                <span id="err-branch" role="alert" className={styles.error}>
                  {errors.branchId ?? gpsError}
                </span>
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

      <InsurancePartners />
    </div>
  );
}
