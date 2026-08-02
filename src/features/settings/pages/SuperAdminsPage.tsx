import { useState, useRef } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Eye, EyeOff, ShieldCheck,
  CheckCircle2, AlertCircle, Check,
} from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useCreateSuperAdminMutation } from '@/services/auth/authApi';
import type { CreateSuperAdminResponse } from '@/services/auth/authApi';
import { ROUTES } from '@/constants/routes';
import styles from './SuperAdminsPage.module.css';

// ── Password requirements ──────────────────────────────────────────────────────

const PW_RULES = [
  { id: 'len',     label: 'At least 8 characters',            test: (p: string) => p.length >= 8 },
  { id: 'upper',   label: 'Uppercase letter (A–Z)',            test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'Lowercase letter (a–z)',            test: (p: string) => /[a-z]/.test(p) },
  { id: 'digit',   label: 'Number (0–9)',                      test: (p: string) => /\d/.test(p) },
  { id: 'special', label: 'Special character (@$!%*?&)',       test: (p: string) => /[@$!%*?&_#^()\-]/.test(p) },
] as const;

function validatePassword(pw: string): string | null {
  if (!pw) return 'Password is required';
  if (pw.length < 8) return 'Must be at least 8 characters';
  if (!/[A-Z]/.test(pw)) return 'Must include an uppercase letter';
  if (!/[a-z]/.test(pw)) return 'Must include a lowercase letter';
  if (!/\d/.test(pw))    return 'Must include a number';
  if (!/[@$!%*?&_#^()\-]/.test(pw)) return 'Must include a special character';
  return null;
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address';
  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  name:         string;
  email:        string;
  password:     string;
  showPassword: boolean;
}

interface FormErrors {
  name?:     string;
  email?:    string;
  password?: string;
}

const EMPTY: FormState = { name: '', email: '', password: '', showPassword: false };

// ── Component ─────────────────────────────────────────────────────────────────

export function SuperAdminsPage() {
  // ── All hooks before any conditional return ──────────────────────────────────
  const { session }  = useAuth();
  const navigate     = useNavigate();
  const [createSuperAdmin, { isLoading: submitting }] = useCreateSuperAdminMutation();

  const [form,      setForm]      = useState<FormState>(EMPTY);
  const [errors,    setErrors]    = useState<FormErrors>({});
  const [created,   setCreated]   = useState<CreateSuperAdminResponse | null>(null);
  const [serverErr, setServerErr] = useState('');

  const submitGuard = useRef(false);

  // ── Access guard ──────────────────────────────────────────────────────────────
  if (session && session.role !== 'super_admin') {
    return <Navigate to={ROUTES.SETTINGS} replace />;
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  const pwRulesMet = PW_RULES.map(r => r.test(form.password));
  const pwTouched  = form.password.length > 0;

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key !== 'showPassword' && errors[key as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  }

  function validateForm(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim())                errs.name = 'Name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    const emailErr = validateEmail(form.email);
    if (emailErr) errs.email = emailErr;
    const pwErr = validatePassword(form.password);
    if (pwErr) errs.password = pwErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (submitGuard.current || submitting) return;
    if (!validateForm()) return;
    submitGuard.current = true;
    setServerErr('');

    try {
      const result = await createSuperAdmin({
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      }).unwrap();
      setCreated(result);
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { message?: string } };
      if (e?.status === 409) {
        setErrors(prev => ({
          ...prev,
          email: 'An account with this email already exists',
        }));
      } else if (e?.status === 403 || e?.status === 401) {
        setServerErr('Your session does not have permission to perform this action.');
      } else {
        setServerErr(e?.data?.message ?? 'Something went wrong. Please check your connection and try again.');
      }
    } finally {
      submitGuard.current = false;
    }
  }

  function handleReset() {
    setForm(EMPTY);
    setErrors({});
    setCreated(null);
    setServerErr('');
  }

  // ── Success state ─────────────────────────────────────────────────────────────

  if (created) {
    return (
      <PageShell
        heading="Create Super Admin"
        description="Manage Super Admin accounts on the platform."
      >
        <Link to={ROUTES.SETTINGS} className={styles.back}>
          <ArrowLeft size={13} /> Back to Settings
        </Link>

        <SectionCard>
          <div className={styles.successWrap}>
            <div className={styles.successIconWrap}>
              <CheckCircle2 size={40} />
            </div>
            <h3 className={styles.successTitle}>Account Created</h3>
            <p className={styles.successDesc}>
              The Super Admin account has been set up and is ready to use.
            </p>

            {(created.name || created.email) && (
              <div className={styles.accountCard}>
                {created.name && (
                  <div className={styles.accountRow}>
                    <span className={styles.accountKey}>Name</span>
                    <span className={styles.accountVal}>{created.name}</span>
                  </div>
                )}
                {created.email && (
                  <div className={styles.accountRow}>
                    <span className={styles.accountKey}>Email</span>
                    <span className={styles.accountVal}>{created.email}</span>
                  </div>
                )}
                <div className={styles.accountRow}>
                  <span className={styles.accountKey}>Role</span>
                  <span className={`${styles.accountVal} ${styles.roleChip}`}>Super Admin</span>
                </div>
              </div>
            )}

            <p className={styles.securityNote}>
              Share credentials securely — never send passwords over chat or email.
            </p>

            <div className={styles.successActions}>
              <Button variant="ghost" onClick={handleReset}>Create Another Account</Button>
              <Button onClick={() => navigate(ROUTES.SETTINGS)}>Back to Settings</Button>
            </div>
          </div>
        </SectionCard>
      </PageShell>
    );
  }

  // ── Form state ────────────────────────────────────────────────────────────────

  return (
    <PageShell
      heading="Create Super Admin"
      description="Set up new Super Admin accounts with full platform access."
    >
      <Link to={ROUTES.SETTINGS} className={styles.back}>
        <ArrowLeft size={13} /> Back to Settings
      </Link>

      <SectionCard>
        <form
          className={styles.form}
          onSubmit={(e) => void handleSubmit(e)}
          noValidate
        >
          {/* ── Access banner ── */}
          <div className={styles.banner}>
            <ShieldCheck size={16} className={styles.bannerIcon} />
            <span>
              Super Admin accounts have <strong>full platform access</strong>. Only create
              accounts for trusted administrators.
            </span>
          </div>

          <div className={styles.fields}>

            {/* ── Name ── */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="sa-name">
                Full Name <span className={styles.req}>*</span>
              </label>
              <input
                id="sa-name"
                type="text"
                autoComplete="name"
                className={`${styles.input} ${errors.name ? styles.inputErr : ''}`}
                placeholder="e.g. Rajesh Kumar"
                value={form.name}
                maxLength={100}
                onChange={e => setField('name', e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'sa-name-err' : undefined}
              />
              {errors.name && (
                <span id="sa-name-err" role="alert" className={styles.fieldErr}>
                  {errors.name}
                </span>
              )}
            </div>

            {/* ── Email ── */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="sa-email">
                Email Address <span className={styles.req}>*</span>
              </label>
              <input
                id="sa-email"
                type="email"
                autoComplete="email"
                className={`${styles.input} ${errors.email ? styles.inputErr : ''}`}
                placeholder="e.g. rajesh@glasspro.com"
                value={form.email}
                maxLength={150}
                onChange={e => setField('email', e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'sa-email-err' : undefined}
              />
              {errors.email && (
                <span id="sa-email-err" role="alert" className={styles.fieldErr}>
                  {errors.email}
                </span>
              )}
            </div>

            {/* ── Password ── */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="sa-password">
                Password <span className={styles.req}>*</span>
              </label>
              <div className={`${styles.passwordRow} ${errors.password ? styles.passwordRowErr : ''}`}>
                <input
                  id="sa-password"
                  type={form.showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={styles.passwordInput}
                  placeholder="Min 8 chars, uppercase, number, symbol"
                  value={form.password}
                  maxLength={72}
                  onChange={e => setField('password', e.target.value)}
                  aria-invalid={!!errors.password}
                  aria-describedby="sa-pw-rules"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setField('showPassword', !form.showPassword)}
                  aria-label={form.showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {form.showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <span role="alert" className={styles.fieldErr}>{errors.password}</span>
              )}

              {/* Password requirements checklist */}
              <div
                id="sa-pw-rules"
                className={`${styles.pwChecklist} ${pwTouched ? styles.pwChecklistVisible : ''}`}
                aria-label="Password requirements"
              >
                {PW_RULES.map((rule, i) => (
                  <div
                    key={rule.id}
                    className={`${styles.pwCheckItem} ${pwRulesMet[i] ? styles.pwCheckMet : ''}`}
                  >
                    <span className={styles.pwCheckDot} aria-hidden>
                      {pwRulesMet[i] ? <Check size={10} /> : <span className={styles.pwDotCircle} />}
                    </span>
                    <span className={styles.pwCheckLabel}>{rule.label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── Server error ── */}
          {serverErr && (
            <div className={styles.serverErr} role="alert">
              <AlertCircle size={14} className={styles.serverErrIcon} />
              <span>{serverErr}</span>
            </div>
          )}

          {/* ── Actions ── */}
          <div className={styles.actions}>
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={submitting}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              loading={submitting}
            >
              {submitting ? 'Creating…' : 'Create Account'}
            </Button>
          </div>
        </form>
      </SectionCard>
    </PageShell>
  );
}
