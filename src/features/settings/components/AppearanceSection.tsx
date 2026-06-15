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
  id:    ThemeId;
  label: string;
  desc:  string;
  swatch: Swatch;
}

const PRESETS: Preset[] = [
  {
    id:    'purple',
    label: 'Purple',
    desc:  'Dark glassmorphic with deep indigo & violet',
    swatch: {
      sidebar: '#1a1a3e',
      header:  '#0f1b3c',
      body:    '#0a0e27',
      card:    'rgba(255,255,255,0.05)',
      primary: '#6366f1',
    },
  },
  {
    id:    'light',
    label: 'Light',
    desc:  'Clean white surfaces with dark navy sidebar',
    swatch: {
      sidebar: '#1e293b',
      header:  '#ffffff',
      body:    '#f1f5f9',
      card:    '#ffffff',
      primary: '#6366f1',
    },
  },
  {
    id:    'dark',
    label: 'Dark',
    desc:  'Neutral dark slate with softer indigo accents',
    swatch: {
      sidebar: '#1e293b',
      header:  '#0f172a',
      body:    '#0f172a',
      card:    'rgba(255,255,255,0.05)',
      primary: '#818cf8',
    },
  },
  {
    id:    'orange',
    label: 'Orange',
    desc:  'Warm dark theme with energetic orange accents',
    swatch: {
      sidebar: '#2a1200',
      header:  '#1a0800',
      body:    '#150b00',
      card:    'rgba(255,255,255,0.05)',
      primary: '#f97316',
    },
  },
  {
    id:    'system',
    label: 'System',
    desc:  'Follows your device light / dark mode preference',
    swatch: {
      sidebar: '#1e293b',
      header:  '#ffffff',
      body:    'linear-gradient(135deg, #f1f5f9 50%, #0f172a 50%)',
      card:    '#ffffff',
      primary: '#6366f1',
    },
  },
];

const LIGHT_SURFACE_IDS: ReadonlySet<ThemeId> = new Set(['light', 'system']);

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <div className={styles.presetGrid}>
      {PRESETS.map((p) => {
        const isActive    = theme === p.id;
        const cardBorder  = LIGHT_SURFACE_IDS.has(p.id)
          ? '1px solid #e2e8f0'
          : '1px solid rgba(255,255,255,0.08)';

        return (
          <button
            key={p.id}
            type="button"
            className={`${styles.preset} ${isActive ? styles.active : ''}`}
            onClick={() => setTheme(p.id)}
            aria-pressed={isActive}
            aria-label={`Select ${p.label} theme`}
          >
            {isActive && <span className={styles.activeBadge}>✓</span>}

            {/* Visual swatch */}
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

            {/* Primary color dot + label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                className={styles.swatchPrimary}
                style={{ background: p.swatch.primary }}
              />
              <span className={styles.presetLabel}>{p.label}</span>
            </div>

            <p className={styles.presetDesc}>{p.desc}</p>
          </button>
        );
      })}
    </div>
  );
}
