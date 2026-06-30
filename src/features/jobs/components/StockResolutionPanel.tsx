import { useState } from 'react';
import { PackageSearch, ArrowRightLeft, ShoppingCart, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useUpdateJobMutation } from '@/features/jobs/services/jobsApi';
import { useGetStockQuery } from '@/features/stock/services/stockApi';
import { JOB_STATUS } from '@/constants/statuses';
import type { Job, StockResolution, StockResolutionState } from '@/types/models/job';
import styles from './StockResolutionPanel.module.css';

interface Props {
  job:           Job;
  glassPosition: string;
  vehicleModel:  string;
}

const RESOLUTION_OPTIONS: Array<{
  state: StockResolutionState;
  label: string;
  sub:   string;
  icon:  typeof ArrowRightLeft;
  note:  string;
}> = [
  {
    state: 'transfer_requested',
    label: 'Transfer from East Branch',
    sub:   'Request stock from the nearest branch with availability',
    icon:  ArrowRightLeft,
    note:  'Requested stock transfer from East Branch',
  },
  {
    state: 'vendor_ordered',
    label: 'Order from Vendor',
    sub:   'Raise procurement order — estimated 2–3 business days',
    icon:  ShoppingCart,
    note:  'Raised vendor procurement order',
  },
  {
    state: 'branch_reassigned',
    label: 'Reassign to Nearest Branch',
    sub:   'Redirect customer to a branch with available stock',
    icon:  Building2,
    note:  'Customer redirected to branch with available stock',
  },
];

export function StockResolutionPanel({ job, glassPosition, vehicleModel }: Props) {
  const { data: stock = [] } = useGetStockQuery();
  const [updateJob, { isLoading }] = useUpdateJobMutation();
  const toast = useToast();

  const [local, setLocal] = useState<StockResolution | null>(job.stockResolution ?? null);

  // Fuzzy-check if the selected glass position is out of stock for this vehicle
  const matchedItem = stock.find((s: { glassPosition: string; vehicleMake: string; vehicleModel: string; stockStatus: string }) => {
    if (s.glassPosition !== glassPosition) return false;
    const model = vehicleModel.toLowerCase();
    return (
      s.vehicleMake.toLowerCase().split(' ').some((w: string) => model.includes(w)) ||
      s.vehicleModel.toLowerCase().split(' ').some((w: string) => model.includes(w))
    );
  });

  const isOutOfStock = matchedItem?.stockStatus === 'Out of Stock';

  // Only render if out of stock OR a resolution has already been set
  if (!isOutOfStock && !local) return null;

  async function resolve(state: StockResolutionState, note: string) {
    const resolution: StockResolution = { state, note, updatedAt: new Date().toISOString() };
    setLocal(resolution);
    try {
      await updateJob({
        id: job.id,
        stockResolution: resolution,
        status: JOB_STATUS.ON_HOLD,
      }).unwrap();
      toast.success(`Stock action: ${note}`);
    } catch {
      toast.error('Failed to record stock resolution.');
      setLocal(job.stockResolution ?? null);
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>
        <PackageSearch size={14} />
        Stock Resolution
      </div>

      {isOutOfStock && !local && (
        <div className={styles.alert}>
          No <strong>{glassPosition}</strong> found for this vehicle model.
          Select a resolution to put the job on hold and record the action taken.
        </div>
      )}

      {local ? (
        <div className={styles.resolved}>
          <CheckCircle2 size={15} className={styles.resolvedIcon} />
          <div className={styles.resolvedBody}>
            <div className={styles.resolvedState}>
              {local.state.replace(/_/g, ' ')}
            </div>
            {local.note && <div className={styles.resolvedNote}>{local.note}</div>}
            <div className={styles.resolvedTime}>
              Recorded {new Date(local.updatedAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setLocal(null)}>
            Change
          </Button>
        </div>
      ) : (
        <div className={styles.options}>
          {RESOLUTION_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.state}
                className={styles.option}
                disabled={isLoading}
                onClick={() => resolve(opt.state, opt.note)}
              >
                <div className={styles.optionIcon}>
                  <Icon size={15} />
                </div>
                <div className={styles.optionBody}>
                  <div className={styles.optionLabel}>{opt.label}</div>
                  <div className={styles.optionSub}>{opt.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
