# Beta Readiness Checklist — WindX Glass ERP

> Track integration milestones before the beta launch.  
> **Legend:** ✅ Done  ⬜ Pending  🔧 Partial / Needs backend

---

## 1. Authentication

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1.1 | `POST /auth/login` endpoint exists | ⬜ | Backend task |
| 1.2 | Token stored after login (`glass_erp_token`) | ⬜ | Needs login screen |
| 1.3 | `Authorization: Bearer` header sent on all requests | ✅ | Wired in `baseApi.ts` |
| 1.4 | 401 response redirects user to login | ⬜ | Add RTK Query middleware |
| 1.5 | Token refresh flow (`POST /auth/refresh`) | ⬜ | Backend + frontend task |
| 1.6 | Logout clears token + Redux cache | ⬜ | Add `store.dispatch(baseApi.util.resetApiState())` |
| 1.7 | Login screen built | ⬜ | Not in current scope |
| 1.8 | Role-based access control (admin vs. technician vs. billing) | ⬜ | Not in current scope |

---

## 2. Pagination

| # | Item | Status | Notes |
|---|------|--------|-------|
| 2.1 | `getJobs` supports `?page=&limit=` | ⬜ | High priority — unbounded list |
| 2.2 | `getInvoices` supports pagination | ⬜ | High priority |
| 2.3 | `getClaims` supports pagination | ⬜ | High priority |
| 2.4 | `getProducts` supports pagination | ⬜ | Medium priority |
| 2.5 | `getVendors` supports pagination | ⬜ | Medium priority |
| 2.6 | `getCustomers` supports pagination | ⬜ | Medium priority |
| 2.7 | `getPurchaseOrders` supports pagination | ⬜ | Medium priority |
| 2.8 | Frontend DataTable supports page controls | ⬜ | Add pagination props to DataTable component |
| 2.9 | RTK Query hooks updated to accept pagination params | ⬜ | Add `VendorListParams` etc. interfaces |
| 2.10 | Total count displayed in table header | ⬜ | Already shows count — wire from API response |

---

## 3. Server-Side Filtering

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.1 | Global search input per list page | ⬜ | Frontend: add search bar above each table |
| 3.2 | `getVendors` accepts `?search=&status=` | ⬜ | Backend task |
| 3.3 | `getProducts` accepts `?search=&status=&glassPosition=` | ⬜ | Backend task |
| 3.4 | `getJobs` accepts `?search=&status=&customerId=&dateFrom=&dateTo=` | ⬜ | Backend task |
| 3.5 | `getInvoices` accepts `?search=&status=&dateFrom=&dateTo=` | ⬜ | Backend task |
| 3.6 | `getClaims` accepts `?search=&status=&insurer=` | ⬜ | Backend task |
| 3.7 | `getStock` accepts `?search=&status=&lowStockOnly=` | ⬜ | Backend task |
| 3.8 | Status filter dropdown on Jobs/Invoices/Claims pages | ⬜ | Frontend task |
| 3.9 | Date range picker on Jobs/Invoices pages | ⬜ | Frontend task (add date-fns or dayjs) |

---

## 4. getById Endpoints

Required before detail pages or direct URL navigation can work.

| # | Item | Status | Notes |
|---|------|--------|-------|
| 4.1 | `GET /vendors/:id` | ⬜ | Backend task |
| 4.2 | `GET /products/:id` | ⬜ | Backend task |
| 4.3 | `GET /customers/:id` | ⬜ | Backend task |
| 4.4 | `GET /technicians/:id` | ⬜ | Backend task |
| 4.5 | `GET /purchase-orders/:id` | ⬜ | Backend task |
| 4.6 | `GET /jobs/:id` | ⬜ | Backend task |
| 4.7 | `GET /invoices/:id` | ⬜ | Backend task |
| 4.8 | `GET /insurance-claims/:id` | ⬜ | Backend task |
| 4.9 | `getVendor(id)` RTK Query endpoint added | ⬜ | Frontend: add to each API slice |
| 4.10 | Detail page routes wired (`/vendors/:id`, `/jobs/:id`) | ⬜ | New screens not yet built |

---

## 5. Route-Level Error Handling

| # | Item | Status | Notes |
|---|------|--------|-------|
| 5.1 | Router `errorElement` catches unhandled route errors | ✅ | `RouterErrorPage` wired in router |
| 5.2 | `ErrorBoundary` component available for subtree wrapping | ✅ | `src/components/ErrorBoundary/` |
| 5.3 | API 404 on direct URL navigation shows error page | ⬜ | Depends on getById endpoints |
| 5.4 | Global unhandled rejection handler (network down) | ⬜ | Add to `main.tsx` |
| 5.5 | Offline detection / banner | ⬜ | Optional for beta |

---

## 6. Mutation Error Handling

| # | Item | Status | Notes |
|---|------|--------|-------|
| 6.1 | All mutations wrapped in try/catch | ✅ | Done in all 9 page files |
| 6.2 | `toast.error()` shown on mutation failure | ✅ | Done |
| 6.3 | `toast.success()` shown on mutation success | ✅ | Done |
| 6.4 | Delete loading state prevents double-click | ✅ | `isLoading: deleting` on ConfirmDialog |
| 6.5 | Form stays open on submit error (not closed prematurely) | ✅ | `closeModal()` only called in try block |
| 6.6 | 400 field-level validation errors shown inline | ⬜ | Wire `details` from error to `setError()` |
| 6.7 | 401 on mutation redirects to login | ⬜ | Add RTK middleware |
| 6.8 | Retry logic for transient network failures | ⬜ | Optional — add `retry` to baseApi |

