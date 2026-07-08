import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useAuth, AuthError } from '@/context/AuthContext';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/constants/routes';
import { getRoleDefaultRoute } from '@/utils/roleRouting';
import { AuthCard } from './AuthCard';
import styles from './VerifyOtpPage.module.css';

const OTP_LENGTH             = 6;
const RESEND_COOLDOWN_SECONDS = 30;

export function VerifyOtpPage() {
  const { t }                   = useTranslation('auth');
  const { verifyOtp, resendOtp } = useAuth();
  const navigate                = useNavigate();
  const [params]                = useSearchParams();
  const otpToken                = params.get('token');

  const [otp,          setOtp]          = useState('');
  const [formError,    setFormError]    = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown,     setCooldown]     = useState(0);

  // Tick the resend cooldown timer down every second
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken || otp.length !== OTP_LENGTH) return;
    setFormError('');
    setIsSubmitting(true);
    try {
      const session = await verifyOtp({ otpToken, otp });
      navigate(getRoleDefaultRoute(session.role), { replace: true });
    } catch (err) {
      if (err instanceof AuthError) {
        if (err.code === 'TOKEN_EXPIRED') {
          setFormError(t('verifyOtp.errors.expired'));
        } else {
          setFormError(t('verifyOtp.errors.invalid'));
        }
      } else {
        setFormError(t('verifyOtp.errors.invalid'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [otpToken, otp, verifyOtp, navigate, t]);

  const handleResend = useCallback(async () => {
    if (!otpToken || cooldown > 0) return;
    try {
      await resendOtp(otpToken);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setOtp('');
      setFormError('');
    } catch {
      // Silent — user can retry; server errors here are non-critical
    }
  }, [otpToken, cooldown, resendOtp]);

  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(digits);
    if (formError) setFormError('');
  };

  // No token in URL — link is invalid or navigated to directly
  if (!otpToken) {
    return (
      <AuthCard title={t('verifyOtp.invalidTitle')}>
        <Link to={ROUTES.LOGIN} className={styles.backLink}>
          <ArrowLeft size={14} />
          {t('verifyOtp.backToLogin')}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t('verifyOtp.title')} subtitle={t('verifyOtp.subtitle')}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Input
          label={t('verifyOtp.form.otp')}
          placeholder={t('verifyOtp.form.otpPlaceholder')}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={OTP_LENGTH}
          value={otp}
          onChange={(e) => handleOtpChange(e.target.value)}
          autoComplete="one-time-code"
          autoFocus
          fullWidth
        />

        {formError && <AlertBanner message={formError} />}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isSubmitting}
          disabled={otp.length !== OTP_LENGTH}
        >
          {isSubmitting ? t('verifyOtp.form.submitting') : t('verifyOtp.form.submit')}
        </Button>
      </form>

      <div className={styles.resend}>
        {cooldown > 0 ? (
          <span className={styles.cooldown}>
            {t('verifyOtp.resendIn', { seconds: cooldown })}
          </span>
        ) : (
          <button type="button" className={styles.resendBtn} onClick={handleResend}>
            {t('verifyOtp.resend')}
          </button>
        )}
      </div>

      <Link to={ROUTES.LOGIN} className={styles.backLink}>
        <ArrowLeft size={14} />
        {t('verifyOtp.backToLogin')}
      </Link>
    </AuthCard>
  );
}
