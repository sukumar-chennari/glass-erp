import { PackageOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title?:    string;
  message?:  string;
  action?:   ReactNode;
  icon?:     ReactNode;
}

export function EmptyState({
  title   = 'No data',
  message = 'Nothing to display here yet.',
  action,
  icon    = <PackageOpen size={40} />,
}: EmptyStateProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.iconWrap}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      <p  className={styles.message}>{message}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
