/**
 * Route path constants.
 * Never hardcode path strings in components or router — import from here.
 */
export const ROUTES = {
  ROOT:            '/',
  LOGIN:           '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD:  '/reset-password',   // ?token=<signed>&type=setup|reset
  VERIFY_OTP:      '/verify-otp',        // ?token=<otp-session-token>
  DASHBOARD:       '/dashboard',
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
  ENQUIRY:           '/enquiry',
  SETTINGS_USERS:    '/settings/users',
  SETTINGS_BRANCHES: '/settings/branches',
  SETTINGS_PRICING:  '/settings/pricing',
  SUBMIT:            '/submit',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
