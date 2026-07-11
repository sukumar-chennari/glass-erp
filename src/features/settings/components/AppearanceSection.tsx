import { useTranslation } from 'react-i18next';
import { useTheme, type ThemeId } from '@/context/ThemeContext';
import styles from './AppearanceSection.module.css';

interface Swatch {
  sidebar: string;
  header:  string;
  body:    string;
  card:    string;
  primary: string;
}

interface Preset {
  id:     ThemeId;
  swatch: Swatch;
}

const PRESETS: Preset[] = [
  {
    id: 'purple',
    swatch: { sidebar: '#1a1a3e', header: '#0f1b3c', body: '#0a0e27', card: 'rgba(255,255,255,0.05)', primary: '#6366f1' },
  },
  {
    id: 'light',
    swatch: { sidebar: '#ffffff', header: '#ffffff', body: '#f1f5f9', card: '#ffffff', primary: '#6366f1' },
  },
  {
    id: 'dark',
    swatch: { sidebar: '#1e293b', header: '#0f172a', body: '#0f172a', card: 'rgba(255,255,255,0.05)', primary: '#818cf8' },
  },
  {
    id: 'orange',
    swatch: { sidebar: '#fffdf7', header: '#ffffff', body: '#fffdf7', card: '#ffffff', primary: '#ea580c' },
  },
  {
    id: 'system',
    swatch: { sidebar: '#1e293b', header: '#ffffff', body: 'linear-gradient(135deg, #f1f5f9 50%, #0f172a 50%)', card: '#ffffff', primary: '#6366f1' },
  },
];

const LIGHT_SURFACE_IDS: ReadonlySet<ThemeId> = new Set(['light', 'orange', 'system']);

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation('settings');

  return (
    <div className={styles.presetGrid}>
      {PRESETS.map((p) => {
        const isActive    = theme === p.id;
        const cardBorder  = LIGHT_SURFACE_IDS.has(p.id)
          ? '1px solid #e2e8f0'
          : '1px solid rgba(255,255,255,0.08)';
        const label = t(`appearance.themes.${p.id}`);

        return (
          <button
            key={p.id}
            type="button"
            className={`${styles.preset} ${isActive ? styles.active : ''}`}
            onClick={() => setTheme(p.id)}
            aria-pressed={isActive}
            aria-label={t('appearance.aria', { label })}
          >
            {isActive && <span className={styles.activeBadge}>✓</span>}

            <div className={styles.swatches}>
              <div
                className={styles.swatchSidebar}
                style={{ background: p.swatch.sidebar }}
              />
              <div
                className={styles.swatchBody}
                style={{ background: p.swatch.body }}
              >
                <div
                  className={styles.swatchHeader}
                  style={{ background: p.swatch.header }}
                />
                <div
                  className={styles.swatchCard1}
                  style={{ background: p.swatch.card, border: cardBorder }}
                />
                <div
                  className={styles.swatchCard2}
                  style={{ background: p.swatch.card, border: cardBorder }}
                />
              </div>
            </div>

            <div className={styles.presetMeta}>
              <div
                className={styles.swatchPrimary}
                style={{ background: p.swatch.primary }}
              />
              <span className={styles.presetLabel}>{label}</span>
            </div>

            <p className={styles.presetDesc}>{t(`appearance.descs.${p.id}`)}</p>
          </button>
        );
      })}
    </div>
  );
}
