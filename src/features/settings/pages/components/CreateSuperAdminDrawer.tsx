import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useCreateSuperAdminMutation } from '@/services/auth/authApi';
import type { CreateSuperAdminResponse, CreateSuperAdminPayload } from '@/services/auth/authApi';
import styles from './CreateSuperAdminDrawer.module.css';

// ── Validation helpers ────────────────────────────────────────────────────────

// Min 8 chars · uppercase · lowercase · digit · special char (no spaces)
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&_#^()\-])[^\s]{8,}$/;

function validatePassword(pw: string): string | null {
  if (!pw) return 'Password is required';
  if (pw.length < 8) return 'At least 8 characters required';
  if (!PASSWORD_REGEX.test(pw))
    return 'Must include uppercase, lowercase, a number, and a special character';
  return null;
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return 'Enter a valid email address';
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

type View = 'form' | 'success' | 'error';

const EMPTY: FormState = { name: '', email: '', password: '', showPassword: false };

// ── Component ─────────────────────────────────────────────────────────────────

export interface CreateSuperAdminDrawerProps {
  isOpen:  boolean;
  onClose: () => void;
}

export function CreateSuperAdminDrawer({ isOpen, onClose }: CreateSuperAdminDrawerProps) {
  const { session } = useAuth();
  const [createSuperAdmin, { isLoading: submitting }] = useCreateSuperAdminMutation();

  const [form,      setForm]      = useState<FormState>(EMPTY);
  const [errors,    setErrors]    = useState<FormErrors>({});
  const [view,      setView]      = useState<View>('form');
  const [created,   setCreated]   = useState<CreateSuperAdminResponse | null>(null);
  const [serverErr, setServerErr] = useState('');

  const submitGuard = useRef(false);
  const nameRef     = useRef<HTMLInputElement>(null);

  // Reset state every time the drawer opens
  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY);
    setErrors({});
    setView('form');
    setCreated(null);
    setServerErr('');
    const t = setTimeout(() => nameRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [isOpen]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key !== 'showPassword' && errors[key as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  }

  function validateForm(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim())              errs.name = 'Name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    const emailErr = validateEmail(form.email);
    if (emailErr) errs.email = emailErr;
    const pwErr = validatePassword(form.password);
    if (pwErr) errs.password = pwErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (submitGuard.current || submitting) return;
    if (!validateForm()) return;
    submitGuard.current = true;

    const payload: CreateSuperAdminPayload = {
      name:     form.name.trim(),
      email:    form.email.trim().toLowerCase(),
      password: form.password,
    };

    try {
      const result = await createSuperAdmin(payload).unwrap();
      setCreated(result);
      setView('success');
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { message?: string } };
      if (e?.status === 409) {
        // Email already taken — surface inline on the email field; stay on form
        setErrors(prev => ({
          ...prev,
          email: 'An account with this email already exists',
        }));
      } else if (e?.status === 403 || e?.status === 401) {
        setServerErr('Your session does not have permission to perform this action. Please log in again.');
        setView('error');
      } else {
        setServerErr(
          e?.data?.message ?? 'Something went wrong. Check your connection and try again.',
        );
        setView('error');
      }
    } finally {
      submitGuard.current = false;
    }
  }

  function handleReset() {
    setForm(EMPTY);
    setErrors({});
    setView('form');
    setCreated(null);
    setServerErr('');
    setTimeout(() => nameRef.current?.focus(), 80);
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const isRestricted = session?.role !== 'super_admin';

  const footer = isRestricted ? (
    <div className={styles.footerRow}>
      <Button variant="ghost" onClick={onClose}>Close</Button>
    </div>
  ) : view === 'form' ? (
    <div className={styles.footerRow}>
      <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
      <Button onClick={() => void handleSubmit()} disabled={submitting} loading={submitting}>
        {submitting ? 'Creating…' : 'Create Account'}
      </Button>
    </div>
  ) : view === 'success' ? (
    <div className={styles.footerRow}>
      <Button variant="ghost" onClick={handleReset}>Create Another</Button>
      <Button onClick={onClose}>Done</Button>
    </div>
  ) : (
    <div className={styles.footerRow}>
      <Button variant="ghost" onClick={onClose}>Close</Button>
      <Button onClick={() => setView('form')}>Try Again</Button>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Create Super Admin" footer={footer}>

      {/* ── ACCESS RESTRICTED ─────────────────────────────────────────── */}
      {isRestricted && (
        <div className={styles.restricted}>
          <AlertCircle size={32} className={styles.restrictedIcon} />
          <p>This action requires Super Admin privileges.</p>
        </div>
      )}

      {/* ── FORM VIEW ─────────────────────────────────────────────────── */}
      {!isRestricted && view === 'form' && (
        <div className={styles.body}>
          <div className={styles.headerBanner}>
            <ShieldCheck size={16} className={styles.bannerIcon} />
            <span>This account will have full platform access as a Super Admin.</span>
          </div>

          {/* Name */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="sa-name">
              Full Name <span className={styles.req}>*</span>
            </label>
            <input
              ref={nameRef}
              id="sa-name"
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputErr : ''}`}
              placeholder="e.g. Rajesh Kumar"
              value={form.name}
              maxLength={100}
              onChange={e => setField('name', e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void handleSubmit(); }}
              autoComplete="name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'sa-name-err' : undefined}
            />
            {errors.name && (
              <span id="sa-name-err" role="alert" className={styles.fieldErr}>
                {errors.name}
              </span>
            )}
          </div>

          {/* Email */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="sa-email">
              Email Address <span className={styles.req}>*</span>
            </label>
            <input
              id="sa-email"
              type="email"
              className={`${styles.input} ${errors.email ? styles.inputErr : ''}`}
              placeholder="e.g. rajesh@glasspro.com"
              value={form.email}
              maxLength={150}
              onChange={e => setField('email', e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void handleSubmit(); }}
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'sa-email-err' : undefined}
            />
            {errors.email && (
              <span id="sa-email-err" role="alert" className={styles.fieldErr}>
                {errors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="sa-password">
              Password <span className={styles.req}>*</span>
            </label>
            <div className={`${styles.passwordRow} ${errors.password ? styles.passwordRowErr : ''}`}>
              <input
                id="sa-password"
                type={form.showPassword ? 'text' : 'password'}
                className={styles.passwordInput}
                placeholder="Min 8 chars, mixed case, number, symbol"
                value={form.password}
                maxLength={72}
                onChange={e => setField('password', e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void handleSubmit(); }}
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'sa-pw-err' : 'sa-pw-hint'}
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
            {errors.password ? (
              <span id="sa-pw-err" role="alert" className={styles.fieldErr}>
                {errors.password}
              </span>
            ) : (
              <span id="sa-pw-hint" className={styles.hint}>
                Min 8 chars · uppercase · lowercase · number · special character
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── SUCCESS VIEW ──────────────────────────────────────────────── */}
      {!isRestricted && view === 'success' && (
        <div className={styles.resultWrap}>
          <div className={styles.successCircle}>
            <CheckCircle2 size={36} />
          </div>
          <h3 className={styles.resultTitle}>Account Created</h3>
          <p className={styles.resultDesc}>
            The Super Admin account has been created successfully.
          </p>
          {created && (created.name || created.email) && (
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
            Share the credentials securely — do not send passwords over chat or email.
          </p>
        </div>
      )}

      {/* ── ERROR VIEW ────────────────────────────────────────────────── */}
      {!isRestricted && view === 'error' && (
        <div className={styles.resultWrap}>
          <div className={styles.errorCircle}>
            <AlertCircle size={32} />
          </div>
          <h3 className={styles.resultTitle}>Request Failed</h3>
          <p className={styles.resultDesc}>{serverErr}</p>
        </div>
      )}

    </Drawer>
  );
}
