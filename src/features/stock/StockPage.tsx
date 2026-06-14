import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { useToast } from '@/components/ui/Toast';
import { StockTable } from './components/StockTable';
import { AdjustStockModal } from './components/AdjustStockModal';
import { useGetStockQuery, useAdjustStockMutation } from './services/stockApi';
import { STOCK_STATUS } from '@/constants/statuses';
import type { StockEntry, AdjustStockDto } from '@/types/models/stock';
import styles from './StockPage.module.css';

export function StockPage() {
  const { data: entries = [], isLoading } = useGetStockQuery();
  const [adjustStock, { isLoading: adjusting }] = useAdjustStockMutation();
  const toast = useToast();

  const [modalOpen, setModalOpen]     = useState(false);
  const [adjustEntry, setAdjustEntry] = useState<StockEntry | null>(null);

  const alertCount = entries.filter(
    (s) => s.stockStatus === STOCK_STATUS.LOW_STOCK || s.stockStatus === STOCK_STATUS.OUT_OF_STOCK,
  ).length;

  const openAdjust = (entry: StockEntry) => { setAdjustEntry(entry); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setAdjustEntry(null); };

  const handleAdjust = async (dto: AdjustStockDto) => {
    try {
      await adjustStock(dto).unwrap();
      toast.success('Stock adjusted');
      closeModal();
    } catch {
      toast.error('Failed to adjust stock');
    }
  };

  return (
    <PageShell
      heading="Stock Management"
      description="Live inventory view with quick adjustments."
    >
      <SectionCard>
        <div className={styles.tableHeader}>
          <div className={styles.headerLeft}>
            <span className={styles.count}>
              {isLoading ? 'Loading…' : `${entries.length} SKU${entries.length !== 1 ? 's' : ''}`}
            </span>
            {!isLoading && alertCount > 0 && (
              <span className={styles.alertBadge}>
                <AlertTriangle size={12} />
                {alertCount} low / out of stock
              </span>
            )}
          </div>
        </div>

        <StockTable
          entries={entries}
          isLoading={isLoading}
          onAdjust={openAdjust}
        />
      </SectionCard>

      <AdjustStockModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleAdjust}
        entry={adjustEntry}
        isSubmitting={adjusting}
      />
    </PageShell>
  );
}
