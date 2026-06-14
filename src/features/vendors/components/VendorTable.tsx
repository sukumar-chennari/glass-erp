import { Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { VENDOR_STATUS_MAP } from '@/constants/statuses';
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
  const columns: TableColumn<Vendor>[] = [
    {
      key: 'companyName',
      header: 'Vendor',
      render: (v) => (
        <div className={styles.nameCell}>
          <span className={styles.companyName}>{v.companyName}</span>
          <span className={styles.contactPerson}>{v.contactPerson}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Contact',
      render: (v) => (
        <div className={styles.contactCell}>
          <span className={styles.phone}>{v.phone}</span>
          {v.email && <span className={styles.email}>{v.email}</span>}
        </div>
      ),
    },
    {
      key: 'gstNumber',
      header: 'GST Number',
      width: '160px',
    },
    {
      key: 'city',
      header: 'Location',
      render: (v) => `${v.city}${v.state ? `, ${v.state}` : ''}`,
    },
    {
      key: 'productsSupplied',
      header: 'Supplies',
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
      header: 'Status',
      width: '110px',
      render: (v) => <StatusBadge status={v.status} statusMap={VENDOR_STATUS_MAP} />,
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
            aria-label="Edit vendor"
            onClick={(e) => { e.stopPropagation(); onEdit(v); }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Delete vendor"
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
      emptyMessage="No vendors found. Add your first supplier."
    />
  );
}
