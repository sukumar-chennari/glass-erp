import { Bell, MessageSquare, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/store/hooks';
import { toggleMobileSidebar } from '@/store/slices/uiSlice';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import styles from './TopHeader.module.css';

export function TopHeader() {
  const { t }    = useTranslation('nav');
  const dispatch = useAppDispatch();

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
      </div>
    </header>
  );
}
