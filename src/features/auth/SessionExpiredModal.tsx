import { useNavigate } from 'react-router-dom';
import { LogIn, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import styles from './SessionExpiredModal.module.css';

export function SessionExpiredModal() {
  const { isSessionExpired, logout } = useAuth();
  const navigate = useNavigate();

  if (!isSessionExpired) return null;

  function handleReLogin() {
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="session-title">
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <Clock size={32} />
        </div>
        <h2 className={styles.title} id="session-title">Session Expired</h2>
        <p className={styles.desc}>
          You have been inactive for a while. Please log in again to continue.
        </p>
        <button className={styles.btn} onClick={handleReLogin}>
          <LogIn size={15} />
          Log In Again
        </button>
      </div>
    </div>
  );
}
