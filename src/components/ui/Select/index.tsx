import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SelectOption } from '@/types/ui';
import styles from './Select.module.css';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:      string;
  error?:      string;
  hint?:       string;
  options:     SelectOption[];
  placeholder?: string;
  fullWidth?:  boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, hint, options, placeholder, fullWidth, className, id, ...rest },
    ref,
  ) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={`${styles.group} ${fullWidth ? styles.fullWidth : ''} ${className ?? ''}`}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
            {rest.required && <span className={styles.required}>*</span>}
          </label>
        )}

        <div className={`${styles.selectWrap} ${error ? styles.hasError : ''}`}>
          <select
            ref={ref}
            id={selectId}
            className={styles.select}
            aria-invalid={!!error}
            {...rest}
          >
            {placeholder && (
              <option value="">{placeholder}</option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className={styles.chevron}>
            <ChevronDown size={14} />
          </span>
        </div>

        {error && (
          <span className={styles.error} role="alert">
            {error}
          </span>
        )}
        {hint && !error && <span className={styles.hint}>{hint}</span>}
      </div>
    );
  },
);

Select.displayName = 'Select';
