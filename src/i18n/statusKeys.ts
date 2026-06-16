const CLAIM_STATUS_KEYS: Record<string, string> = {
  'Submitted':    'submitted',
  'Under Review': 'underReview',
  'Surveyed':     'surveyed',
  'Approved':     'approved',
  'Partial':      'partial',
  'Rejected':     'rejected',
};

const INVOICE_STATUS_KEYS: Record<string, string> = {
  'Draft':    'draft',
  'Sent':     'sent',
  'Paid':     'paid',
  'Overdue':  'overdue',
  'Void':     'void',
};

const JOB_STATUS_KEYS: Record<string, string> = {
  'Pending':     'pending',
  'In Progress': 'inProgress',
  'Completed':   'completed',
  'Cancelled':   'cancelled',
  'On Hold':     'onHold',
};

const VENDOR_STATUS_KEYS: Record<string, string> = {
  'Active':   'active',
  'On Hold':  'onHold',
  'Inactive': 'inactive',
};

const STOCK_STATUS_KEYS: Record<string, string> = {
  'In Stock':     'inStock',
  'Low Stock':    'lowStock',
  'Out of Stock': 'outOfStock',
};

const PO_STATUS_KEYS: Record<string, string> = {
  'Draft':      'draft',
  'Sent':       'sent',
  'Accepted':   'accepted',
  'In Transit': 'inTransit',
  'Received':   'received',
  'Cancelled':  'cancelled',
};

const TECH_STATUS_KEYS: Record<string, string> = {
  'Active':   'active',
  'On Hold':  'onHold',
  'Inactive': 'inactive',
  'Training': 'training',
  'On Leave': 'onLeave',
};

const GLASS_POSITION_KEYS: Record<string, string> = {
  'Front Windshield':       'frontWindshield',
  'Rear Windshield':        'rearWindshield',
  'Driver Side Window':     'driverSideWindow',
  'Passenger Side Window':  'passengerSideWindow',
  'Rear Left Window':       'rearLeftWindow',
  'Rear Right Window':      'rearRightWindow',
  'Sunroof Glass':          'sunroofGlass',
  'Quarter Glass':          'quarterGlass',
};

const DAMAGE_TYPE_KEYS: Record<string, string> = {
  'Crack':              'crack',
  'Chip / Stone Impact':'chipStoneImpact',
  'Complete Shatter':   'completeShatter',
  'Scratch':            'scratch',
  'Stress Fracture':    'stressFracture',
};

const PAYMENT_TYPE_KEYS: Record<string, string> = {
  'Cash':      'cash',
  'Insurance': 'insurance',
  'Card':      'card',
  'UPI':       'upi',
};

export function claimStatusKey(status: string): string   { return CLAIM_STATUS_KEYS[status]    ?? status; }
export function invoiceStatusKey(status: string): string { return INVOICE_STATUS_KEYS[status]  ?? status; }
export function jobStatusKey(status: string): string     { return JOB_STATUS_KEYS[status]      ?? status; }
export function vendorStatusKey(status: string): string  { return VENDOR_STATUS_KEYS[status]   ?? status; }
export function stockStatusKey(status: string): string   { return STOCK_STATUS_KEYS[status]    ?? status; }
export function poStatusKey(status: string): string      { return PO_STATUS_KEYS[status]       ?? status; }
export function techStatusKey(status: string): string    { return TECH_STATUS_KEYS[status]     ?? status; }
export function glassPositionKey(pos: string): string    { return GLASS_POSITION_KEYS[pos]     ?? pos; }
export function damageTypeKey(type: string): string      { return DAMAGE_TYPE_KEYS[type]       ?? type; }
export function paymentTypeKey(type: string): string     { return PAYMENT_TYPE_KEYS[type]      ?? type; }
