/**
 * UI-only types — not tied to domain models or API contracts.
 */
import type { ReactNode } from 'react';
import type { BadgeVariant } from '@/constants/statuses';

export interface TableColumn<T> {
  key:        keyof T | string;
  header:     string;
  width?:     string;
  align?:     'left' | 'center' | 'right';
  sortable?:  boolean;
  render?:    (row: T) => ReactNode;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface KpiCardConfig {
  id:       string;
  label:    string;
  value:    string | number;
  change?:  string;
  trend?:   'up' | 'down' | 'neutral';
  icon:     string;  // lucide-react icon name
  variant:  'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface DropdownOption {
  label:    string;
  value:    string;
  icon?:    string;
  variant?: BadgeVariant;
  disabled?: boolean;
}

export interface ToastPayload {
  id:       string;
  message:  string;
  type:     'success' | 'error' | 'info' | 'warning';
  duration?: number;
}
