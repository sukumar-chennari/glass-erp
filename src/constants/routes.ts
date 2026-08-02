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
  SETUP_PASSWORD:  '/setup-password',   // ?token=<signed-invite-token>
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
  SETTINGS_USERS:            '/settings/users',
  SETTINGS_BRANCHES:         '/settings/branches',
  SETTINGS_PRICING:          '/settings/pricing',
  SETTINGS_INSURANCE_RULES:  '/settings/insurance-rules',
  SETTINGS_VEHICLE_MODELS:   '/settings/vehicle-models',
  SETTINGS_CAR_BRANDS:       '/settings/car-brands',
  SETTINGS_CAR_MODELS:       '/settings/car-models',
  SETTINGS_BULK_UPLOAD:      '/settings/bulk-upload',
  SETTINGS_SUPER_ADMINS:     '/settings/super-admins',
  STAFF:             '/staff',
  SUBMIT:            '/submit',
  TRACK:             '/track',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
