import { Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { INVOICE_STATUS_MAP, INVOICE_STATUS } from '@/constants/statuses';
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
  const today = new Date().toISOString().slice(0, 10);

  const columns: TableColumn<Invoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
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
      header: 'Customer',
      render: (inv) => (
        <div className={styles.nameCell}>
          <span className={styles.customerName}>{inv.customerName ?? '—'}</span>
          <span className={styles.regNo}>{inv.registrationNo}</span>
        </div>
      ),
    },
    {
      key: 'vehicleName',
      header: 'Vehicle',
    },
    {
      key: 'paymentType',
      header: 'Payment',
      width: '110px',
    },
    {
      key: 'totalAmount',
      header: 'Total',
      align: 'right',
      width: '120px',
      render: (inv) => <span className={styles.amount}>{formatINR(inv.totalAmount)}</span>,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
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
      header: 'Status',
      width: '110px',
      render: (inv) => <StatusBadge status={inv.status} statusMap={INVOICE_STATUS_MAP} />,
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
            aria-label="Edit invoice"
            onClick={(e) => { e.stopPropagation(); onEdit(inv); }}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Delete invoice"
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
      emptyMessage="No invoices yet. Create your first invoice."
    />
  );
}
