import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { authService } from '@/services/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/constants/routes';
import { AuthCard } from './AuthCard';
import styles from './ForgotPasswordPage.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth');

  const [email,        setEmail]        = useState('');
  const [fieldError,   setFieldError]   = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted,    setSubmitted]    = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setFieldError(t('forgotPassword.form.errors.emailRequired'));
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setFieldError(t('forgotPassword.form.errors.emailInvalid'));
      return;
    }
    setFieldError('');
    setIsSubmitting(true);
    try {
      await authService.requestPasswordReset(email.trim());
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [email, t]);

  if (submitted) {
    return (
      <AuthCard
        title={t('forgotPassword.success.title')}
        subtitle={t('forgotPassword.success.message')}
        iconVariant="success"
      >
        <Link to={ROUTES.LOGIN} className={styles.backLink}>
          <ArrowLeft size={14} />
          {t('forgotPassword.backToLogin')}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t('forgotPassword.title')}
      subtitle={t('forgotPassword.subtitle')}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Input
          label={t('forgotPassword.form.email')}
          placeholder={t('forgotPassword.form.emailPlaceholder')}
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldError(''); }}
          error={fieldError}
          autoComplete="email"
          autoFocus
          fullWidth
        />
        <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
          {t('forgotPassword.form.submit')}
        </Button>
      </form>

      <Link to={ROUTES.LOGIN} className={styles.backLink}>
        <ArrowLeft size={14} />
        {t('forgotPassword.backToLogin')}
      </Link>
    </AuthCard>
  );
}
