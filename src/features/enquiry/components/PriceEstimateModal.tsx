import { Loader2, AlertCircle, RefreshCw, CheckCircle, Info } from 'lucide-react';
import { useGetPriceEstimateQuery } from '@/services/priceEstimateApi';
import type { PriceQuote } from '@/services/priceEstimateApi';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import styles from './PriceEstimateModal.module.css';

// ── Helpers ─────────────────────────────────────────────────────────────────

function isPricingReady(e: {
  carModelVariantId?: string;
  glassPartTypeId?:   string;
  bodyType?:          string;
}): boolean {
  return !!e.carModelVariantId && !!e.glassPartTypeId && !!e.bodyType;
}

function fmt(n: number | null | undefined): string {
  if (n == null) return 'Not available';
  return `₹${n.toLocaleString('en-IN')}`;
}

// ── Quote tile ───────────────────────────────────────────────────────────────

function QuoteTile({ quote }: { quote: PriceQuote }) {
  const noTotal = quote.total == null;
  return (
    <div className={`${styles.tile} ${noTotal ? styles.tileUnavailable : ''}`}>
      <div className={styles.tileBrand}>{quote.brand}</div>
      <div className={styles.tileRows}>
        <div className={styles.tileRow}>
          <span className={styles.tileRowLabel}>Glass</span>
          <span className={styles.tileRowVal}>{fmt(quote.glassPrice)}</span>
        </div>
        <div className={styles.tileRow}>
          <span className={styles.tileRowLabel}>Labour</span>
          <span className={styles.tileRowVal}>{fmt(quote.labourCharges)}</span>
        </div>
        <div className={styles.tileRow}>
          <span className={styles.tileRowLabel}>Sealant</span>
          <span className={styles.tileRowVal}>{fmt(quote.sealantCharges)}</span>
        </div>
      </div>
      <div className={`${styles.tileTotal} ${noTotal ? styles.tileTotalUnavailable : ''}`}>
        <span className={styles.tileTotalLabel}>Total</span>
        <span className={styles.tileTotalVal}>{fmt(quote.total)}</span>
      </div>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

interface PriceEstimateModalProps {
  isOpen:    boolean;
  onClose:   () => void;
  enquiry: {
    id:                string;
    enquiryNo?:        string;
    customerName:      string;
    vehicleModel:      string;
    glassType:         string;
    carModelVariantId?: string;
    glassPartTypeId?:   string;
    bodyType?:          string;
  } | null;
  onConfirm: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function PriceEstimateModal({ isOpen, onClose, enquiry, onConfirm }: PriceEstimateModalProps) {
  const pricingReady = enquiry != null && isPricingReady(enquiry);

  const {
    data:      quotes,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetPriceEstimateQuery(enquiry?.id ?? '', {
    skip: !isOpen || !enquiry || !pricingReady,
  });

  // Derive error kind from RTK error shape
  const errStatus = (error as { status?: number } | undefined)?.status;
  const errKind: 'missing-fields' | 'not-found' | 'generic' =
    !pricingReady      ? 'missing-fields' :
    errStatus === 400  ? 'missing-fields' :
    errStatus === 404  ? 'not-found'      :
    'generic';

  const hasQuotes  = Array.isArray(quotes) && quotes.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Price Estimate"
      maxWidth="560px"
      footer={
        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          {hasQuotes && (
            <Button onClick={onConfirm}>
              <CheckCircle size={14} />
              Confirm Quote
            </Button>
          )}
        </div>
      }
    >
      {/* Enquiry context row */}
      {enquiry && (
        <div className={styles.context}>
          <span className={styles.contextNo}>{enquiry.enquiryNo}</span>
          <span className={styles.contextInfo}>
            {enquiry.customerName} · {enquiry.vehicleModel} · {enquiry.glassType}
          </span>
        </div>
      )}

      {/* ── States ── */}

      {/* Missing pricing fields */}
      {!pricingReady && (
        <div className={styles.state}>
          <AlertCircle size={28} className={styles.stateIconWarn} />
          <div className={styles.stateTitle}>Pricing details incomplete</div>
          <div className={styles.stateBody}>
            Please update the enquiry with the vehicle variant, glass part type, and body type
            to generate a price estimate.
          </div>
        </div>
      )}

      {/* Loading */}
      {pricingReady && isLoading && (
        <div className={styles.state}>
          <Loader2 size={28} className={styles.stateIconSpin} />
          <div className={styles.stateTitle}>Generating estimate…</div>
          <div className={styles.stateBody}>Fetching the latest quotes from our pricing engine.</div>
        </div>
      )}

      {/* Error */}
      {pricingReady && !isLoading && isError && (
        <div className={styles.state}>
          <AlertCircle size={28} className={styles.stateIconErr} />
          <div className={styles.stateTitle}>
            {errKind === 'not-found'
              ? 'Enquiry not found'
              : errKind === 'missing-fields'
                ? 'Cannot generate estimate'
                : 'Could not load estimate'}
          </div>
          <div className={styles.stateBody}>
            {errKind === 'not-found'
              ? 'This enquiry may have been removed. Refresh and try again.'
              : errKind === 'missing-fields'
                ? 'The required pricing fields (variant, glass type, body type) are not yet set on this enquiry.'
                : 'A network or server error occurred. Please check your connection and try again.'}
          </div>
          {errKind === 'generic' && (
            <button type="button" className={styles.retryBtn} onClick={() => void refetch()}>
              <RefreshCw size={13} />
              Retry
            </button>
          )}
        </div>
      )}

      {/* Empty — API returned no quotes */}
      {pricingReady && !isLoading && !isError && !hasQuotes && (
        <div className={styles.state}>
          <Info size={28} className={styles.stateIconInfo} />
          <div className={styles.stateTitle}>No quotes available</div>
          <div className={styles.stateBody}>
            Pricing data is not yet configured for this glass type and variant combination.
            Please contact your administrator.
          </div>
        </div>
      )}

      {/* Quote tiles */}
      {pricingReady && !isLoading && !isError && hasQuotes && (
        <>
          <div className={styles.tiles}>
            {quotes.map((q) => (
              <QuoteTile key={q.brand} quote={q} />
            ))}
          </div>

          {/* Disclaimer */}
          <div className={styles.disclaimer}>
            <Info size={13} className={styles.disclaimerIcon} />
            <span>
              This is a system-generated estimate based on the vehicle and glass details provided.
              Final pricing may vary slightly depending on the actual vehicle inspection,
              glass availability, fitment requirements, and branch confirmation.
            </span>
          </div>
        </>
      )}
    </Modal>
  );
}
