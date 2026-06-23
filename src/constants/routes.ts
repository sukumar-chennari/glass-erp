/**
 * Route path constants.
 * Never hardcode path strings in components or router — import from here.
 */
export const ROUTES = {
  ROOT:           '/',
  LOGIN:          '/login',
  DASHBOARD:      '/dashboard',
  VENDORS:        '/vendors',
  PRODUCTS:       '/products',
  PURCHASE_ORDERS:'/purchase-orders',
  STOCK:          '/stock',
  CUSTOMERS:      '/customers',
  TECHNICIANS:    '/technicians',
  JOBS:           '/jobs',
  INVOICES:       '/invoices',
  CLAIMS:         '/insurance-claims',
  REPORTS:        '/reports',
  SETTINGS:       '/settings',
  ENQUIRY:        '/enquiry',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
