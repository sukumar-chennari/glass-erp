import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SunMoon, Sun, Moon, Monitor, Palette, Check, ChevronRight, type LucideIcon } from 'lucide-react';
import { useTheme, type ThemeId } from '@/context/ThemeContext';
import { ROUTES } from '@/constants/routes';
import styles from './ThemeToggle.module.css';

const QUICK_OPTIONS: { id: ThemeId; Icon: LucideIcon }[] = [
  { id: 'light',  Icon: Sun     },
  { id: 'dark',   Icon: Moon    },
  { id: 'system', Icon: Monitor },
];

const MENU_ITEM_SELECTOR = '[role="menuitem"],[role="menuitemradio"]';

export function ThemeToggle() {
  const [open, setOpen]  = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate    = useNavigate();
  const { t }       = useTranslation('nav');
  const wrapRef     = useRef<HTMLDivElement>(null);
  const triggerRef  = useRef<HTMLButtonElement>(null);
  const popoverRef  = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown',   onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown',   onKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open || !popoverRef.current) return;
    const active = popoverRef.current.querySelector<HTMLElement>('[aria-checked="true"]');
    const first  = popoverRef.current.querySelector<HTMLElement>(MENU_ITEM_SELECTOR);
    (active ?? first)?.focus();
  }, [open]);

  const handlePopoverKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(
      popoverRef.current?.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR) ?? []
    );
    const cur  = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === 'ArrowDown'
      ? (cur + 1) % items.length
      : (cur - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        onClick={() => setOpen(v => !v)}
        aria-label={t('themeToggle.aria.trigger')}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <SunMoon size={18} />
      </button>

      {open && (
        <div
          ref={popoverRef}
          className={styles.popover}
          role="menu"
          aria-label={t('themeToggle.aria.menu')}
          onKeyDown={handlePopoverKeyDown}
        >
          {QUICK_OPTIONS.map(({ id, Icon }) => (
            <button
              key={id}
              className={`${styles.option} ${theme === id ? styles.optionActive : ''}`}
              role="menuitemradio"
              aria-checked={theme === id}
              onClick={() => { setTheme(id); close(); }}
              tabIndex={-1}
            >
              <Icon size={14} />
              <span>{t(`themeToggle.${id}`)}</span>
              {theme === id && <Check size={12} className={styles.check} />}
            </button>
          ))}

          <div className={styles.separator} role="separator" />

          <button
            className={styles.moreBtn}
            role="menuitem"
            onClick={() => { navigate(ROUTES.SETTINGS); close(); }}
            tabIndex={-1}
          >
            <Palette size={14} />
            <span>{t('themeToggle.moreThemes')}</span>
            <ChevronRight size={12} className={styles.chevron} />
          </button>
        </div>
      )}
    </div>
  );
}
