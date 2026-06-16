import { useTranslation } from 'react-i18next';
import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function Spinner({ size = 'md', label }: SpinnerProps) {
  const { t } = useTranslation('common');
  return (
    <span className={`${styles.spinner} ${styles[size]}`} role="status" aria-label={label ?? t('table.loading')} />
  );
}

export function PageSpinner() {
  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        minHeight:      '40vh',
      }}
    >
      <Spinner size="lg" />
    </div>
  );
}
