import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { TECH_STATUS_MAP } from '@/constants/statuses';
import { techStatusKey } from '@/i18n/statusKeys';
import type { TableColumn } from '@/types/ui';
import type { Technician } from '@/types/models/technician';
import styles from './TechnicianTable.module.css';

interface TechnicianTableProps {
  technicians: Technician[];
  isLoading:   boolean;
  onEdit:      (technician: Technician) => void;
  onDelete:    (id: string) => void;
}

export function TechnicianTable({ technicians, isLoading, onEdit, onDelete }: TechnicianTableProps) {
  const { t } = useTranslation(['technicians', 'common']);

  const columns: TableColumn<Technician>[] = [
    {
      key: 'name',
      header: t('table.technician'),
      render: (tech) => (
        <div className={styles.nameCell}>
          <span className={styles.techName}>{tech.name}</span>
          {tech.email && <span className={styles.email}>{tech.email}</span>}
        </div>
      ),
    },
    {
      key: 'phone',
      header: t('table.phone'),
      width: '130px',
    },
    {
      key: 'specialization',
      header: t('table.specialization'),
      render: (tech) => tech.specialization ?? '—',
    },
    {
      key: 'yearsExperience',
      header: t('table.experience'),
      align: 'center',
      width: '110px',
      render: (tech) =>
        tech.yearsExperience != null
          ? t('table.experience', { count: tech.yearsExperience })
          : '—',
    },
    {
      key: 'assignedJobs',
      header: t('table.jobsHeader'),
      align: 'center',
      width: '140px',
      render: (tech) => (
        <div className={styles.statCell}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{tech.assignedJobs}</span>
            <span className={styles.statLabel}>{t('table.jobs.active')}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{tech.completedJobs}</span>
            <span className={styles.statLabel}>{t('table.jobs.done')}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: t('table.status'),
      width: '110px',
      render: (tech) => (
        <StatusBadge
          status={tech.status}
          statusMap={TECH_STATUS_MAP}
          getLabel={(s) => t(`status.${techStatusKey(s)}`, { defaultValue: s })}
        />
      ),
    },
    {
      key: 'id',
      header: '',
      width: '90px',
      align: 'right',
      render: (tech) => (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={t('table.aria.edit')}
            onClick={(e) => { e.stopPropagation(); onEdit(tech); }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={t('table.aria.delete')}
            onClick={(e) => { e.stopPropagation(); onDelete(tech.id); }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={technicians}
      isLoading={isLoading}
      emptyMessage={t('table.empty')}
    />
  );
}
