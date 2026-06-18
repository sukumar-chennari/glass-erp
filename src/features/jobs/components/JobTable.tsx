import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { JOB_STATUS_MAP } from '@/constants/statuses';
import { jobStatusKey, paymentTypeKey } from '@/i18n/statusKeys';
import { formatINR } from '@/services/mockUtils';
import type { TableColumn } from '@/types/ui';
import type { Job } from '@/types/models/job';
import styles from './JobTable.module.css';

interface JobTableProps {
  jobs:      Job[];
  isLoading: boolean;
  onEdit:    (job: Job) => void;
  onDelete:  (id: string) => void;
}

export function JobTable({ jobs, isLoading, onEdit, onDelete }: JobTableProps) {
  const { t } = useTranslation(['jobs', 'common']);

  const columns: TableColumn<Job>[] = [
    {
      key: 'jobNumber',
      header: t('table.jobNo'),
      width: '140px',
      render: (j) => <span className={styles.jobNumber}>{j.jobNumber}</span>,
    },
    {
      key: 'customerName',
      header: t('table.customer'),
      render: (j) => (
        <div className={styles.nameCell}>
          <span className={styles.customerName}>{j.customerName ?? '—'}</span>
          <span className={styles.regNo}>{j.registrationNo}</span>
        </div>
      ),
    },
    {
      key: 'vehicleName',
      header: t('table.vehicle'),
      render: (j) => (
        <div className={styles.vehicleCell}>
          <span className={styles.vehicleName}>{j.vehicleName}</span>
          <span className={styles.position}>{j.glassPosition} — {j.damageType}</span>
        </div>
      ),
    },
    {
      key: 'technicianName',
      header: t('table.technician'),
      render: (j) => j.technicianName ?? '—',
    },
    {
      key: 'paymentType',
      header: t('table.payment'),
      width: '100px',
      render: (j) => t(`paymentTypes.${paymentTypeKey(j.paymentType)}`, { defaultValue: j.paymentType }),
    },
    {
      key: 'estimatedCost',
      header: t('table.estimatedCost'),
      align: 'right',
      width: '110px',
      render: (j) => j.estimatedCost != null
        ? <span className={styles.amount}>{formatINR(j.estimatedCost)}</span>
        : '—',
    },
    {
      key: 'scheduledDate',
      header: t('table.scheduled'),
      width: '110px',
      render: (j) =>
        new Date(j.scheduledDate).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
        }),
    },
    {
      key: 'status',
      header: t('table.status'),
      width: '120px',
      render: (j) => (
        <StatusBadge
          status={j.status}
          statusMap={JOB_STATUS_MAP}
          getLabel={(s) => t(`status.${jobStatusKey(s)}`, { defaultValue: s })}
        />
      ),
    },
    {
      key: 'id',
      header: '',
      width: '90px',
      align: 'right',
      render: (j) => (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={t('table.aria.edit')}
            onClick={(e) => { e.stopPropagation(); onEdit(j); }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={t('table.aria.delete')}
            onClick={(e) => { e.stopPropagation(); onDelete(j.id); }}
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
      data={jobs}
      isLoading={isLoading}
      emptyMessage={t('table.empty')}
    />
  );
}