---

## 7. Loading and Empty States

| # | Item | Status | Notes |
|---|------|--------|-------|
| 7.1 | Table skeleton loading during initial fetch | ✅ | DataTable handles via `isLoading` |
| 7.2 | Empty state message in each table | ✅ | `emptyMessage` prop on DataTable |
| 7.3 | Submit button shows loading during mutation | ✅ | `loading={isSubmitting}` on buttons |
| 7.4 | Delete button shows loading in ConfirmDialog | ✅ | `isLoading={deleting}` |
| 7.5 | `isError` from getVendors/etc. shows error state | ⬜ | Only DashboardPage handles isError |
| 7.6 | Retry button on fetch failure | ⬜ | Add to each page's error state |
| 7.7 | Stock alert badge shows only when relevant | ✅ | Shows when `alertCount > 0` |
| 7.8 | Dashboard error state visible | ✅ | DashboardPage has isError UI |

---

## 8. Audit Fields

| # | Item | Status | Notes |
|---|------|--------|-------|
| 8.1 | `createdAt` on all entities | ✅ | Present in all models |
| 8.2 | `updatedAt` on all entities | 🔧 | Missing from Job, Stock |
| 8.3 | `createdBy` (user ID) on all entities | ⬜ | Not in current models |
| 8.4 | `updatedBy` on Stock adjustments | ⬜ | Not in StockEntry model |
| 8.5 | Claim timeline tracks actor per step | ⬜ | ClaimTimelineStep has no `actor` field |
| 8.6 | Soft delete vs hard delete decision | ⬜ | Current: hard delete. Add `deletedAt?` if needed |

---

## 9. Accessibility Review

| # | Item | Status | Notes |
|---|------|--------|-------|
| 9.1 | All form inputs have `label` prop | ✅ | Input/Select components enforce this |
| 9.2 | Icon-only buttons have `aria-label` | ✅ | Edit/Delete table buttons |
| 9.3 | Modals have `role="dialog" aria-modal="true"` | ✅ | Modal component |
| 9.4 | Focus trap inside modals | ⬜ | Not implemented — add `focus-trap-react` |
| 9.5 | Focus returns to trigger after modal close | ⬜ | Not implemented |
| 9.6 | Toast container has `aria-live="polite"` | ✅ | Toast component |
| 9.7 | Keyboard navigation through table rows | ⬜ | Not implemented |
| 9.8 | Spinner has `role="status" aria-label` | ✅ | Spinner component |
| 9.9 | Colour is not the only indicator of status | ✅ | StatusBadge shows text label too |
| 9.10 | Sufficient colour contrast (WCAG AA) | ⬜ | Run audit with axe DevTools |

---

## 10. Production Environment Verification

| # | Item | Status | Notes |
|---|------|--------|-------|
| 10.1 | `VITE_USE_MOCK_API=false` in `.env.production` | ⬜ | Set before deploy |
| 10.2 | `VITE_API_BASE_URL` points to production API | ⬜ | Set before deploy |
| 10.3 | CORS configured on backend for production domain | ⬜ | Backend task |
| 10.4 | `npm run build` produces no TypeScript errors | ✅ | Confirmed passing |
| 10.5 | Bundle size within acceptable limits | ✅ | 1,270 kB JS / 285 kB gzip — consider code splitting |
| 10.6 | Code splitting / lazy loading per route | ⬜ | All routes eagerly loaded — add `React.lazy()` |
| 10.7 | Content Security Policy (CSP) headers configured | ⬜ | Server/CDN task |
| 10.8 | HTTPS enforced | ⬜ | Infra task |
| 10.9 | Error tracking (Sentry / Datadog) integrated | ⬜ | Wire `ErrorBoundary.componentDidCatch` to Sentry |
| 10.10 | Environment secrets not committed to git | ⬜ | Verify `.gitignore` covers `.env.*` except `.env.example` |

---

## 11. Large Dataset Verification

| # | Item | Status | Notes |
|---|------|--------|-------|
| 11.1 | Jobs list loads in < 2s with 1,000 records | ⬜ | Requires pagination |
| 11.2 | Invoices list loads in < 2s with 5,000 records | ⬜ | Requires pagination |
| 11.3 | Stock table renders 200 SKUs without jank | ⬜ | Test in dev tools throttled mode |
| 11.4 | Reports page KPI computation handles 10k+ jobs | ⬜ | Move computation to backend `/reports/summary` |
| 11.5 | Customer search is server-side, not in-memory filter | ⬜ | All search currently client-side |
| 11.6 | Dashboard KPIs load < 1s (backend aggregation) | ⬜ | Backend needs optimised aggregate queries |

---

## Summary Progress

| Category | Done | Pending |
|----------|------|---------|
| Authentication | 1/8 | 7 |
| Pagination | 0/10 | 10 |
| Server-Side Filtering | 0/9 | 9 |
| getById Endpoints | 0/10 | 10 |
| Route Error Handling | 2/5 | 3 |
| Mutation Error Handling | 5/8 | 3 |
| Loading / Empty States | 5/8 | 3 |
| Audit Fields | 1/6 | 5 |
| Accessibility | 5/10 | 5 |
| Production Env | 2/10 | 8 |
| Large Dataset | 0/6 | 6 |
| **TOTAL** | **21/90** | **69** |

> The 21 completed items are all frontend-side. The 69 remaining are primarily backend API tasks (pagination, filtering, getById, auth) plus frontend polish that depends on them.
