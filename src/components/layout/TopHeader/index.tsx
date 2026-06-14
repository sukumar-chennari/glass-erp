import { Bell, Settings, MessageSquare } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '@/constants/nav';
import styles from './TopHeader.module.css';

export function TopHeader() {
  const { pathname } = useLocation();
  const activeItem   = NAV_ITEMS.find((n) => n.path === pathname);
  const pageTitle    = activeItem?.label ?? 'Glass ERP Pro';

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.pageTitle}>{pageTitle}</h1>
      </div>

      <div className={styles.right}>
        <span className={styles.dateTime}>
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'short',
            day:     '2-digit',
            month:   'short',
            year:    'numeric',
          })}
        </span>

        <div className={styles.divider} />

        <button className={styles.iconBtn} aria-label="Messages">
          <MessageSquare size={18} />
        </button>

        <button className={styles.iconBtn} aria-label="Notifications">
          <Bell size={18} />
          <span className={styles.notifDot} />
        </button>

        <button className={styles.iconBtn} aria-label="Settings">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
