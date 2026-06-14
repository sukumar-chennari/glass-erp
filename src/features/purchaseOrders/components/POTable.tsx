import { Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { PO_STATUS_MAP } from '@/constants/statuses';
import { formatINR } from '@/services/mockUtils';
import type { TableColumn } from '@/types/ui';
import type { PurchaseOrder } from '@/types/models/purchaseOrder';
import styles from './POTable.module.css';

interface POTableProps {
  orders:    PurchaseOrder[];
  isLoading: boolean;
  onEdit:    (po: PurchaseOrder) => void;
  onDelete:  (id: string) => void;
}

export function POTable({ orders, isLoading, onEdit, onDelete }: POTableProps) {
  const columns: TableColumn<PurchaseOrder>[] = [
    {
      key: 'poNumber',
      header: 'PO Number',
      width: '140px',
      render: (po) => (
        <div>
          <div className={styles.poNumber}>{po.poNumber}</div>
          <div className={styles.date}>
            {new Date(po.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          </div>
        </div>
      ),
    },
    {
      key: 'vendorName',
      header: 'Vendor',
    },
    {
      key: 'items',
      header: 'Items',
      align: 'center',
      width: '80px',
      render: (po) => (
        <span className={styles.itemCount}>
          {po.items.length} item{po.items.length !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total (incl. GST)',
      align: 'right',
      width: '150px',
      render: (po) => <span className={styles.amount}>{formatINR(po.totalAmount)}</span>,
    },
    {
      key: 'expectedDeliveryDate',
      header: 'Expected By',
      width: '120px',
      render: (po) =>
        po.expectedDeliveryDate
          ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
            })
          : '—',
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (po) => <StatusBadge status={po.status} statusMap={PO_STATUS_MAP} />,
    },
    {
      key: 'id',
      header: '',
      width: '90px',
      align: 'right',
      render: (po) => (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Edit order"
            onClick={(e) => { e.stopPropagation(); onEdit(po); }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Delete order"
            onClick={(e) => { e.stopPropagation(); onDelete(po.id); }}
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
      data={orders}
      isLoading={isLoading}
      emptyMessage="No purchase orders yet. Create your first order."
    />
  );
}
