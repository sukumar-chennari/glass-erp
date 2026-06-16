import { Bell, Settings, MessageSquare, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NAV_ITEMS } from '@/constants/nav';
import { useAppDispatch } from '@/store/hooks';
import { toggleMobileSidebar } from '@/store/slices/uiSlice';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import styles from './TopHeader.module.css';

export function TopHeader() {
  const { t } = useTranslation('nav');
  const { pathname } = useLocation();
  const dispatch     = useAppDispatch();
  const activeItem   = NAV_ITEMS.find((n) => n.path === pathname);
  const pageTitle    = activeItem ? t(activeItem.id, activeItem.label) : t('header.appFallback');

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          className={styles.hamburger}
          onClick={() => dispatch(toggleMobileSidebar())}
          aria-label={t('header.aria.openNav')}
        >
          <Menu size={20} />
        </button>
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

        <button className={styles.iconBtn} aria-label={t('header.aria.messages')}>
          <MessageSquare size={18} />
        </button>

        <button className={styles.iconBtn} aria-label={t('header.aria.notifications')}>
          <Bell size={18} />
          <span className={styles.notifDot} />
        </button>

        <ThemeToggle />
        <LanguageSwitcher />

        <button className={styles.iconBtn} aria-label={t('header.aria.settings')}>
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
