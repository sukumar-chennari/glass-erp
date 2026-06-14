# Backend Integration Guide — WindX Glass ERP

> **Audience:** Backend developers, full-stack engineers wiring up the real API  
> **Frontend build:** React 18 + TypeScript + Vite + Redux Toolkit (RTK Query)  
> **Status:** All 11 screens complete. Mock API active. Ready for real API integration.

---

## 1. Project Overview

WindX Glass ERP is a web admin panel for an automobile glass replacement business. It manages:

| Domain | Module |
|--------|--------|
| Procurement | Vendors, Products, Purchase Orders, Stock |
| Customer ops | Customers, Job Cards, Invoices |
| Insurance | Claims |
| Reporting | Dashboard, Reports |
| Config | Settings |

---

## 2. Frontend Architecture Summary

```
src/
├── features/<module>/         # Self-contained feature slices
│   ├── <Name>Page.tsx         # Route-level component
│   ├── components/            # Module-specific UI components
│   └── services/<name>Api.ts  # RTK Query endpoints (mock or real)
├── mocks/<entity>.ts          # In-memory CRUD stores (mock only)
├── services/
│   ├── baseApi.ts             # RTK createApi instance (one shared instance)
│   ├── mockUtils.ts           # mockableQuery / mockableMutation helpers
│   └── adapters.ts            # Response shape adapters (snake_case → camelCase)
├── types/
│   ├── models/                # TypeScript interfaces per entity
│   ├── enums.ts               # Shared domain union types
│   └── api.ts                 # Generic wrappers (ApiResponse, PaginatedResponse)
├── constants/
│   ├── statuses.ts            # Status values + display maps
│   └── routes.ts              # All route paths
└── store/index.ts             # Redux store (baseApi reducer + middleware)
```

All state that comes from the server lives in RTK Query's cache. No separate Redux slices for entity data.

---

## 3. How Mock Mode Works

Each API endpoint is authored with a `mockableQuery` / `mockableMutation` helper:

```ts
// src/services/mockUtils.ts  (simplified)
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';

export function mockableQuery<R, A>({ mockFn, url, ... }) {
  return USE_MOCK
    ? { queryFn: async (arg) => { await delay(MOCK_DELAY); return { data: mockFn(arg) }; } }
    : { query: (arg) => ({ url: typeof url === 'function' ? url(arg) : url }) };
}
```

When `VITE_USE_MOCK_API=true`, each endpoint uses an in-memory `queryFn`.  
When `VITE_USE_MOCK_API=false`, it uses `query` which calls `fetchBaseQuery` against `VITE_API_BASE_URL`.

**Components never change** — they always call the same RTK Query hook regardless of mode.

---

## 4. Switching to Real APIs — Step by Step

### 4.1 Environment setup

Create `.env.production` in the project root:

```bash
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=https://api.windxglass.in/v1
VITE_MOCK_DELAY_MS=0
```

Keep `.env.development` as-is for local development with mocks.

### 4.2 Authentication

`src/services/baseApi.ts` injects the auth token on every request:

```ts
prepareHeaders: (headers) => {
  const token = localStorage.getItem('glass_erp_token');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
},
```

**What the backend must provide:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | `{ email, password }` → `{ token, refreshToken, user }` |
| `/auth/refresh` | POST | `{ refreshToken }` → `{ token }` |
| `/auth/logout` | POST | Invalidate token |

**Token storage recommendation:** For production, prefer `httpOnly` cookies (not localStorage) to prevent XSS token theft. If using cookies, remove the `prepareHeaders` block and rely on cookie auto-send.

**Token expiry:** Add a 401 handler in `baseApi.ts`:

```ts
// Add to baseApi configuration
async onQueryStarted(_, { queryFulfilled }) { ... }
// Or use RTK Query middleware to intercept 401 and redirect to login
```

### 4.3 Per-endpoint migration

In each `src/features/<module>/services/<name>Api.ts`, replace the mock helper usage:

**Before (mock):**
```ts
getVendors: builder.query<Vendor[], void>({
  ...mockableQuery<Vendor[], void>({
    mockFn: () => vendorMock.list(),
    url: '/vendors',
  }),
  providesTags: ['Vendor'],
}),
```

**After (real API):**
```ts
getVendors: builder.query<Vendor[], VendorListParams>({
  query: (params) => ({ url: '/vendors', params }),
  transformResponse: (raw: BackendVendor[] | PaginatedResponse<BackendVendor>) => {
    // If backend shape differs from frontend model, call adapter here
    const items = Array.isArray(raw) ? raw : raw.data;
    return items.map(adaptVendor);  // from src/services/adapters.ts
  },
  providesTags: ['Vendor'],
}),
```

---

## 5. Environment Variable Reference

| Variable | Values | Description |
|----------|--------|-------------|
| `VITE_USE_MOCK_API` | `true` / `false` | Toggle mock vs real API |
| `VITE_API_BASE_URL` | `https://...` | Base URL for all real API calls |
| `VITE_MOCK_DELAY_MS` | `0`–`2000` | Artificial delay in mock mode (default: 350) |

