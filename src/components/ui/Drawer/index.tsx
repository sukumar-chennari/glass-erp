import { useEffect, type ReactNode, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import styles from './Drawer.module.css';

interface DrawerProps {
  isOpen:   boolean;
  onClose:  () => void;
  title:    string;
  children: ReactNode;
  footer?:  ReactNode;
  /** Panel width, e.g. '440px' or '520px'. Default: 440px */
  width?:   string;
}

export function Drawer({ isOpen, onClose, title, children, footer, width = '440px' }: DrawerProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else        document.body.style.overflow  = '';
    return ()   => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <div
      className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <aside
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}
        style={{ '--drawer-width': width } as CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </aside>
    </div>
  );
}
