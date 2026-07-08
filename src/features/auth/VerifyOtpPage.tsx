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

const OTP_LENGTH              = 6;
const RESEND_COOLDOWN_SECONDS = 30;

export function VerifyOtpPage() {
  const { t }                             = useTranslation('auth');
  const { verifyOtp, resendOtp, sendOtp } = useAuth();
  const navigate                          = useNavigate();
  const [params]                          = useSearchParams();

  // otpToken lives in state (not URL) so resend can update it without navigation.
  const [currentOtpToken, setCurrentOtpToken] = useState(params.get('token') ?? '');
  // phone is present only for the Mobile OTP login flow.
  const phone = decodeURIComponent(params.get('phone') ?? '');

  const [otp,          setOtp]          = useState('');
  const [formError,    setFormError]    = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown,     setCooldown]     = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOtpToken || otp.length !== OTP_LENGTH) return;
    setFormError('');
    setIsSubmitting(true);
    try {
      const session = await verifyOtp({ otpToken: currentOtpToken, otp });
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
  }, [currentOtpToken, otp, verifyOtp, navigate, t]);

  const handleResend = useCallback(async () => {
    if (cooldown > 0) return;
    try {
      if (phone) {
        // Phone OTP flow — re-send to the same number; refresh the token in state.
        const result = await sendOtp(phone);
        setCurrentOtpToken(result.otpToken);
      } else {
        // Legacy / email-OTP flow — backend resends using the existing token.
        await resendOtp(currentOtpToken);
      }
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setOtp('');
      setFormError('');
    } catch {
      // Silent — cooldown not set on failure so the user can retry immediately.
    }
  }, [phone, currentOtpToken, sendOtp, resendOtp, cooldown]);

  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(digits);
    if (formError) setFormError('');
  };

  if (!currentOtpToken) {
    return (
      <AuthCard title={t('verifyOtp.invalidTitle')}>
        <Link to={ROUTES.LOGIN} className={styles.backLink}>
          <ArrowLeft size={14} />{t('verifyOtp.backToLogin')}
        </Link>
      </AuthCard>
    );
  }

  const subtitle = phone
    ? `A 6-digit OTP has been sent to ${phone}`
    : t('verifyOtp.subtitle');

  return (
    <AuthCard title={t('verifyOtp.title')} subtitle={subtitle}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Input
          label={t('verifyOtp.form.otp')}
          placeholder={t('verifyOtp.form.otpPlaceholder')}
          type="text" inputMode="numeric" pattern="[0-9]*" maxLength={OTP_LENGTH}
          value={otp} onChange={(e) => handleOtpChange(e.target.value)}
          autoComplete="one-time-code" autoFocus fullWidth
        />
        {formError && <AlertBanner message={formError} />}
        <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting} disabled={otp.length !== OTP_LENGTH}>
          {isSubmitting ? t('verifyOtp.form.submitting') : t('verifyOtp.form.submit')}
        </Button>
      </form>
      <div className={styles.resend}>
        {cooldown > 0 ? (
          <span className={styles.cooldown}>{t('verifyOtp.resendIn', { seconds: cooldown })}</span>
        ) : (
          <button type="button" className={styles.resendBtn} onClick={handleResend}>
            {t('verifyOtp.resend')}
          </button>
        )}
      </div>
      <Link to={ROUTES.LOGIN} className={styles.backLink}>
        <ArrowLeft size={14} />{t('verifyOtp.backToLogin')}
      </Link>
    </AuthCard>
  );
}
