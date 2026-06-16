import { PackageOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title?:    string;
  message?:  string;
  action?:   ReactNode;
  icon?:     ReactNode;
}

export function EmptyState({
  title,
  message,
  action,
  icon = <PackageOpen size={40} />,
}: EmptyStateProps) {
  const { t } = useTranslation('common');
  return (
    <div className={styles.wrap}>
      <div className={styles.iconWrap}>{icon}</div>
      <h3 className={styles.title}>{title ?? t('emptyState.title')}</h3>
      <p  className={styles.message}>{message ?? t('emptyState.message')}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
