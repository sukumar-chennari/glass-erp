import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe2, Check } from 'lucide-react';
import styles from './LanguageSwitcher.module.css';

interface Language {
  code: string;
  nativeName: string;
  short: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', nativeName: 'English', short: 'EN' },
  { code: 'te', nativeName: 'తెలుగు',  short: 'TE' },
  { code: 'hi', nativeName: 'हिंदी',   short: 'HI' },
];

const MENU_ITEM_SELECTOR = '[role="menuitemradio"]';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation('nav');
  const [open, setOpen] = useState(false);
  const wrapRef    = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0];

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

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    close();
  };

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        onClick={() => setOpen(v => !v)}
        aria-label={t('languageSwitcher.aria.trigger')}
        aria-expanded={open}
        aria-haspopup="menu"
        title={current.nativeName}
      >
        <Globe2 size={16} />
        <span className={styles.currentCode}>{current.short}</span>
      </button>

      {open && (
        <div
          ref={popoverRef}
          className={styles.popover}
          role="menu"
          aria-label={t('languageSwitcher.aria.menu')}
          onKeyDown={handlePopoverKeyDown}
        >
          {LANGUAGES.map((lang) => {
            const isActive = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                className={`${styles.option} ${isActive ? styles.optionActive : ''}`}
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => handleSelect(lang.code)}
                tabIndex={-1}
              >
                <span className={styles.short}>{lang.short}</span>
                <span className={styles.nativeName}>{lang.nativeName}</span>
                {isActive && <Check size={12} className={styles.check} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
