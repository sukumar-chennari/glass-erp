import * as LucideIcons from 'lucide-react';
import type { KpiCardConfig } from '@/types/ui';
import styles from './KpiCard.module.css';

const VARIANT_CLASS: Record<KpiCardConfig['variant'], string> = {
  primary: styles.variantPrimary,
  accent:  styles.variantAccent,
  success: styles.variantSuccess,
  warning: styles.variantWarning,
  danger:  styles.variantDanger,
  info:    styles.variantInfo,
  neutral: styles.variantNeutral,
};

interface KpiCardProps {
  kpi: KpiCardConfig;
}

export function KpiCard({ kpi }: KpiCardProps) {
  // Resolve lucide icon by name string
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[kpi.icon];

  return (
    <div className={`${styles.card} ${VARIANT_CLASS[kpi.variant]}`}>
      <div className={styles.iconBox}>
        {IconComponent ? <IconComponent size={24} /> : null}
      </div>

      <div className={styles.content}>
        <div className={styles.label}>{kpi.label}</div>
        <div className={styles.value}>{kpi.value}</div>
        {kpi.change && (
          <div
            className={`${styles.change} ${
              kpi.trend === 'up' ? styles.trendUp : kpi.trend === 'down' ? styles.trendDown : ''
            }`}
          >
            {kpi.change}
          </div>
        )}
      </div>
    </div>
  );
}
