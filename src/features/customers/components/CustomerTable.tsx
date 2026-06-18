import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import type { TableColumn } from '@/types/ui';
import type { Customer } from '@/types/models/customer';
import styles from './CustomerTable.module.css';

interface CustomerTableProps {
  customers: Customer[];
  isLoading: boolean;
  onEdit:    (customer: Customer) => void;
  onDelete:  (id: string) => void;
}

export function CustomerTable({ customers, isLoading, onEdit, onDelete }: CustomerTableProps) {
  const { t } = useTranslation(['customers', 'common']);

  const columns: TableColumn<Customer>[] = [
    {
      key: 'name',
      header: t('table.customer'),
      render: (c) => (
        <div className={styles.nameCell}>
          <span className={styles.customerName}>{c.name}</span>
          {c.email && <span className={styles.email}>{c.email}</span>}
        </div>
      ),
    },
    {
      key: 'phone',
      header: t('table.phone'),
      width: '130px',
    },
    {
      key: 'city',
      header: t('table.city'),
      width: '130px',
      render: (c) => c.city ?? '—',
    },
    {
      key: 'vehicles',
      header: t('table.vehicles'),
      render: (c) => (
        <div className={styles.vehicleList}>
          {c.vehicles.map((v) => (
            <div key={v.id}>
              <div className={styles.vehicle}>{v.make} {v.model} ({v.year})</div>
              <div className={styles.regNo}>{v.registrationNo}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'totalJobs',
      header: t('table.jobs'),
      align: 'center',
      width: '80px',
      render: (c) => <span className={styles.jobCount}>{c.totalJobs}</span>,
    },
    {
      key: 'createdAt',
      header: t('table.joined'),
      width: '110px',
      render: (c) =>
        new Date(c.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
        }),
    },
    {
      key: 'id',
      header: '',
      width: '90px',
      align: 'right',
      render: (c) => (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={t('table.aria.edit')}
            onClick={(e) => { e.stopPropagation(); onEdit(c); }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={t('table.aria.delete')}
            onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
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
      data={customers}
      isLoading={isLoading}
      emptyMessage={t('table.empty')}
    />
  );
}
