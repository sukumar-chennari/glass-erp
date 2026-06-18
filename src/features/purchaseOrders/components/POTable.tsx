import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { PO_STATUS_MAP } from '@/constants/statuses';
import { poStatusKey } from '@/i18n/statusKeys';
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
  const { t } = useTranslation(['purchaseOrders', 'common']);

  const columns: TableColumn<PurchaseOrder>[] = [
    {
      key: 'poNumber',
      header: t('table.poNumber'),
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
      header: t('table.vendor'),
    },
    {
      key: 'items',
      header: t('table.items'),
      align: 'center',
      width: '80px',
      render: (po) => (
        <span className={styles.itemCount}>
          {t('table.itemCount', { count: po.items.length })}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: t('table.totalInclGst'),
      align: 'right',
      width: '150px',
      render: (po) => <span className={styles.amount}>{formatINR(po.totalAmount)}</span>,
    },
    {
      key: 'expectedDeliveryDate',
      header: t('table.expectedBy'),
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
      header: t('table.status'),
      width: '120px',
      render: (po) => (
        <StatusBadge
          status={po.status}
          statusMap={PO_STATUS_MAP}
          getLabel={(s) => t(`status.${poStatusKey(s)}`, { defaultValue: s })}
        />
      ),
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
            aria-label={t('table.aria.edit')}
            onClick={(e) => { e.stopPropagation(); onEdit(po); }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={t('table.aria.delete')}
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
      emptyMessage={t('table.empty')}
    />
  );
}
