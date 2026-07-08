import type { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import styles from './AlertBanner.module.css';

export type AlertVariant = 'error' | 'warning' | 'info' | 'success';

interface AlertBannerProps {
  variant?:   AlertVariant;
  message:    ReactNode;
  onDismiss?: () => void;
}

const ICONS: Record<AlertVariant, ReactNode> = {
  error:   <AlertCircle   size={15} />,
  warning: <AlertTriangle size={15} />,
  info:    <Info          size={15} />,
  success: <CheckCircle   size={15} />,
};

export function AlertBanner({ variant = 'error', message, onDismiss }: AlertBannerProps) {
  return (
    <div className={`${styles.banner} ${styles[variant]}`} role="alert" aria-live="assertive">
      <span className={styles.icon} aria-hidden="true">{ICONS[variant]}</span>
      <span className={styles.message}>{message}</span>
      {onDismiss && (
        <button className={styles.close} onClick={onDismiss} aria-label="Dismiss">
          <X size={13} />
        </button>
      )}
    </div>
  );
}
