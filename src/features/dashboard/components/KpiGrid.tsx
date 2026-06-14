import { KpiCard }  from '@/components/ui/KpiCard';
import type { DashboardKpi } from '@/types/models/dashboard';
import styles from './KpiGrid.module.css';

interface KpiGridProps {
  kpis:      DashboardKpi[];
  isLoading: boolean;
}

export function KpiGrid({ kpis, isLoading }: KpiGridProps) {
  if (isLoading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
