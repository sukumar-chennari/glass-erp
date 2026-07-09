import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useOtpVerifyMutation, useOtpSendMutation } from '@/services/auth/authApi';
import { useToast } from '@/components/ui/Toast';
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
  const { t }                              = useTranslation('auth');
  const { acceptLoginResponse, resendOtp } = useAuth();
  const navigate                           = useNavigate();
  const toast                              = useToast();
  const [params]                           = useSearchParams();

  const [otpVerify] = useOtpVerifyMutation();
  const [otpSend]   = useOtpSendMutation();

  // otpToken lives in state (not URL) so resend can update it without navigation.
  const [currentOtpToken, setCurrentOtpToken] = useState(params.get('token') ?? '');
  // phone is present only for the Mobile OTP login flow.
  const phone = decodeURIComponent(params.get('phone') ?? '');

  const [otp,          setOtp]          = useState('');
  const [formError,    setFormError]    = useState('');
  const [resendError,  setResendError]  = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending,  setIsResending]  = useState(false);
  const [cooldown,     setCooldown]     = useState(0);
  // Synchronous guards — prevent duplicate calls before React re-renders.
  const submitInFlightRef = useRef(false);
  const resendInFlightRef = useRef(false);
  // Tracks whether the user has successfully resent at least once;
  // used to show the "use the most recent code" hint during cooldown.
  const [hasResentOnce, setHasResentOnce] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    // Ref guard fires synchronously — prevents duplicate calls before React
    // re-renders and the button's `disabled` attribute takes effect.
    if (submitInFlightRef.current || !currentOtpToken || otp.length !== OTP_LENGTH) return;
    submitInFlightRef.current = true;
    setFormError('');
    setIsSubmitting(true);
    try {
      const data    = await otpVerify({ otpToken: currentOtpToken, otp }).unwrap();
      const session = acceptLoginResponse(data);
      navigate(getRoleDefaultRoute(session.role), { replace: true });
    } catch (err) {
      const e   = err as { status?: number; data?: { message?: string; code?: string } };
      const msg = ((e.data?.message ?? e.data?.code ?? '') as string).toUpperCase();

      if (msg.includes('EXPIRED') || msg.includes('TOKEN_EXPIRED')) {
        setFormError(t('verifyOtp.errors.expired'));
      } else {
        setFormError(t('verifyOtp.errors.invalid'));
      }
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }, [currentOtpToken, otp, otpVerify, acceptLoginResponse, navigate, t]);

  const handleResend = useCallback(async () => {
    if (resendInFlightRef.current || cooldown > 0 || isResending) return;
    resendInFlightRef.current = true;
    setIsResending(true);
    setResendError('');
    try {
      if (phone) {
        // Phone OTP flow — re-send to the same number; refresh the token in state.
        const result = await otpSend({ phone }).unwrap();
        setCurrentOtpToken(result.otpToken);
      } else {
        // Legacy / email-OTP flow — backend resends using the existing token.
        await resendOtp(currentOtpToken);
      }
      toast.info(t('verifyOtp.resendSuccess'));
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setHasResentOnce(true);
      setOtp('');
      setFormError('');
    } catch (err) {
      const e        = err as { status?: number; data?: { message?: string } };
      const isRateLimit = e.status === 429 ||
        ((e.data?.message ?? '') as string).toUpperCase().includes('RATE');
      setResendError(
        isRateLimit
          ? t('verifyOtp.errors.rateLimited')
          : t('verifyOtp.errors.resendFailed'),
      );
    } finally {
      resendInFlightRef.current = false;
      setIsResending(false);
    }
  }, [cooldown, isResending, phone, currentOtpToken, otpSend, resendOtp, toast, t]);

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
        <Button
          type="submit" variant="primary" size="lg" fullWidth
          loading={isSubmitting}
          disabled={otp.length !== OTP_LENGTH || isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? t('verifyOtp.form.submitting') : t('verifyOtp.form.submit')}
        </Button>
      </form>

      <div className={styles.resend}>
        {cooldown > 0 ? (
          <>
            <span className={styles.cooldown} role="status" aria-live="polite">
              {t('verifyOtp.resendIn', { seconds: cooldown })}
            </span>
            {hasResentOnce && (
              <p className={styles.latestOtpNote}>{t('verifyOtp.latestOtpNote')}</p>
            )}
          </>
        ) : (
          <button
            type="button"
            className={styles.resendBtn}
            onClick={handleResend}
            disabled={isResending}
            aria-busy={isResending}
          >
            {isResending ? t('verifyOtp.resending') : t('verifyOtp.resend')}
          </button>
        )}
      </div>

      {resendError && (
        <AlertBanner message={resendError} onDismiss={() => setResendError('')} />
      )}

      <Link to={ROUTES.LOGIN} className={styles.backLink}>
        <ArrowLeft size={14} />{t('verifyOtp.backToLogin')}
      </Link>
    </AuthCard>
  );
}
