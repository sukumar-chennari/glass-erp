import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

type LoginMode = 'email' | 'phone';

export function LoginPage() {
  const { t } = useTranslation('auth');
  const { acceptLoginResponse, session, isLoading } = useAuth();
  const navigate = useNavigate();

  const [loginEmail]  = useLoginEmailMutation();
  const [otpSend]     = useOtpSendMutation();

  const [mode, setMode] = useState<LoginMode>('email');

  // Email/password form state
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailErrors,  setEmailErrors]  = useState<{ email?: string; password?: string }>({});
  const [lockUntil,    setLockUntil]    = useState<Date | null>(null);
  const [countdown,    setCountdown]    = useState('');
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Phone OTP form state
  const [phone,      setPhone]      = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Shared
  const [formError,    setFormError]    = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (m: LoginMode) => {
    if (m === mode) return;
    setMode(m);
    setFormError('');
    setEmailErrors({});
    setPhoneError('');
    setIsSubmitting(false);
  };

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

  const handleEmailSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof emailErrors = {};
    if (!email.trim())    errs.email    = t('form.errors.identifierRequired');
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

  const subtitle = mode === 'email'
    ? t('subtitle')
    : 'Enter your registered mobile number to receive a one-time password.';

  return (
    <AuthCard title={t('title')} subtitle={subtitle}>
      <div className={styles.modeToggle} role="tablist" aria-label="Login method">
        <button
          type="button" role="tab" aria-selected={mode === 'email'}
          className={`${styles.modeBtn} ${mode === 'email' ? styles.modeBtnActive : ''}`}
          onClick={() => switchMode('email')}
        >
          Email Login
        </button>
        <button
          type="button" role="tab" aria-selected={mode === 'phone'}
          className={`${styles.modeBtn} ${mode === 'phone' ? styles.modeBtnActive : ''}`}
          onClick={() => switchMode('phone')}
        >
          Mobile OTP
        </button>
      </div>

      {mode === 'email' ? (
        <form className={styles.form} onSubmit={handleEmailSubmit} noValidate>
          <Input
            label="Email address"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (emailErrors.email) setEmailErrors((er) => ({ ...er, email: undefined })); }}
            error={emailErrors.email}
            autoComplete="username"
            autoFocus
            fullWidth
          />
          <Input
            label={t('form.password')}
            placeholder={t('form.passwordPlaceholder')}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (emailErrors.password) setEmailErrors((er) => ({ ...er, password: undefined })); }}
            error={emailErrors.password}
            autoComplete="current-password"
            fullWidth
            rightIcon={
              <button
                type="button" className={styles.eyeBtn}
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
          <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting} disabled={!!lockUntil}>
            {t('form.submit')}
          </Button>
          <Link to={ROUTES.FORGOT_PASSWORD} className={styles.forgotLink}>
            {t('form.forgotPassword')}
          </Link>
        </form>
      ) : (
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
      )}
    </AuthCard>
  );
}
