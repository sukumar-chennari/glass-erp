import { useState, useRef, useEffect, useCallback } from 'react';
import { SunMoon, Check } from 'lucide-react';
import { useTheme, type ThemeId } from '@/context/ThemeContext';
import styles from './EntryThemeSelector.module.css';

interface ThemeOption {
  id:      ThemeId;
  label:   string;
  sidebar: string;
  body:    string;
  primary: string;
  light:   boolean;
}

const THEMES: readonly ThemeOption[] = [
  { id: 'windx',  label: 'WindX',  sidebar: '#ffffff', body: '#f8fafc',  primary: 'linear-gradient(135deg, #dc2626, #f59e0b)', light: true  },
  { id: 'light',  label: 'Light',  sidebar: '#ffffff', body: '#f1f5f9',  primary: '#6366f1',                                   light: true  },
  { id: 'dark',   label: 'Dark',   sidebar: '#1e293b', body: '#0f172a',  primary: '#818cf8',                                   light: false },
  { id: 'purple', label: 'Purple', sidebar: '#1a1a3e', body: '#0a0e27',  primary: '#6366f1',                                   light: false },
  { id: 'orange', label: 'Orange', sidebar: '#fffdf7', body: '#fffdf7',  primary: '#ea580c',                                   light: true  },
  { id: 'system', label: 'System', sidebar: '#1e293b', body: 'linear-gradient(135deg, #f1f5f9 50%, #0f172a 50%)', primary: '#6366f1', light: false },
];

export function EntryThemeSelector() {
  const [open, setOpen]    = useState(false);
  const { theme, setTheme } = useTheme();
  const wrapRef            = useRef<HTMLDivElement>(null);
  const triggerRef         = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown',   onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown',   onKey);
    };
  }, [open, close]);

  return (
    <div ref={wrapRef} className={styles.wrap}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-label="Choose color theme"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <SunMoon size={14} aria-hidden="true" />
        <span className={styles.triggerLabel}>Theme</span>
      </button>

      {open && (
        <div
          className={styles.popover}
          role="listbox"
          aria-label="Select a color theme"
        >
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${styles.card} ${theme === t.id ? styles.cardActive : ''}`}
              role="option"
              aria-selected={theme === t.id}
              aria-label={`${t.label} theme${theme === t.id ? ', currently selected' : ''}`}
              onClick={() => { setTheme(t.id); close(); }}
            >
              <div
                className={styles.swatch}
                style={{ borderColor: t.light ? '#e2e8f0' : 'rgba(255,255,255,0.08)' }}
              >
                <div className={styles.swatchSidebar} style={{ background: t.sidebar }} />
                <div className={styles.swatchBody} style={{ background: t.body }}>
                  <div
                    className={styles.swatchHeader}
                    style={{ background: t.sidebar, opacity: t.light ? 0.7 : 0.85 }}
                  />
                </div>
              </div>
              <div className={styles.meta}>
                <div className={styles.dot} style={{ background: t.primary }} />
                <span className={styles.label}>{t.label}</span>
                {theme === t.id && <Check size={10} className={styles.check} aria-hidden="true" />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
