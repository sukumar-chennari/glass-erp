import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Search, Loader2, Check } from 'lucide-react';
import styles from './SearchableSelect.module.css';

export interface SSOption { id: string; name: string; }

interface SearchableSelectProps {
  id?:             string;
  value:           string;   // selected option id; matched via opt.id === value
  displayValue?:   string;   // override closed-trigger label (use for prefill-by-name cases)
  onChange:        (id: string, name: string) => void;
  onSearch:        (term: string) => void; // called 300 ms after typing stops
  options:         SSOption[];
  isLoading?:      boolean;
  placeholder?:    string;
  disabled?:       boolean;
  error?:          boolean;
  ariaDescribedBy?: string;
  ariaInvalid?:    boolean;
  className?:      string;   // override --ss-* tokens for per-context theming
}

const DEBOUNCE = 300;

export function SearchableSelect({
  id, value, displayValue, onChange, onSearch, options,
  isLoading = false, placeholder = 'Search…', disabled = false,
  error = false, ariaDescribedBy, ariaInvalid, className,
}: SearchableSelectProps) {
  const uid   = useId();
  const btnId = id ?? uid;

  const [open,   setOpen]   = useState(false);
  const [term,   setTerm]   = useState('');
  const [cursor, setCursor] = useState(-1);
  // stable label shown on trigger — updated on pick or when dropdown closes
  const [label, setLabel] = useState(
    () => displayValue ?? options.find((o) => o.id === value)?.name ?? '',
  );

  const rootRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLUListElement>(null);
  const timer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // sync label when closed and external value/options change
  useEffect(() => {
    if (open) return;
    setLabel(displayValue ?? options.find((o) => o.id === value)?.name ?? '');
  }, [value, options, displayValue, open]);

  // cleanup timer
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) doClose();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  function doOpen() {
    if (disabled) return;
    setTerm('');
    setCursor(-1);
    setOpen(true);
    onSearch('');
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function doClose() {
    setOpen(false);
    setTerm('');
    setCursor(-1);
  }

  function pick(opt: SSOption) {
    setLabel(opt.name);
    onChange(opt.id, opt.name);
    doClose();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setTerm(v);
    setCursor(-1);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearch(v), DEBOUNCE);
  }

  function handleTriggerKey(e: React.KeyboardEvent) {
    if (['Enter', ' ', 'ArrowDown'].includes(e.key)) { e.preventDefault(); doOpen(); }
  }

  function handleInputKey(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setCursor((i) => Math.min(i + 1, options.length - 1)); break;
      case 'ArrowUp':   e.preventDefault(); setCursor((i) => Math.max(i - 1, 0)); break;
      case 'Enter':     e.preventDefault(); if (cursor >= 0 && options[cursor]) pick(options[cursor]); break;
      case 'Escape':    e.preventDefault(); doClose(); break;
    }
  }

  // scroll active option into view
  useEffect(() => {
    if (cursor < 0 || !listRef.current) return;
    (listRef.current.children[cursor] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const cls = [styles.root, error ? styles.hasErr : '', disabled ? styles.isDis : '', className ?? '']
    .filter(Boolean).join(' ');

  return (
    <div ref={rootRef} className={cls}>
      {/* ── Closed: trigger button ── */}
      {!open && (
        <button
          id={btnId}
          type="button"
          className={styles.trigger}
          onClick={doOpen}
          onKeyDown={handleTriggerKey}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={false}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
        >
          <span className={label ? styles.val : styles.ph}>{label || placeholder}</span>
          <ChevronDown size={13} className={styles.caret} aria-hidden />
        </button>
      )}

      {/* ── Open: search input ── */}
      {open && (
        <div className={styles.inputBox}>
          <Search size={13} className={styles.ico} aria-hidden />
          <input
            ref={inputRef}
            id={btnId}
            type="text"
            className={styles.inp}
            value={term}
            onChange={handleChange}
            onKeyDown={handleInputKey}
            placeholder="Type to search…"
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded
            aria-haspopup="listbox"
            aria-controls={`${btnId}-lb`}
            aria-activedescendant={cursor >= 0 ? `${btnId}-o${cursor}` : undefined}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
          />
          {isLoading && <Loader2 size={13} className={styles.spin} aria-hidden />}
        </div>
      )}

      {/* ── Dropdown list ── */}
      {open && (
        <ul id={`${btnId}-lb`} ref={listRef} role="listbox" className={styles.list}>
          {isLoading ? (
            <li className={styles.msg}>
              <Loader2 size={13} className={styles.spin} /> Loading…
            </li>
          ) : options.length === 0 ? (
            <li className={styles.msg}>No results found</li>
          ) : (
            options.map((opt, i) => (
              <li
                key={opt.id}
                id={`${btnId}-o${i}`}
                role="option"
                aria-selected={opt.id === value}
                className={[
                  styles.opt,
                  opt.id === value ? styles.optSel : '',
                  i === cursor    ? styles.optCur : '',
                ].filter(Boolean).join(' ')}
                onMouseDown={(e) => { e.preventDefault(); pick(opt); }}
                onMouseEnter={() => setCursor(i)}
              >
                <span className={styles.optLabel}>{opt.name}</span>
                {opt.id === value && <Check size={12} className={styles.check} aria-hidden />}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
