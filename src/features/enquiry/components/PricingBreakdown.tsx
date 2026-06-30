import { useState, useMemo } from 'react';
import { CheckCircle2, Package } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { STOCK_STATUS_MAP } from '@/constants/statuses';
import { useGetStockQuery } from '@/features/stock/services/stockApi';
import styles from './PricingBreakdown.module.css';

interface PriceTier {
  brand:       'OEM' | 'OEE' | 'Aftermarket';
  glassCost:   number;
  fitting:     number;
  sealant:     number;
  total:       number;
  warranty:    string;
  description: string;
}

const BASE: Record<string, { oem: number; oee: number; am: number }> = {
  'Front Windshield':      { oem: 6800,  oee: 4600,  am: 3200  },
  'Rear Windshield':       { oem: 5200,  oee: 3600,  am: 2400  },
  'Driver Side Window':    { oem: 3000,  oee: 2100,  am: 1300  },
  'Passenger Side Window': { oem: 2800,  oee: 2000,  am: 1200  },
  'Rear Left Window':      { oem: 2600,  oee: 1800,  am: 1100  },
  'Rear Right Window':     { oem: 2600,  oee: 1800,  am: 1100  },
  'Sunroof Glass':         { oem: 15000, oee: 10000, am: 6500  },
  'Quarter Glass':         { oem: 2800,  oee: 1900,  am: 1200  },
};

const FITTING: Record<string, number>  = {
  'Front Windshield': 800, 'Rear Windshield': 800, 'Sunroof Glass': 1200,
};
const SEALANT: Record<string, number>  = {
  'Front Windshield': 400, 'Rear Windshield': 400, 'Sunroof Glass': 300,
};

function buildTiers(glassType: string): PriceTier[] {
  const b = BASE[glassType] ?? { oem: 4000, oee: 2800, am: 1800 };
  const f = FITTING[glassType] ?? 500;
  const s = SEALANT[glassType] ?? 200;
  return [
    { brand: 'OEM',         glassCost: b.oem, fitting: f, sealant: s, total: b.oem + f + s, warranty: '2–3 year OEM warranty',       description: 'Original manufacturer spec'       },
    { brand: 'OEE',         glassCost: b.oee, fitting: f, sealant: s, total: b.oee + f + s, warranty: '1 year guarantee',             description: 'OEM-equivalent, certified quality' },
    { brand: 'Aftermarket', glassCost: b.am,  fitting: f, sealant: s, total: b.am  + f + s, warranty: '6 months',                    description: 'Budget option, local brand'        },
  ];
}

interface Props {
  glassType:    string;
  vehicleModel: string;
  onSelect:     (price: number, brand: string) => void;
}

export function PricingBreakdown({ glassType, vehicleModel, onSelect }: Props) {
  const { data: stock = [] } = useGetStockQuery();
  const [selected, setSelected] = useState<string | null>(null);

  const tiers = useMemo(() => buildTiers(glassType), [glassType]);

  const vLower = vehicleModel.toLowerCase();
  const matchStock = stock.find((s) => {
    if (s.glassPosition !== glassType) return false;
    const makeWords  = s.vehicleMake.toLowerCase().split(/\s+/);
    const modelWords = s.vehicleModel.toLowerCase().split(/\s+/);
    return vLower
      ? makeWords.some((w) => vLower.includes(w)) || modelWords.some((w) => vLower.includes(w))
      : false;
  }) ?? stock.find((s) => s.glassPosition === glassType);

  function handleSelect(tier: PriceTier) {
    setSelected(tier.brand);
    onSelect(tier.total, tier.brand);
  }

  const selectedTier = tiers.find((t) => t.brand === selected);

  return (
    <div className={styles.container}>
      <div className={styles.tiersRow}>
        {tiers.map((tier) => {
          const isSelected = selected === tier.brand;
          const showStock  = tier.brand === 'OEM' && !!matchStock;
          return (
            <button
              key={tier.brand}
              type="button"
              className={`${styles.tier} ${isSelected ? styles.tierSelected : ''}`}
              onClick={() => handleSelect(tier)}
            >
              {isSelected && <CheckCircle2 size={14} className={styles.checkIcon} />}
              <div className={styles.tierBrand}>{tier.brand}</div>
              <div className={styles.tierDesc}>{tier.description}</div>
              <div className={styles.tierWarranty}>{tier.warranty}</div>

              <div className={styles.breakdown}>
                <div className={styles.bRow}>
                  <span className={styles.bLabel}>Glass</span>
                  <span>₹{tier.glassCost.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.bRow}>
                  <span className={styles.bLabel}>Fitting</span>
                  <span>₹{tier.fitting.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.bRow}>
                  <span className={styles.bLabel}>Sealant</span>
                  <span>₹{tier.sealant.toLocaleString('en-IN')}</span>
                </div>
                <div className={`${styles.bRow} ${styles.total}`}>
                  <span>Total</span>
                  <span>₹{tier.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {showStock && (
                <div className={styles.stockRow}>
                  <Package size={11} />
                  <StatusBadge
                    status={matchStock!.stockStatus}
                    statusMap={STOCK_STATUS_MAP}
                    size="sm"
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedTier && (
        <div className={styles.summary}>
          <span className={styles.summaryLabel}>
            {selectedTier.brand} · {selectedTier.warranty}
          </span>
          <span className={styles.selectedPrice}>
            ₹{selectedTier.total.toLocaleString('en-IN')}
          </span>
        </div>
      )}
    </div>
  );
}
