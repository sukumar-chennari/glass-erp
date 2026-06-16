import type { HTMLAttributes } from 'react';
import type { BadgeVariant } from '@/constants/statuses';
import styles from './Badge.module.css';

type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:  BadgeVariant;
  size?:     BadgeSize;
  dot?:      boolean;
  label:     string;
}

export function Badge({ variant = 'neutral', size = 'md', dot, label, className, ...rest }: BadgeProps) {
  const cls = [
    styles.badge,
    styles[variant],
    size !== 'md' ? styles[size] : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={cls} {...rest}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {label}
    </span>
  );
}

/**
 * Convenience component: pass a status string and a status map, get a badge.
 * Keeps badge rendering logic out of every table row.
 */
interface StatusBadgeProps {
  status:    string;
  statusMap: Record<string, { label: string; variant: BadgeVariant }>;
  size?:     BadgeSize;
  getLabel?: (status: string) => string;
}

export function StatusBadge({ status, statusMap, size, getLabel }: StatusBadgeProps) {
  const display = statusMap[status] ?? { label: status, variant: 'neutral' as BadgeVariant };
  const label   = getLabel ? getLabel(status) : display.label;
  return <Badge label={label} variant={display.variant} size={size} />;
}
