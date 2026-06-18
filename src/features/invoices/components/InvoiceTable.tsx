import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { INVOICE_STATUS_MAP, INVOICE_STATUS } from '@/constants/statuses';
import { invoiceStatusKey, paymentTypeKey } from '@/i18n/statusKeys';
import { formatINR } from '@/services/mockUtils';
import type { TableColumn } from '@/types/ui';
import type { Invoice } from '@/types/models/invoice';
import styles from './InvoiceTable.module.css';

interface InvoiceTableProps {
  invoices:  Invoice[];
  isLoading: boolean;
  onEdit:    (invoice: Invoice) => void;
  onDelete:  (id: string) => void;
}

export function InvoiceTable({ invoices, isLoading, onEdit, onDelete }: InvoiceTableProps) {
  const { t } = useTranslation(['invoices', 'common']);
  const today = new Date().toISOString().slice(0, 10);

  const columns: TableColumn<Invoice>[] = [
    {
      key: 'invoiceNumber',
      header: t('table.invoiceNo'),
      width: '150px',
      render: (inv) => (
        <div>
          <div className={styles.invoiceNumber}>{inv.invoiceNumber}</div>
          <div className={styles.date}>
            {new Date(inv.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          </div>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: t('table.customer'),
      render: (inv) => (
        <div className={styles.nameCell}>
          <span className={styles.customerName}>{inv.customerName ?? '—'}</span>
          <span className={styles.regNo}>{inv.registrationNo}</span>
        </div>
      ),
    },
    {
      key: 'vehicleName',
      header: t('table.vehicle'),
    },
    {
      key: 'paymentType',
      header: t('table.payment'),
      width: '110px',
      render: (inv) => t(`paymentTypes.${paymentTypeKey(inv.paymentType)}`, { ns: 'jobs', defaultValue: inv.paymentType }),
    },
    {
      key: 'totalAmount',
      header: t('table.total'),
      align: 'right',
      width: '120px',
      render: (inv) => <span className={styles.amount}>{formatINR(inv.totalAmount)}</span>,
    },
    {
      key: 'dueDate',
      header: t('table.dueDate'),
      width: '110px',
      render: (inv) => {
        if (!inv.dueDate) return '—';
        const isOverdue = inv.status !== INVOICE_STATUS.PAID && inv.dueDate < today;
        return (
          <span className={isOverdue ? styles.overdue : undefined}>
            {new Date(inv.dueDate).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: t('table.status'),
      width: '110px',
      render: (inv) => (
        <StatusBadge
          status={inv.status}
          statusMap={INVOICE_STATUS_MAP}
          getLabel={(s) => t(`status.${invoiceStatusKey(s)}`, { defaultValue: s })}
        />
      ),
    },
    {
      key: 'id',
      header: '',
      width: '90px',
      align: 'right',
      render: (inv) => (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={t('table.aria.edit')}
            onClick={(e) => { e.stopPropagation(); onEdit(inv); }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={t('table.aria.delete')}
            onClick={(e) => { e.stopPropagation(); onDelete(inv.id); }}
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
      data={invoices}
      isLoading={isLoading}
      emptyMessage={t('table.empty')}
    />
  );
}
