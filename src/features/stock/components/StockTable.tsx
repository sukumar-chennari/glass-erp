import { useTranslation } from 'react-i18next';
import { PackagePlus } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { STOCK_STATUS_MAP, STOCK_STATUS } from '@/constants/statuses';
import { stockStatusKey, glassPositionKey } from '@/i18n/statusKeys';
import { formatINR } from '@/services/mockUtils';
import type { TableColumn } from '@/types/ui';
import type { StockEntry } from '@/types/models/stock';
import styles from './StockTable.module.css';

interface StockTableProps {
  entries:   StockEntry[];
  isLoading: boolean;
  onAdjust:  (entry: StockEntry) => void;
}

export function StockTable({ entries, isLoading, onAdjust }: StockTableProps) {
  const { t } = useTranslation(['stock', 'common']);

  const columns: TableColumn<StockEntry>[] = [
    {
      key: 'productName',
      header: t('table.product'),
      render: (s) => (
        <div className={styles.nameCell}>
          <span className={styles.productName}>{s.productName}</span>
          {s.sku && <span className={styles.sku}>{s.sku}</span>}
        </div>
      ),
    },
    {
      key: 'vehicleMake',
      header: t('table.vehicle'),
      render: (s) => `${s.vehicleMake} ${s.vehicleModel}`,
    },
    {
      key: 'glassPosition',
      header: t('table.position'),
      width: '160px',
      render: (s) => t(`glassPositions.${glassPositionKey(s.glassPosition)}`, { defaultValue: s.glassPosition }),
    },
    {
      key: 'vendorName',
      header: t('table.vendor'),
      render: (s) => s.vendorName ?? '—',
    },
    {
      key: 'unitCost',
      header: t('table.unitCost'),
      align: 'right',
      width: '110px',
      render: (s) => s.unitCost != null ? formatINR(s.unitCost) : '—',
    },
    {
      key: 'currentQty',
      header: t('table.qty'),
      align: 'center',
      width: '120px',
      render: (s) => (
        <div className={styles.qtyCell}>
          <span
            className={`${styles.qty} ${
              s.stockStatus === STOCK_STATUS.OUT_OF_STOCK
                ? styles.qtyOut
                : s.stockStatus === STOCK_STATUS.LOW_STOCK
                ? styles.qtyLow
                : ''
            }`}
          >
            {s.currentQty}
          </span>
          <span className={styles.threshold}>
            {t('table.threshold', { threshold: s.lowStockThreshold })}
          </span>
        </div>
      ),
    },
    {
      key: 'stockStatus',
      header: t('table.status'),
      width: '120px',
      render: (entry) => (
        <StatusBadge
          status={entry.stockStatus}
          statusMap={STOCK_STATUS_MAP}
          getLabel={(s) => t(`status.${stockStatusKey(s)}`, { defaultValue: s })}
        />
      ),
    },
    {
      key: 'lastUpdated',
      header: t('table.updated'),
      width: '110px',
      render: (s) => (
        <span className={styles.updated}>
          {new Date(s.lastUpdated).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short',
          })}
        </span>
      ),
    },
    {
      key: 'id',
      header: '',
      width: '60px',
      align: 'right',
      render: (s) => (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={t('table.aria.adjust')}
            onClick={(e) => { e.stopPropagation(); onAdjust(s); }}
          >
            <PackagePlus size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={entries}
      isLoading={isLoading}
      emptyMessage={t('table.empty')}
    />
  );
}
