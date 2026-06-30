import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth, AuthError } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/constants/routes';
import { getRoleDefaultRoute } from '@/utils/roleRouting';
import { AuthCard } from './AuthCard';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { t } = useTranslation('auth');
  const { login, session, isLoading } = useAuth();
  const navigate = useNavigate();

  const [identifier,   setIdentifier]   = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors,  setFieldErrors]  = useState<{ identifier?: string; password?: string }>({});
  const [formError,    setFormError]    = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockUntil,    setLockUntil]    = useState<Date | null>(null);
  const [countdown,    setCountdown]    = useState('');
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect if already authenticated (handles direct navigation to /login)
  useEffect(() => {
    if (!isLoading && session) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [session, isLoading, navigate]);

  // Live countdown timer for account lockout
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: typeof fieldErrors = {};
    if (!identifier.trim()) errs.identifier = t('form.errors.identifierRequired');
    if (!password.trim())   errs.password   = t('form.errors.passwordRequired');
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setFieldErrors({});
    setFormError('');
    setIsSubmitting(true);

    try {
      const session = await login({ identifier: identifier.trim(), password });
      navigate(getRoleDefaultRoute(session.role), { replace: true });
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.code === 'OTP_REQUIRED') {
          // Password verified — backend issued an OTP challenge.
          // Navigate to the OTP screen; demo mock never triggers this path.
          navigate(`${ROUTES.VERIFY_OTP}?token=${err.otpToken ?? ''}`, { replace: true });
          return;
        } else if (err.code === 'ACCOUNT_LOCKED') {
          const until = err.lockUntil
            ? new Date(err.lockUntil)
            : new Date(Date.now() + 30 * 60_000);
          setLockUntil(until);
          setFormError(t('errors.accountLocked', { minutes: Math.ceil((until.getTime() - Date.now()) / 60_000) }));
        } else if (err.code === 'ACCOUNT_INACTIVE') {
          setFormError(t('errors.accountInactive'));
        } else {
          setFormError(t('form.errors.invalidCredentials'));
        }
      } else {
        setFormError(t('form.errors.invalidCredentials'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [identifier, password, login, navigate, t]);

  const clearFieldError = (field: keyof typeof fieldErrors) => {
    if (fieldErrors[field]) setFieldErrors((e) => ({ ...e, [field]: undefined }));
  };

  return (
    <AuthCard title={t('title')} subtitle={t('subtitle')}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Input
          label={t('form.identifier')}
          placeholder={t('form.identifierPlaceholder')}
          type="text"
          value={identifier}
          onChange={(e) => { setIdentifier(e.target.value); clearFieldError('identifier'); }}
          error={fieldErrors.identifier}
          autoComplete="username"
          autoFocus
          fullWidth
        />

        <Input
          label={t('form.password')}
          placeholder={t('form.passwordPlaceholder')}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
          error={fieldErrors.password}
          autoComplete="current-password"
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

        {formError && <p className={styles.formError} role="alert">{formError}</p>}
        {lockUntil && countdown && (
          <p className={styles.lockCountdown} role="status">
            Try again in <strong>{countdown}</strong>
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting} disabled={!!lockUntil}>
          {t('form.submit')}
        </Button>
      </form>

      {/* ── OTP step (future) ────────────────────────────────────────────────
          When backend returns { requiresOtp: true }, set authStep = 'otp'
          and render an OTP input here instead of the form above.
          The auth service interface already includes verifyOtp() as a comment.
      ────────────────────────────────────────────────────────────────────── */}

      <Link to={ROUTES.FORGOT_PASSWORD} className={styles.forgotLink}>
        {t('form.forgotPassword')}
      </Link>
    </AuthCard>
  );
}
