import { useState } from 'react';
import { Loader2, AlertCircle, RefreshCw, CheckCircle, Info, CheckCircle2 } from 'lucide-react';
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
  if (n == null) return 'N/A';
  return `₹${n.toLocaleString('en-IN')}`;
}

// ── Quote tile ───────────────────────────────────────────────────────────────

interface QuoteTileProps {
  quote:    PriceQuote;
  selected: boolean;
  onSelect: () => void;
}

function QuoteTile({ quote, selected, onSelect }: QuoteTileProps) {
  const unavailable = quote.total == null;
  return (
    <button
      type="button"
      className={[
        styles.tile,
        selected    ? styles.tileSelected    : '',
        unavailable ? styles.tileUnavailable : '',
      ].filter(Boolean).join(' ')}
      onClick={unavailable ? undefined : onSelect}
      disabled={unavailable}
      aria-pressed={selected}
    >
      {/* Brand + check */}
      <div className={styles.tileBrand}>
        <span>{quote.brand}</span>
        {selected && <CheckCircle2 size={14} className={styles.tileCheck} />}
      </div>

      {/* Glass price */}
      <div className={styles.tileGlassSection}>
        <span className={styles.tileGlassLabel}>Glass</span>
        <span className={styles.tileGlassVal}>
          {unavailable ? 'Not available' : fmt(quote.glassPrice)}
        </span>
      </div>

      {/* Total */}
      <div className={`${styles.tileTotal} ${unavailable ? styles.tileTotalUnavailable : ''}`}>
        <span className={styles.tileTotalLabel}>TOTAL</span>
        <span className={styles.tileTotalVal}>
          {unavailable ? '—' : fmt(quote.total)}
        </span>
      </div>
    </button>
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
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
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

  const errStatus = (error as { status?: number } | undefined)?.status;
  const errKind: 'missing-fields' | 'not-found' | 'generic' =
    !pricingReady      ? 'missing-fields' :
    errStatus === 400  ? 'missing-fields' :
    errStatus === 404  ? 'not-found'      :
    'generic';

  const hasQuotes = Array.isArray(quotes) && quotes.length > 0;
  const canConfirm = hasQuotes && selectedBrand != null;

  function handleConfirm() {
    if (!canConfirm) return;
    onConfirm();
    setSelectedBrand(null);
  }

  function handleClose() {
    setSelectedBrand(null);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Price Estimate"
      maxWidth="560px"
      footer={
        <div className={styles.footer}>
          <Button variant="ghost" onClick={handleClose}>Close</Button>
          {hasQuotes && (
            <Button onClick={handleConfirm} disabled={!canConfirm}>
              <CheckCircle size={14} />
              {canConfirm ? 'Confirm Quote' : 'Select a brand'}
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

      {pricingReady && isLoading && (
        <div className={styles.state}>
          <Loader2 size={28} className={styles.stateIconSpin} />
          <div className={styles.stateTitle}>Generating estimate…</div>
          <div className={styles.stateBody}>Fetching the latest quotes from our pricing engine.</div>
        </div>
      )}

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
          <p className={styles.selectHint}>Select a brand to confirm the price estimate</p>
          <div className={styles.tiles}>
            {quotes.map((q) => (
              <QuoteTile
                key={q.brand}
                quote={q}
                selected={selectedBrand === q.brand}
                onSelect={() => setSelectedBrand(q.brand)}
              />
            ))}
          </div>

          <div className={styles.disclaimer}>
            <Info size={13} className={styles.disclaimerIcon} />
            <span>
              System-generated estimate based on vehicle and glass details.
              Final pricing may vary after physical inspection and branch confirmation.
            </span>
          </div>
        </>
      )}
    </Modal>
  );
}
