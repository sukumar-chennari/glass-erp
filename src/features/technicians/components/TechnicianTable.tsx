import { Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { TECH_STATUS_MAP } from '@/constants/statuses';
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
  const columns: TableColumn<Technician>[] = [
    {
      key: 'name',
      header: 'Technician',
      render: (t) => (
        <div className={styles.nameCell}>
          <span className={styles.techName}>{t.name}</span>
          {t.email && <span className={styles.email}>{t.email}</span>}
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      width: '130px',
    },
    {
      key: 'specialization',
      header: 'Specialization',
      render: (t) => t.specialization ?? '—',
    },
    {
      key: 'yearsExperience',
      header: 'Experience',
      align: 'center',
      width: '110px',
      render: (t) =>
        t.yearsExperience != null ? `${t.yearsExperience} yr${t.yearsExperience !== 1 ? 's' : ''}` : '—',
    },
    {
      key: 'assignedJobs',
      header: 'Jobs',
      align: 'center',
      width: '140px',
      render: (t) => (
        <div className={styles.statCell}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{t.assignedJobs}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{t.completedJobs}</span>
            <span className={styles.statLabel}>Done</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (t) => <StatusBadge status={t.status} statusMap={TECH_STATUS_MAP} />,
    },
    {
      key: 'id',
      header: '',
      width: '90px',
      align: 'right',
      render: (t) => (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Edit technician"
            onClick={(e) => { e.stopPropagation(); onEdit(t); }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Delete technician"
            onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
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
      emptyMessage="No technicians yet. Add your first team member."
    />
  );
}
