import { Package, MapPin } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { STOCK_STATUS_MAP, STOCK_STATUS } from '@/constants/statuses';
import { useGetStockQuery } from '@/features/stock/services/stockApi';
import styles from './StockAvailabilityPanel.module.css';

interface Props {
  vehicleModel:  string;
  glassPosition: string;
}

export function StockAvailabilityPanel({ vehicleModel, glassPosition }: Props) {
  const { data: stock = [] } = useGetStockQuery();

  if (!glassPosition) return null;

  const vLower = vehicleModel.toLowerCase();

  // Priority 1: glassPosition + vehicle name fuzzy match
  const byVehicle = stock.find((s) => {
    if (s.glassPosition !== glassPosition) return false;
    const makeWords  = s.vehicleMake.toLowerCase().split(/\s+/);
    const modelWords = s.vehicleModel.toLowerCase().split(/\s+/);
    return (
      makeWords.some((w)  => vLower.includes(w)) ||
      modelWords.some((w) => vLower.includes(w))
    );
  });

  // Priority 2: glassPosition match only
  const byPosition = byVehicle ? null : stock.find((s) => s.glassPosition === glassPosition);

  const match = byVehicle ?? byPosition;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Package size={12} />
        Stock Availability
      </div>

      {match ? (
        <div className={styles.content}>
          <div className={styles.nameRow}>
            <span className={styles.productName}>{match.productName}</span>
            {!byVehicle && (
              <span className={styles.approx}>(nearest match)</span>
            )}
          </div>
          <div className={styles.row}>
            <StatusBadge status={match.stockStatus} statusMap={STOCK_STATUS_MAP} size="sm" />
            <span className={styles.qty}>
              {match.currentQty} {match.currentQty === 1 ? 'unit' : 'units'} at this branch
            </span>
          </div>
          {match.stockStatus === STOCK_STATUS.OUT_OF_STOCK && (
            <div className={styles.branchNote}>
              <MapPin size={11} />
              East Branch may have stock — check before ordering
            </div>
          )}
        </div>
      ) : (
        <div className={styles.noMatch}>
          No stock entry found — may need to source from supplier
        </div>
      )}
    </div>
  );
}
