import type { ReactNode } from 'react';
import styles from './PageShell.module.css';

interface PageShellProps {
  heading:      string;
  description?: string;
  actions?:     ReactNode;
  children:     ReactNode;
}

export function PageShell({ heading, description, actions, children }: PageShellProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.shellHeader}>
        <div className={styles.shellTitles}>
          <h2 className={styles.heading}>{heading}</h2>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}

/* ─── Section card sub-components ─────────────────────────────────── */

interface SectionCardProps {
  children:  ReactNode;
  className?: string;
}

export function SectionCard({ children, className }: SectionCardProps) {
  return (
    <div className={`${styles.sectionCard} ${className ?? ''}`}>{children}</div>
  );
}

interface SectionHeaderProps {
  title:    string;
  actions?: ReactNode;
}

export function SectionHeader({ title, actions }: SectionHeaderProps) {
  return (
    <div className={styles.sectionTop}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
