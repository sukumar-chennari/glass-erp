import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ROUTES } from '@/constants/routes';
import { useResetPasswordMutation } from '@/services/auth/authApi';
import { AuthCard } from './AuthCard';
import styles from './SetupPasswordPage.module.css';

export function SetupPasswordPage() {
  const navigate = useNavigate();
  const [params]  = useSearchParams();
  const token     = params.get('token') ?? '';

  const [password,     setPassword]    = useState('');
  const [confirm,      setConfirm]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors,  setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError,    setFormError]   = useState('');
  const [success,      setSuccess]     = useState(false);

  const [resetPassword, { isLoading: isSubmitting }] = useResetPasswordMutation();

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 3000);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof fieldErrors = {};
    if (!password)                errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!confirm)                 errs.confirm  = 'Please confirm your password';
    else if (password !== confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setFieldErrors({});
    setFormError('');
    try {
      await resetPassword({ token, password, type: 'setup' }).unwrap();
      setSuccess(true);
    } catch (err) {
      const code = (err as { data?: { code?: string } })?.data?.code;
      if (code === 'TOKEN_EXPIRED') {
        setFormError('This setup link has expired. Please ask your administrator to send a new invite.');
      } else {
        setFormError('This setup link is invalid or has already been used. Please contact your administrator.');
      }
    }
  }, [password, confirm, token, resetPassword]);

  if (success) {
    return (
      <AuthCard
        title="Account Activated!"
        subtitle="Your password is set. Redirecting you to the login page…"
        iconVariant="success"
      >
        <Link to={ROUTES.LOGIN} className={styles.backLink}>Go to Login now</Link>
      </AuthCard>
    );
  }

  if (!token) {
    return (
      <AuthCard title="Invalid Setup Link">
        <p className={styles.formError} role="alert">
          This link is missing a setup token. Please use the link from your welcome email,
          or ask your administrator to resend the invite.
        </p>
        <Link to={ROUTES.LOGIN} className={styles.backLink}>Back to Login</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set Up Your Password"
      subtitle="Welcome to WindX! Create a secure password to activate your account."
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Input
          label="New Password"
          placeholder="Minimum 8 characters"
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
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <Input
          label="Confirm Password"
          placeholder="Re-enter your password"
          type={showPassword ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setFieldErrors((p) => ({ ...p, confirm: undefined })); }}
          error={fieldErrors.confirm}
          autoComplete="new-password"
          fullWidth
        />

        {formError && <p className={styles.formError} role="alert">{formError}</p>}

        <Button type="submit" variant="primary" size="lg" fullWidth loading={isSubmitting}>
          Activate My Account
        </Button>
      </form>

      <Link to={ROUTES.LOGIN} className={styles.backLink}>Back to Login</Link>
    </AuthCard>
  );
}
