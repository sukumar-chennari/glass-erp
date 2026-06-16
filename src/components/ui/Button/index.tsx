import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant;
  size?:      ButtonSize;
  loading?:   boolean;
  fullWidth?: boolean;
  iconOnly?:  boolean;
  leftIcon?:  ReactNode;
  rightIcon?: ReactNode;
  children?:  ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant   = 'primary',
      size      = 'md',
      loading   = false,
      fullWidth = false,
      iconOnly  = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className,
      ...rest
    },
    ref,
  ) => {
    const cls = [
      styles.btn,
      styles[variant],
      styles[size],
      fullWidth  ? styles.fullWidth  : '',
      iconOnly   ? styles.iconOnly   : '',
      loading    ? styles.loading    : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} className={cls} disabled={disabled || loading} {...rest}>
        {loading ? (
          <LoadingDots />
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

function LoadingDots() {
  const { t } = useTranslation('common');
  return (
    <span aria-label={t('table.loading')} style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5, height: 5,
            borderRadius: '50%',
            background: 'currentColor',
            opacity: 0.6,
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}
