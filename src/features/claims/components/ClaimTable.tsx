import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { CLAIM_STATUS_MAP } from '@/constants/statuses';
import { claimStatusKey, glassPositionKey } from '@/i18n/statusKeys';
import { formatINR } from '@/services/mockUtils';
import type { TableColumn } from '@/types/ui';
import type { Claim } from '@/types/models/claim';
import styles from './ClaimTable.module.css';

interface ClaimTableProps {
  claims:    Claim[];
  isLoading: boolean;
  onEdit:    (claim: Claim) => void;
  onDelete:  (id: string) => void;
}

export function ClaimTable({ claims, isLoading, onEdit, onDelete }: ClaimTableProps) {
  const { t } = useTranslation(['claims', 'common']);

  const columns: TableColumn<Claim>[] = [
    {
      key: 'claimNumber',
      header: t('table.claimNo'),
      width: '155px',
      render: (c) => (
        <div>
          <div className={styles.claimNumber}>{c.claimNumber}</div>
          <div className={styles.date}>
            {new Date(c.submittedAt).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          </div>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: t('table.customer'),
      render: (c) => (
        <div className={styles.nameCell}>
          <span className={styles.customerName}>{c.customerName ?? '—'}</span>
          <span className={styles.regNo}>{c.registrationNo}</span>
        </div>
      ),
    },
    {
      key: 'insurer',
      header: t('table.insurer'),
    },
    {
      key: 'glassPosition',
      header: t('table.glass'),
      width: '150px',
      render: (c) => t(`glassPositions.${glassPositionKey(c.glassPosition)}`, { defaultValue: c.glassPosition }),
    },
    {
      key: 'claimedAmount',
      header: t('table.amount'),
      align: 'right',
      width: '140px',
      render: (c) => (
        <div className={styles.amountCell}>
          <span className={styles.claimedAmount}>{t('table.claimedLine', { amount: formatINR(c.claimedAmount) })}</span>
          {c.approvedAmount > 0 && (
            <span className={styles.approvedAmount}>{t('table.approvedLine', { amount: formatINR(c.approvedAmount) })}</span>
          )}
          {c.customerBalance > 0 && (
            <span className={styles.balance}>{t('table.balanceLine', { amount: formatINR(c.customerBalance) })}</span>
          )}
        </div>
      ),
    },
    {
      key: 'submittedAt',
      header: t('table.daysPending'),
      align: 'center',
      width: '110px',
      render: (c) => {
        const days = Math.floor(
          (Date.now() - new Date(c.submittedAt).getTime()) / (1000 * 60 * 60 * 24),
        );
        return (
          <span className={`${styles.days} ${days > 7 ? styles.daysAlert : ''}`}>
            {t('table.daysUnit', { count: days })}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: t('table.status'),
      width: '120px',
      render: (c) => (
        <StatusBadge
          status={c.status}
          statusMap={CLAIM_STATUS_MAP}
          getLabel={(s) => t(`status.${claimStatusKey(s)}`, { defaultValue: s })}
        />
      ),
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
      data={claims}
      isLoading={isLoading}
      emptyMessage={t('table.empty')}
    />
  );
}
