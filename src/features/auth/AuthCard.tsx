import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import windexLogo from '../../../assets/images/windex-logo.png';
import styles from './AuthCard.module.css';

interface AuthCardProps {
  title:        string;
  subtitle?:    string;
  /** 'brand' = gradient logo (default); 'success' = green check. */
  iconVariant?: 'brand' | 'success';
  children:     ReactNode;
}

/**
 * Shared glass-card shell for all auth pages.
 * Handles the full-page backdrop, the card frame, brand logo, and footer.
 * Page-specific content (forms, links) goes in children.
 */
export function AuthCard({
  title,
  subtitle,
  iconVariant = 'brand',
  children,
}: AuthCardProps) {
  const { t } = useTranslation('auth');

  return (
    <div className={styles.root}>
      <div className={styles.backdrop} aria-hidden="true" />

      <main className={styles.card}>
        <div className={styles.brand}>
          <div
            className={`${styles.logo} ${iconVariant === 'success' ? styles.logoSuccess : ''}`}
            aria-hidden="true"
          >
            {iconVariant === 'success'
              ? <CheckCircle2 size={28} strokeWidth={1.75} />
              : <img src={windexLogo} alt="WindX" className={styles.logoImg} />
            }
          </div>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        <div className={styles.content}>
          {children}
        </div>

        <p className={styles.footer}>{t('footer')}</p>
      </main>
    </div>
  );
}
