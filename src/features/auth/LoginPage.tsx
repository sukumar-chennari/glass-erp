import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLoginEmailMutation, useOtpSendMutation } from '@/services/auth/authApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/constants/routes';
import { getRoleDefaultRoute } from '@/utils/roleRouting';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AuthCard } from './AuthCard';
import styles from './LoginPage.module.css';

type LoginStep = 'identifier' | 'email' | 'phone';

export function LoginPage() {
  const { t } = useTranslation('auth');
  const { acceptLoginResponse, session, isLoading } = useAuth();
  const navigate    = useNavigate();
  const [urlParams] = useSearchParams();
  const sessionExpiredBanner = urlParams.get('reason') === 'session_expired'
    ? 'Your session expired. Please sign in again.'
    : null;

  const [loginEmail] = useLoginEmailMutation();
  const [otpSend]    = useOtpSendMutation();

  // ── Step state ───────────────────────────────────────────────
  const [step, setStep] = useState<LoginStep>('identifier');

  // ── Step 1: identifier ───────────────────────────────────────
  const [identifier,      setIdentifier]      = useState('');
  const [identifierError, setIdentifierError] = useState('');

  // ── Step 2a: email + password ────────────────────────────────
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailErrors,  setEmailErrors]  = useState<{ email?: string; password?: string }>({});
  const [lockUntil,    setLockUntil]    = useState<Date | null>(null);
  const [countdown,    setCountdown]    = useState('');
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Step 2b: phone OTP ───────────────────────────────────────
  const [phone,      setPhone]      = useState('');
  const [phoneError, setPhoneError] = useState('');

  // ── Shared ───────────────────────────────────────────────────
  const [formError,    setFormError]    = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && session) {
      navigate(getRoleDefaultRoute(session.role), { replace: true });
    }
  }, [session, isLoading, navigate]);

  // Live countdown for account lockout
  useEffect(() => {
    if (!lockUntil) return;
    function tick() {
      const remaining = lockUntil!.getTime() - Date.now();
      if (remaining <= 0) {
        setLockUntil(null);
        setCountdown('');
        setFormError('');
        if (countdownRef.current) clearInterval(countdownRef.current);
        return;
      }
      const m = Math.floor(remaining / 60_000);
      const s = Math.floor((remaining % 60_000) / 1_000);
      setCountdown(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }
    tick();
    countdownRef.current = setInterval(tick, 1_000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [lockUntil]);

  // ── Step 1: Continue — detect identifier type ────────────────

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = identifier.trim();
    if (!trimmed) {
      setIdentifierError('Enter your email or mobile number');
      return;
    }
    const stripped = trimmed.replace(/\s/g, '');
    if (stripped.includes('@')) {
      setIdentifierError('');
      setEmail(trimmed);
      setStep('email');
    } else if (/^\+?\d{10,15}$/.test(stripped)) {
      setIdentifierError('');
      setPhone(stripped);
      setStep('phone');
    } else {
      setIdentifierError('Enter a valid email or 10-digit mobile number');
    }
  }

  function handleBack() {
    setStep('identifier');
    setFormError('');
    setEmailErrors({});
    setPhoneError('');
    setIsSubmitting(false);
  }

  // ── Step 2a: email + password submit ─────────────────────────

  const handleEmailSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof emailErrors = {};
    if (!password.trim()) errs.password = t('form.errors.passwordRequired');
    if (Object.keys(errs).length > 0) { setEmailErrors(errs); return; }
    setEmailErrors({});
    setFormError('');
    setIsSubmitting(true);
    try {
      const data = await loginEmail({ email: email.trim(), password }).unwrap();
      const result = acceptLoginResponse(data);
      navigate(getRoleDefaultRoute(result.role), { replace: true });
    } catch (err) {
      const e = err as { status?: number; data?: { message?: string } };
      const status = e.status ?? 0;
      const msgUpper = ((e.data?.message ?? '') as string).toUpperCase();

      if (status === 429 || msgUpper.includes('LOCKED')) {
        const until = new Date(Date.now() + 30 * 60_000);
        setLockUntil(until);
        setFormError(t('errors.accountLocked', { minutes: 30 }));
      } else if (msgUpper.includes('INACTIVE')) {
        setFormError(t('errors.accountInactive'));
      } else if (msgUpper.includes('PENDING_SETUP')) {
        setFormError('Your account setup is incomplete. Check your email for the setup link, or ask your administrator to resend the invite.');
      } else {
        setFormError(t('form.errors.invalidCredentials'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, loginEmail, acceptLoginResponse, navigate, t]);

  // ── Step 2b: phone → send OTP ────────────────────────────────

  const handlePhoneSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed) { setPhoneError('Mobile number is required'); return; }
    if (!/^\+?[\d\s\-()]{7,15}$/.test(trimmed)) {
      setPhoneError('Enter a valid mobile number');
      return;
    }
    setPhoneError('');
    setFormError('');
    setIsSubmitting(true);
    try {
      const { otpToken } = await otpSend({ phone: trimmed }).unwrap();
      navigate(
        `${ROUTES.VERIFY_OTP}?token=${encodeURIComponent(otpToken)}&phone=${encodeURIComponent(trimmed)}`,
        { replace: false },
      );
    } catch {
      setFormError('Failed to send OTP. Please check the number and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [phone, otpSend, navigate]);

  // ── Subtitle ─────────────────────────────────────────────────

  const subtitle = step === 'phone'
    ? 'Enter your registered mobile number to receive a one-time password.'
    : t('subtitle');

  // ── Render ───────────────────────────────────────────────────

  return (
    <AuthCard title={t('title')} subtitle={subtitle}>
      {sessionExpiredBanner && <AlertBanner message={sessionExpiredBanner} />}

      {/* ── Step 1: identifier input ── */}
      {step === 'identifier' && (
        <form className={styles.form} onSubmit={handleContinue} noValidate>
          <Input
            label="Email or Mobile Number"
            placeholder="you@example.com or 9876543210"
            type="text"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (identifierError) setIdentifierError('');
            }}
            error={identifierError}
            autoComplete="username"
            autoFocus
            fullWidth
          />
          <Button type="submit" variant="primary" size="lg" fullWidth>
            Continue
          </Button>
        </form>
      )}

      {/* ── Step 2a: password (email branch) ── */}
      {step === 'email' && (
        <>
          <div className={styles.identifierRow}>
            <span className={styles.identifierValue}>{identifier}</span>
            <button type="button" className={styles.changeBtn} onClick={handleBack}>
              Change
            </button>
          </div>
          <form className={styles.form} onSubmit={handleEmailSubmit} noValidate>
            <Input
              label={t('form.password')}
              placeholder={t('form.passwordPlaceholder')}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (emailErrors.password) setEmailErrors((er) => ({ ...er, password: undefined }));
              }}
              error={emailErrors.password}
              autoComplete="current-password"
              autoFocus
              fullWidth
              rightIcon={
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? t('form.hidePassword') : t('form.showPassword')}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
            {formError && <AlertBanner message={formError} />}
            {lockUntil && countdown && (
              <p className={styles.lockCountdown} role="status">
                Try again in <strong>{countdown}</strong>
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              disabled={!!lockUntil}
            >
              {t('form.submit')}
            </Button>
            <Link to={ROUTES.FORGOT_PASSWORD} className={styles.forgotLink}>
              {t('form.forgotPassword')}
            </Link>
          </form>
        </>
      )}

      {/* ── Step 2b: phone OTP ── */}
      {step === 'phone' && (
        <>
          <form className={styles.form} onSubmit={handlePhoneSubmit} noValidate>
            <Input
              label="Mobile number"
              placeholder="+91 98765 43210"
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); if (phoneError) setPhoneError(''); }}
              error={phoneError}
              autoComplete="tel"
              autoFocus
              fullWidth
            />
            {formError && <AlertBanner message={formError} />}
            <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
              Send OTP
            </Button>
          </form>
          <button type="button" className={styles.backLink} onClick={handleBack}>
            ← Use a different account
          </button>
        </>
      )}
    </AuthCard>
  );
}
