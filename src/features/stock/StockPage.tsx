import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['stock', 'common']);

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
      toast.success(t('messages.adjusted'));
      closeModal();
    } catch {
      toast.error(t('messages.adjustFailed'));
    }
  };

  return (
    <PageShell
      heading={t('title')}
      description={t('description')}
    >
      <SectionCard>
        <div className={styles.tableHeader}>
          <div className={styles.headerLeft}>
            <span className={styles.count}>
              {isLoading ? t('table.loading') : t('count', { count: entries.length })}
            </span>
            {!isLoading && alertCount > 0 && (
              <span className={styles.alertBadge}>
                <AlertTriangle size={12} />
                {t('alert', { count: alertCount })}
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
