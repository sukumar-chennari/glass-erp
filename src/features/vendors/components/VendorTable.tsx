import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { VENDOR_STATUS_MAP } from '@/constants/statuses';
import { vendorStatusKey } from '@/i18n/statusKeys';
import type { TableColumn } from '@/types/ui';
import type { Vendor } from '@/types/models/vendor';
import styles from './VendorTable.module.css';

interface VendorTableProps {
  vendors:   Vendor[];
  isLoading: boolean;
  onEdit:    (vendor: Vendor) => void;
  onDelete:  (id: string) => void;
}

export function VendorTable({ vendors, isLoading, onEdit, onDelete }: VendorTableProps) {
  const { t } = useTranslation(['vendors', 'common']);

  const columns: TableColumn<Vendor>[] = [
    {
      key: 'companyName',
      header: t('table.company'),
      render: (v) => (
        <div className={styles.nameCell}>
          <span className={styles.companyName}>{v.companyName}</span>
          <span className={styles.contactPerson}>{v.contactPerson}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: t('table.contact'),
      render: (v) => (
        <div className={styles.contactCell}>
          <span className={styles.phone}>{v.phone}</span>
          {v.email && <span className={styles.email}>{v.email}</span>}
        </div>
      ),
    },
    {
      key: 'gstNumber',
      header: t('table.gst'),
      width: '160px',
    },
    {
      key: 'city',
      header: t('table.location'),
      render: (v) => `${v.city}${v.state ? `, ${v.state}` : ''}`,
    },
    {
      key: 'productsSupplied',
      header: t('table.products'),
      render: (v) =>
        v.productsSupplied && v.productsSupplied.length > 0 ? (
          <div className={styles.tags}>
            {v.productsSupplied.map((p) => (
              <span key={p} className={styles.tag}>{p}</span>
            ))}
          </div>
        ) : (
          <span>—</span>
        ),
    },
    {
      key: 'status',
      header: t('table.status'),
      width: '110px',
      render: (v) => (
        <StatusBadge
          status={v.status}
          statusMap={VENDOR_STATUS_MAP}
          getLabel={(s) => t(`status.${vendorStatusKey(s)}`, { defaultValue: s })}
        />
      ),
    },
    {
      key: 'id',
      header: '',
      width: '90px',
      align: 'right',
      render: (v) => (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={t('table.aria.edit')}
            onClick={(e) => { e.stopPropagation(); onEdit(v); }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={t('table.aria.delete')}
            onClick={(e) => { e.stopPropagation(); onDelete(v.id); }}
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
      data={vendors}
      isLoading={isLoading}
      emptyMessage={t('table.empty')}
    />
  );
}
