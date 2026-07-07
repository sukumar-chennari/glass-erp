import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useResetPasswordMutation } from '@/services/auth/authApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/constants/routes';
import { AuthCard } from './AuthCard';
import styles from './ResetPasswordPage.module.css';

export function ResetPasswordPage() {
  const { t }     = useTranslation('auth');
  const navigate  = useNavigate();
  const [params]  = useSearchParams();

  const token = params.get('token') ?? '';
  const type  = (params.get('type') === 'setup' ? 'setup' : 'reset') as 'setup' | 'reset';

  const [password,     setPassword]     = useState('');
  const [confirm,      setConfirm]      = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors,  setFieldErrors]  = useState<{ password?: string; confirm?: string }>({});
  const [formError,    setFormError]    = useState('');
  const [success,      setSuccess]      = useState(false);

  const [resetPassword, { isLoading: isSubmitting }] = useResetPasswordMutation();

  // Auto-redirect to login after showing the success state
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 2500);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof fieldErrors = {};
    if (!password)          errs.password = t('resetPassword.form.errors.passwordRequired');
    else if (password.length < 8) errs.password = t('resetPassword.form.errors.passwordTooShort');
    if (!confirm)           errs.confirm  = t('resetPassword.form.errors.confirmRequired');
    else if (password !== confirm) errs.confirm = t('resetPassword.form.errors.passwordMismatch');

    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setFieldErrors({});
    setFormError('');
    try {
      await resetPassword({ token, password, type }).unwrap();
      setSuccess(true);
    } catch (err) {
      const code = (err as { data?: { code?: string } })?.data?.code;
      if (code === 'TOKEN_EXPIRED') {
        setFormError(t('resetPassword.form.errors.tokenExpired'));
      } else {
        setFormError(t('resetPassword.form.errors.tokenInvalid'));
      }
    }
  }, [password, confirm, token, type, t, resetPassword]);

  // ── Success state ──────────────────────────────────────────────────────────

  if (success) {
    return (
      <AuthCard
        title={t('resetPassword.success.title')}
        subtitle={t('resetPassword.success.message')}
        iconVariant="success"
      >
        <Link to={ROUTES.LOGIN} className={styles.backLink}>
          <ArrowLeft size={14} />
          {t('resetPassword.backToLogin')}
        </Link>
      </AuthCard>
    );
  }

  // ── Missing token ──────────────────────────────────────────────────────────

  if (!token) {
    return (
      <AuthCard title={t('resetPassword.form.errors.tokenInvalid')}>
        <Link to={ROUTES.FORGOT_PASSWORD} className={styles.backLink}>
          {t('resetPassword.requestNewLink')}
        </Link>
      </AuthCard>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  const title    = type === 'setup' ? t('resetPassword.titleSetup') : t('resetPassword.title');
  const subtitle = t('resetPassword.subtitle');

  return (
    <AuthCard title={title} subtitle={subtitle}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Input
          label={t('resetPassword.form.password')}
          placeholder={t('resetPassword.form.passwordPlaceholder')}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
          error={fieldErrors.password}
          autoComplete="new-password"
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
        <Input
          label={t('resetPassword.form.confirmPassword')}
          placeholder={t('resetPassword.form.confirmPasswordPlaceholder')}
          type={showPassword ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setFieldErrors((p) => ({ ...p, confirm: undefined })); }}
          error={fieldErrors.confirm}
          autoComplete="new-password"
          fullWidth
        />

        {formError && <p className={styles.formError} role="alert">{formError}</p>}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
          {t('resetPassword.form.submit')}
        </Button>
      </form>

      <Link to={ROUTES.LOGIN} className={styles.backLink}>
        <ArrowLeft size={14} />
        {t('resetPassword.backToLogin')}
      </Link>
    </AuthCard>
  );
}