Vite injects these at build time. All are typed in `src/vite-env.d.ts`.

---

## 6. RTK Query Tag Strategy

All cache tags are declared in `src/services/baseApi.ts`:

```ts
export const baseApi = createApi({
  tagTypes: ['Vendor', 'Product', 'Customer', 'Technician',
             'PurchaseOrder', 'Stock', 'Job', 'Invoice', 'Claim', 'Dashboard'],
  ...
});
```

**Rules:**
- List queries use `providesTags: ['EntityName']` (no IDs, no fine-grained tags)
- All mutations (create/update/delete) use `invalidatesTags: ['EntityName']`
- Mutations that affect dashboard KPIs also invalidate `'Dashboard'`

**Current cross-tag invalidations:**

| Mutation | Invalidates |
|----------|------------|
| createJob / updateJob / deleteJob | `['Job', 'Dashboard']` |
| createInvoice / updateInvoice / deleteInvoice | `['Invoice', 'Dashboard']` |
| createClaim / updateClaim / deleteClaim | `['Claim', 'Dashboard']` |
| createPO / updatePO / deletePO | `['PurchaseOrder', 'Dashboard']` |
| adjustStock | `['Stock']` |

**Fine-grained tags (for future `getById` endpoints):**

When adding detail pages, switch to ID-based tags:

```ts
providesTags: (result) => result
  ? [{ type: 'Vendor', id: result.id }, { type: 'Vendor', id: 'LIST' }]
  : [{ type: 'Vendor', id: 'LIST' }],
```

---

## 7. Cache Invalidation Strategy

The current strategy is **broad invalidation**: any mutation on an entity type refetches the entire list. This is safe and correct for small–medium datasets.

**When to upgrade to targeted invalidation:**

If a list has thousands of items and a pagination cursor, broad invalidation would re-fetch page 1 every time. At that point, switch to `{ type: 'Vendor', id: result.id }` tags for individual record updates.

**Dashboard invalidation:** The dashboard endpoint is a computed snapshot. It gets invalidated when Jobs, Invoices, Claims, or PurchaseOrders change. The backend should compute the snapshot fresh on each request (or cache with a 30–60s TTL).

---

## 8. Error Handling Expectations

**HTTP errors the frontend handles gracefully:**

| Status | Expected behavior |
|--------|-----------------|
| 200–204 | Normal success |
| 400 | Validation error — `{ status: 400, message: string, details: Record<string,string[]> }` |
| 401 | Token expired — redirect to login |
| 403 | Forbidden — show access denied message |
| 404 | Not found — mutation error caught in component try/catch |
| 500 | Server error — component shows `toast.error(...)` |

All mutations in page components are wrapped in try/catch. Errors from `unwrap()` bubble up and are caught. The toast system (`src/components/ui/Toast`) displays them.

**Error response contract (400):**
```json
{
  "status": 400,
  "message": "Validation failed",
  "details": {
    "phone": ["Must be 10 digits"],
    "email": ["Invalid email format"]
  }
}
```

Field-level `details` can be passed to React Hook Form's `setError()` for inline validation display.

---

## 9. Per-Module Integration Order

Integrate in dependency order (lower items depend on upper):

```
Tier 1 — No dependencies (integrate first)
  [ ] Vendors
  [ ] Customers
  [ ] Technicians
  [ ] Products

Tier 2 — Depends on Tier 1
  [ ] Stock          (depends on Products — shares productId)
  [ ] Purchase Orders (depends on Vendors — vendorId → vendorName)

Tier 3 — Depends on Tier 1 + 2
  [ ] Jobs           (depends on Customers + Technicians)
  [ ] Invoices       (depends on Customers + Jobs)
  [ ] Claims         (depends on Customers + Jobs)

Tier 4 — Depends on all
  [ ] Dashboard      (aggregates from all entities)
  [ ] Reports        (client-computed from Job + Invoice + Claim + Vendor queries)
```

---

## 10. Expected API Contracts by Module

All list endpoints should support:

```
?search=<string>      Full-text search across name, phone, reference numbers
?status=<value>       Filter by status enum value
?page=<number>        1-indexed page number (default: 1)
?limit=<number>       Items per page (default: 25, max: 100)
```

Paginated response envelope:
```json
{
  "data": [...],
  "total": 142,
  "page": 1,
  "limit": 25
}
```

### Vendors

```
GET    /vendors                  List with pagination + filters
GET    /vendors/:id              Single vendor
POST   /vendors                  Create
PUT    /vendors/:id              Update
DELETE /vendors/:id              Delete
```

Request body (POST/PUT): `CreateVendorDto` — `companyName`, `contactPerson`, `phone`, `email?`, `address?`, `city`, `gstNumber`, `status?`  
Response: `Vendor` — same fields + `id`, `createdAt`, `updatedAt`

### Customers

```
GET    /customers                ?search= ?city= ?page= ?limit=
GET    /customers/:id
POST   /customers                { name, phone, email?, address?, city?, vehicles?: [] }
PUT    /customers/:id
DELETE /customers/:id
```

