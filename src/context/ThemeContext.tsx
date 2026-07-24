import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeId = 'windx' | 'purple' | 'light' | 'orange' | 'dark' | 'system';

interface ThemeContextValue {
  theme:    ThemeId;
  setTheme: (t: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme:    'windx',
  setTheme: () => {},
});

const STORAGE_KEY = 'erp-theme';

const VALID: ReadonlySet<string> = new Set(['windx', 'purple', 'light', 'orange', 'dark', 'system']);

function getSavedTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && VALID.has(saved)) return saved as ThemeId;
  } catch { /* localStorage unavailable */ }
  return 'windx';
}

function resolveDataTheme(theme: ThemeId): string {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(getSavedTheme);

  // Apply the CSS data-theme attribute (resolved) and persist the selection
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolveDataTheme(theme));
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* noop */ }
  }, [theme]);

  // Re-resolve when the OS preference changes while system mode is active
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
