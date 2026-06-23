import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Layers } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/constants/routes';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { t } = useTranslation('auth');
  const { login, session, isLoading } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && session) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [session, isLoading, navigate]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const errs: typeof fieldErrors = {};
    if (!identifier.trim()) errs.identifier = t('form.errors.identifierRequired');
    if (!password.trim()) errs.password   = t('form.errors.passwordRequired');

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setFormError('');
    setIsSubmitting(true);

    try {
      await login({ identifier: identifier.trim(), password });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch {
      setFormError(t('form.errors.invalidCredentials'));
    } finally {
      setIsSubmitting(false);
    }
  }, [identifier, password, login, navigate, t]);

  const clearFieldError = (field: keyof typeof fieldErrors) => {
    if (fieldErrors[field]) setFieldErrors((e) => ({ ...e, [field]: undefined }));
  };

  return (
    <div className={styles.root}>
      <div className={styles.backdrop} aria-hidden="true" />

      <main className={styles.card} role="main">
        <div className={styles.brand}>
          <div className={styles.logo} aria-hidden="true">
            <Layers size={28} strokeWidth={1.75} />
          </div>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </div>

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

          {formError && (
            <p className={styles.formError} role="alert">{formError}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
          >
            {t('form.submit')}
          </Button>
        </form>

        <p className={styles.footer}>{t('footer')}</p>
      </main>
    </div>
  );
}
