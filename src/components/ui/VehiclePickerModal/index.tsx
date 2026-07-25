import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, ArrowLeft, Search, Loader2, Check, X } from 'lucide-react';
import carBrandFallback from '../../../../assets/images/car-brand.jpeg';
import carModelFallback from '../../../../assets/images/car-model.jpeg';
import styles from './VehiclePickerModal.module.css';

export interface VPOption { id: string; name: string; image?: string | null; }

interface VehiclePickerModalProps {
  id?:              string;
  type:             'brand' | 'model';
  value:            string;
  displayValue?:    string;
  onChange:         (id: string, name: string) => void;
  onSearch:         (term: string) => void;
  options:          VPOption[];
  isLoading?:       boolean;
  placeholder?:     string;
  disabled?:        boolean;
  error?:           boolean;
  ariaDescribedBy?: string;
  ariaInvalid?:     boolean;
  className?:       string;
}

const DEBOUNCE = 300;

export function VehiclePickerModal({
  id, type, value, displayValue, onChange, onSearch, options,
  isLoading = false, placeholder = 'Select…', disabled = false,
  error = false, ariaDescribedBy, ariaInvalid, className,
}: VehiclePickerModalProps) {
  const uid   = useId();
  const btnId = id ?? uid;

  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [label, setLabel] = useState(
    () => displayValue ?? options.find((o) => o.id === value)?.name ?? '',
  );
  const timer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // sync label when closed and external value/options/displayValue changes
  useEffect(() => {
    if (open) return;
    setLabel(displayValue ?? options.find((o) => o.id === value)?.name ?? '');
  }, [value, options, displayValue, open]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') doClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function doOpen() {
    if (disabled) return;
    setTerm('');
    onSearch('');
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function doClose() {
    setOpen(false);
    setTerm('');
  }

  function pick(opt: VPOption) {
    setLabel(opt.name);
    onChange(opt.id, opt.name);
    doClose();
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setTerm(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearch(v), DEBOUNCE);
  }

  const fallbackImg = type === 'brand' ? carBrandFallback : carModelFallback;
  const title       = type === 'brand' ? 'Select Manufacturer' : 'Select Model';
  const searchPh    = type === 'brand' ? 'Search Brands'       : 'Search Models';

  const rootCls = [styles.root, className ?? ''].filter(Boolean).join(' ');
  const trigCls = [
    styles.trigger,
    error    ? styles.triggerErr : '',
    disabled ? styles.triggerDis : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={rootCls}>
      {/* ── Closed: trigger button ── */}
      <button
        id={btnId}
        type="button"
        className={trigCls}
        onClick={doOpen}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      >
        <span className={label ? styles.triggerVal : styles.triggerPh}>
          {label || placeholder}
        </span>
        <ChevronDown size={13} className={styles.caret} aria-hidden />
      </button>

      {/* ── Open: full-screen modal ── */}
      {open && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => { if (e.target === e.currentTarget) doClose(); }}
        >
          <div className={styles.modal}>
            {/* Header */}
            <div className={styles.header}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={doClose}
                aria-label="Close picker"
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className={styles.title}>{title}</h2>
            </div>

            {/* Search */}
            <div className={styles.searchWrap}>
              <Search size={15} className={styles.searchIco} aria-hidden />
              <input
                ref={inputRef}
                type="text"
                className={styles.searchInput}
                placeholder={searchPh}
                value={term}
                onChange={handleSearch}
                aria-label={searchPh}
                autoComplete="off"
              />
              {isLoading && !term && <Loader2 size={14} className={styles.spin} aria-hidden />}
              {term && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => {
                    setTerm('');
                    onSearch('');
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Grid */}
            <div className={styles.gridWrap}>
              {isLoading && options.length === 0 ? (
                <div className={styles.empty}>
                  <Loader2 size={20} className={styles.spin} />
                  Loading…
                </div>
              ) : options.length === 0 ? (
                <div className={styles.empty}>No results found</div>
              ) : (
                <ul className={styles.grid} role="listbox" aria-label={title}>
                  {options.map((opt) => {
                    const imgSrc = opt.image ?? fallbackImg;
                    const isSel  = opt.id === value;
                    return (
                      <li key={opt.id} role="option" aria-selected={isSel}>
                        <button
                          type="button"
                          className={`${styles.card} ${isSel ? styles.cardSel : ''}`}
                          onClick={() => pick(opt)}
                        >
                          {isSel && (
                            <span className={styles.cardCheck} aria-hidden>
                              <Check size={10} />
                            </span>
                          )}
                          <div className={type === 'model' ? styles.imgWrapModel : styles.imgWrap}>
                            <img
                              src={imgSrc}
                              alt={opt.name}
                              className={type === 'model' ? styles.imgModel : styles.imgBrand}
                              loading="lazy"
                            />
                          </div>
                          <span className={styles.cardName}>{opt.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
