// Endpoint registry — single source of truth for all backend paths.
//
// Swagger → frontend module mapping:
//   /auth/*                → src/services/auth/{authService,mock,http}.ts + authApi.ts
//   /settings/branches     → src/features/settings/services/branchesApi.ts
//   /settings/users        → src/features/settings/services/usersApi.ts
//   /settings/insurance-rules  → src/features/settings/services/insuranceRulesApi.ts
//   /settings/vehicle-models   → src/features/settings/services/vehicleModelsApi.ts
//   /settings/pricing      → (planned) src/features/settings/services/pricingApi.ts
//   /dashboard             → src/features/dashboard/services/dashboardApi.ts
//   /admin/summary         → src/features/dashboard/services/adminSummaryApi.ts
//   /customers             → src/features/customers/services/customersApi.ts
//   /jobs                  → src/features/jobs/services/jobsApi.ts
//   /insurance-claims      → src/features/claims/services/claimsApi.ts
//   /invoices              → src/features/invoices/services/invoicesApi.ts
//   /products              → src/features/products/services/productsApi.ts
//   /vendors               → src/features/vendors/services/vendorsApi.ts
//   /purchase-orders       → src/features/purchaseOrders/services/purchaseOrdersApi.ts
//   /stock                 → src/features/stock/services/stockApi.ts
//   /technicians           → src/features/technicians/services/techniciansApi.ts
//   /reports/*             → src/features/reports (no dedicated API file yet)
//
// Recommended first module for real-backend integration:
//   Insurance Rules + Vehicle Models — pure CRUD, no session dependency,
//   mock data covers all 4 Swagger operations (GET/POST/PUT/DELETE),
//   and frontend UI is fully built and tested.

export const ENDPOINTS = {
  // ── Authentication ─────────────────────────────────────────────────
  auth: {
    // ── Active endpoints ────────────────────────────────────────────────
    loginEmail:     '/auth/login/email',  // POST — email + password (SUPER_ADMIN, ADMIN)
    otpSend:        '/auth/otp/send',     // POST — send OTP to phone (OPERATOR, TECHNICIAN)
    otpVerify:      '/auth/otp/verify',   // POST — verify OTP code
    logout:         '/auth/logout',       // POST
    forgotPassword: '/auth/forgot-password',
    resetPassword:  '/auth/reset-password',
    changePassword: '/auth/password',     // PATCH — authenticated change
    resendOtp:      '/auth/resend-otp',
    // ── Not yet active on backend ───────────────────────────────────────
    me:             '/auth/me',           // GET — stub ready; activate in http.ts getSession
    refresh:        '/auth/refresh',      // POST — stub ready; activate in http.ts getSession
    // ── Legacy (kept for mock compatibility) ────────────────────────────
    login:          '/auth/login',
    verifyOtp:      '/auth/verify-otp',
  },

  // ── Settings — Master Data ──────────────────────────────────────────
  insuranceRules: {
    list:   '/settings/insurance-rules',
    create: '/settings/insurance-rules',
    update: (id: string) => `/settings/insurance-rules/${id}`,
    remove: (id: string) => `/settings/insurance-rules/${id}`,
  },

  vehicleModels: {
    list:   '/settings/vehicle-models',
    create: '/settings/vehicle-models',
    update: (id: string) => `/settings/vehicle-models/${id}`,
    remove: (id: string) => `/settings/vehicle-models/${id}`,
  },

  pricing: {
    list:   '/settings/pricing',
    update: '/settings/pricing',
  },

  // ── Settings — Admin ────────────────────────────────────────────────
  branches: {
    list:   '/settings/branches',
    create: '/settings/branches',
    update: (id: string) => `/settings/branches/${id}`,
    remove: (id: string) => `/settings/branches/${id}`,
  },

  users: {
    list:         '/settings/users',
    create:       '/settings/users',
    updateStatus: (id: string) => `/settings/users/${id}/status`,
    resendInvite: (id: string) => `/settings/users/${id}/resend-invite`,
  },

  // ── Operations ─────────────────────────────────────────────────────
  customers: {
    list:   '/customers',
    byId:   (id: string) => `/customers/${id}`,
    create: '/customers',
    update: (id: string) => `/customers/${id}`,
  },

  jobs: {
    list:    '/jobs',
    byId:    (id: string) => `/jobs/${id}`,
    create:  '/jobs',
    update:  (id: string) => `/jobs/${id}`,
  },

  claims: {
    list:   '/insurance-claims',
    byId:   (id: string) => `/insurance-claims/${id}`,
    create: '/insurance-claims',
    update: (id: string) => `/insurance-claims/${id}`,
  },

  invoices: {
    list:   '/invoices',
    byId:   (id: string) => `/invoices/${id}`,
    create: '/invoices',
    update: (id: string) => `/invoices/${id}`,
  },

  // ── Inventory ───────────────────────────────────────────────────────
  products: {
    list:   '/products',
    byId:   (id: string) => `/products/${id}`,
    create: '/products',
    update: (id: string) => `/products/${id}`,
    remove: (id: string) => `/products/${id}`,
  },

  vendors: {
    list:   '/vendors',
    byId:   (id: string) => `/vendors/${id}`,
    create: '/vendors',
    update: (id: string) => `/vendors/${id}`,
    remove: (id: string) => `/vendors/${id}`,
  },

  purchaseOrders: {
    list:   '/purchase-orders',
    byId:   (id: string) => `/purchase-orders/${id}`,
    create: '/purchase-orders',
    update: (id: string) => `/purchase-orders/${id}`,
  },

  stock: {
    list:   '/stock',
    adjust: '/stock/adjust',
  },

  technicians: {
    list:   '/technicians',
    byId:   (id: string) => `/technicians/${id}`,
    create: '/technicians',
    update: (id: string) => `/technicians/${id}`,
    remove: (id: string) => `/technicians/${id}`,
  },

  // ── Dashboard & Reporting ───────────────────────────────────────────
  dashboard: {
    summary:       '/dashboard',
    adminSummary:  '/dashboard/admin-summary',
  },

  reports: {
    branchSummary: '/reports/branch-summary',
  },

  // ── Enquiries ───────────────────────────────────────────────────────
  // quick: unauthenticated fast-capture (Entry Page, POST only).
  // list/byId: authenticated branch-admin read endpoints.
  enquiries: {
    quick: 'enquiries/quick',
    list:  '/enquiries',
    byId:  (id: string) => `/enquiries/${id}`,
  },
} as const;