Response includes computed `totalJobs` count.

### Products

```
GET    /products                 ?search= ?status= ?glassPosition= ?vehicleMake= ?page= ?limit=
GET    /products/:id
POST   /products                 CreateProductDto (backend computes stockStatus)
PUT    /products/:id
DELETE /products/:id
```

Backend computes `stockStatus` from `stockQty` vs `lowStockThreshold`.

### Stock

```
GET    /stock                    ?search= ?status= ?lowStockOnly=true ?page= ?limit=
PUT    /stock/adjust             { productId, adjustment: number, reason: string }
```

Stock is a read-only view of products' inventory levels. Only `adjust` mutates.

### Purchase Orders

```
GET    /purchase-orders          ?search= ?status= ?vendorId= ?page= ?limit=
GET    /purchase-orders/:id
POST   /purchase-orders          { vendorId, items: [{ productId?, productName, quantity, unitPrice }], expectedDeliveryDate?, notes? }
PUT    /purchase-orders/:id      { status?, expectedDeliveryDate?, notes? }
DELETE /purchase-orders/:id
```

Backend generates `poNumber`, computes line-item `totalPrice`, order `subtotal`, `gstAmount`, `totalAmount`, and denormalizes `vendorName` from `vendorId`.

### Technicians

```
GET    /technicians              ?search= ?status= ?specialization= ?page= ?limit=
GET    /technicians/:id
POST   /technicians              { name, phone, email?, specialization?, yearsExperience?, joiningDate? }
PUT    /technicians/:id          Partial<CreateTechnicianDto> + { status? }
DELETE /technicians/:id
```

`assignedJobs` and `completedJobs` are backend-computed aggregates.

### Jobs

```
GET    /jobs                     ?search= ?status= ?customerId= ?technicianId= ?dateFrom= ?dateTo= ?page= ?limit=
GET    /jobs/:id
POST   /jobs                     CreateJobDto (backend resolves customerName, technicianName from IDs)
PUT    /jobs/:id                 Partial<CreateJobDto> + { status?, completedDate? }
DELETE /jobs/:id
```

Backend must denormalize `customerName`, `customerPhone`, `technicianName` in the response (the frontend displays these directly).

### Invoices

```
GET    /invoices                 ?search= ?status= ?customerId= ?dateFrom= ?dateTo= ?page= ?limit=
GET    /invoices/:id
PUT    /invoices/:id             { status?, paidDate?, notes? }   (status update only — no full create yet)
DELETE /invoices/:id
```

Invoices are generated from Jobs in the current flow. `POST /invoices` can be added later.

### Insurance Claims

```
GET    /insurance-claims         ?search= ?status= ?insurer= ?customerId= ?page= ?limit=
GET    /insurance-claims/:id
POST   /insurance-claims         CreateClaimDto
PUT    /insurance-claims/:id     UpdateClaimDto: { status?, approvedAmount?, remarks?, surveyorName?, surveyorCompany?, surveyorVisitDate? }
DELETE /insurance-claims/:id
```

`customerBalance = claimedAmount - approvedAmount` is computed by backend.

### Dashboard

```
GET    /dashboard                No params — pre-computed snapshot
```

Response shape:
```ts
{
  kpis: [{ id, label, value, rawValue, change, trend, icon, variant }],
  recentCustomers: [{ id, name, phone, vehicleName, registrationNo, createdAt }],
  pendingClaims:   [{ id, claimNumber, customerName, insurer, claimedAmount, status }],
  recentJobs:      [{ id, jobNumber, customerName, vehicleName, glassPosition, status, scheduledDate }],
}
```

---

## 11. Denormalized Fields — Backend Responsibility

The frontend stores and displays these denormalized fields. The backend must populate them in API responses (not just IDs):

| Entity | Field | Denormalized from |
|--------|-------|-------------------|
| PurchaseOrder | `vendorName` | Vendor.companyName via vendorId |
| Job | `customerName`, `customerPhone` | Customer via customerId |
| Job | `technicianName` | Technician via technicianId |
| Job | `productName` | Product via productId |
| Invoice | `customerName`, `customerPhone` | Customer via customerId |
| Claim | `customerName` | Customer via customerId |

If the backend returns only IDs, use the adapter functions in `src/services/adapters.ts` with `transformResponse` in the RTK Query endpoint to resolve these.

---

## 12. Known Backend Dependencies

| Frontend feature | Backend requirement |
|-----------------|-------------------|
| Stock page | Backend must maintain a stock/inventory table keyed by productId |
| Job → Invoice linking | Jobs need an `invoiceId` or invoices need `jobId` foreign key |
| Claim timeline | `history: ClaimTimelineStep[]` — consider a separate `/claims/:id/timeline` endpoint rather than embedding in the claim response |
| Dashboard KPIs | Backend needs aggregate queries (or materialized views) for KPI computation |
| Reports page | Currently client-computed from raw data — will degrade with pagination; add a `/reports/summary` endpoint |
