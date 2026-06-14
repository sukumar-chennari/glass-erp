/**
 * Status enums and badge display maps.
 * Changing a label or colour for a status requires edits here only.
 * Components receive a status string and pass it to StatusBadge — no conditionals in components.
 */

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

export interface StatusDisplay {
  label:   string;
  variant: BadgeVariant;
}

// ── Vendor ──────────────────────────────────────────────────────────
export const VENDOR_STATUS = {
  ACTIVE:   'Active',
  ON_HOLD:  'On Hold',
  INACTIVE: 'Inactive',
} as const;
export type VendorStatus = typeof VENDOR_STATUS[keyof typeof VENDOR_STATUS];

export const VENDOR_STATUS_MAP: Record<VendorStatus, StatusDisplay> = {
  [VENDOR_STATUS.ACTIVE]:   { label: 'Active',   variant: 'success' },
  [VENDOR_STATUS.ON_HOLD]:  { label: 'On Hold',  variant: 'warning' },
  [VENDOR_STATUS.INACTIVE]: { label: 'Inactive', variant: 'neutral' },
};

// ── Product / Stock ─────────────────────────────────────────────────
export const STOCK_STATUS = {
  IN_STOCK:    'In Stock',
  LOW_STOCK:   'Low Stock',
  OUT_OF_STOCK:'Out of Stock',
} as const;
export type StockStatus = typeof STOCK_STATUS[keyof typeof STOCK_STATUS];

export const STOCK_STATUS_MAP: Record<StockStatus, StatusDisplay> = {
  [STOCK_STATUS.IN_STOCK]:    { label: 'In Stock',     variant: 'success' },
  [STOCK_STATUS.LOW_STOCK]:   { label: 'Low Stock',    variant: 'warning' },
  [STOCK_STATUS.OUT_OF_STOCK]:{ label: 'Out of Stock', variant: 'danger'  },
};

// ── Purchase Order ──────────────────────────────────────────────────
export const PO_STATUS = {
  DRAFT:      'Draft',
  SENT:       'Sent',
  ACCEPTED:   'Accepted',
  IN_TRANSIT: 'In Transit',
  RECEIVED:   'Received',
  CANCELLED:  'Cancelled',
} as const;
export type PoStatus = typeof PO_STATUS[keyof typeof PO_STATUS];

export const PO_STATUS_MAP: Record<PoStatus, StatusDisplay> = {
  [PO_STATUS.DRAFT]:      { label: 'Draft',      variant: 'neutral' },
  [PO_STATUS.SENT]:       { label: 'Sent',       variant: 'info'    },
  [PO_STATUS.ACCEPTED]:   { label: 'Accepted',   variant: 'primary' },
  [PO_STATUS.IN_TRANSIT]: { label: 'In Transit', variant: 'info'    },
  [PO_STATUS.RECEIVED]:   { label: 'Received',   variant: 'success' },
  [PO_STATUS.CANCELLED]:  { label: 'Cancelled',  variant: 'danger'  },
};

// ── Job Card ────────────────────────────────────────────────────────
export const JOB_STATUS = {
  PENDING:     'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED:   'Completed',
  CANCELLED:   'Cancelled',
  ON_HOLD:     'On Hold',
} as const;
export type JobStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS];

export const JOB_STATUS_MAP: Record<JobStatus, StatusDisplay> = {
  [JOB_STATUS.PENDING]:     { label: 'Pending',     variant: 'neutral' },
  [JOB_STATUS.IN_PROGRESS]: { label: 'In Progress', variant: 'warning' },
  [JOB_STATUS.COMPLETED]:   { label: 'Completed',   variant: 'success' },
  [JOB_STATUS.CANCELLED]:   { label: 'Cancelled',   variant: 'danger'  },
  [JOB_STATUS.ON_HOLD]:     { label: 'On Hold',     variant: 'neutral' },
};

// ── Invoice ─────────────────────────────────────────────────────────
export const INVOICE_STATUS = {
  DRAFT:   'Draft',
  SENT:    'Sent',
  PAID:    'Paid',
  OVERDUE: 'Overdue',
  VOID:    'Void',
} as const;
export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];

export const INVOICE_STATUS_MAP: Record<InvoiceStatus, StatusDisplay> = {
  [INVOICE_STATUS.DRAFT]:   { label: 'Draft',   variant: 'neutral' },
  [INVOICE_STATUS.SENT]:    { label: 'Sent',    variant: 'info'    },
  [INVOICE_STATUS.PAID]:    { label: 'Paid',    variant: 'success' },
  [INVOICE_STATUS.OVERDUE]: { label: 'Overdue', variant: 'danger'  },
  [INVOICE_STATUS.VOID]:    { label: 'Void',    variant: 'neutral' },
};

// ── Insurance Claim ─────────────────────────────────────────────────
export const CLAIM_STATUS = {
  SUBMITTED:    'Submitted',
  UNDER_REVIEW: 'Under Review',
  SURVEYED:     'Surveyed',
  APPROVED:     'Approved',
  PARTIAL:      'Partial',
  REJECTED:     'Rejected',
} as const;
export type ClaimStatus = typeof CLAIM_STATUS[keyof typeof CLAIM_STATUS];

export const CLAIM_STATUS_MAP: Record<ClaimStatus, StatusDisplay> = {
  [CLAIM_STATUS.SUBMITTED]:    { label: 'Submitted',    variant: 'info'    },
  [CLAIM_STATUS.UNDER_REVIEW]: { label: 'Under Review', variant: 'info'    },
  [CLAIM_STATUS.SURVEYED]:     { label: 'Surveyed',     variant: 'primary' },
  [CLAIM_STATUS.APPROVED]:     { label: 'Approved',     variant: 'success' },
  [CLAIM_STATUS.PARTIAL]:      { label: 'Partial',      variant: 'warning' },
  [CLAIM_STATUS.REJECTED]:     { label: 'Rejected',     variant: 'danger'  },
};

// ── Technician ──────────────────────────────────────────────────────
export const TECH_STATUS = {
  ACTIVE:   'Active',
  TRAINING: 'Training',
  INACTIVE: 'Inactive',
  ON_LEAVE: 'On Leave',
} as const;
export type TechStatus = typeof TECH_STATUS[keyof typeof TECH_STATUS];

export const TECH_STATUS_MAP: Record<TechStatus, StatusDisplay> = {
  [TECH_STATUS.ACTIVE]:   { label: 'Active',   variant: 'success' },
  [TECH_STATUS.TRAINING]: { label: 'Training', variant: 'warning' },
  [TECH_STATUS.INACTIVE]: { label: 'Inactive', variant: 'neutral' },
  [TECH_STATUS.ON_LEAVE]: { label: 'On Leave', variant: 'neutral' },
};
