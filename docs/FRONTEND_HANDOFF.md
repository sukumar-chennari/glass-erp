# Frontend Handoff Guide — WindX Glass ERP

> **Audience:** Frontend developers joining the project  
> **Stack:** React 18 + TypeScript (strict) + Vite + Redux Toolkit + React Router v6

---

## 1. Folder Structure

```
glass-erp-admin/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/          # App shell, sidebar, page wrappers
│   │   │   ├── AppLayout/   # Root layout (sidebar + main)
│   │   │   ├── PageShell/   # Per-page heading + card wrappers
│   │   │   └── Sidebar/     # Navigation sidebar
│   │   └── ui/              # Design system primitives
│   │       ├── Badge/
│   │       ├── Button/
│   │       ├── ConfirmDialog/
│   │       ├── DataTable/
│   │       ├── ErrorBoundary/
│   │       ├── Input/
│   │       ├── KpiCard/
│   │       ├── Modal/
│   │       ├── Select/
│   │       ├── Spinner/
│   │       ├── StatusBadge/
│   │       └── Toast/
│   ├── constants/
│   │   ├── labels.ts        # All user-facing text strings
│   │   ├── nav.ts           # Sidebar navigation config
│   │   ├── routes.ts        # Route path constants
│   │   └── statuses.ts      # Status enums + display maps
│   ├── features/            # One folder per business domain
│   │   ├── dashboard/
│   │   ├── vendors/
│   │   ├── products/
│   │   ├── customers/
│   │   ├── technicians/
│   │   ├── purchaseOrders/
│   │   ├── stock/
│   │   ├── jobs/
│   │   ├── invoices/
│   │   ├── claims/
│   │   ├── reports/
│   │   └── settings/
│   ├── mocks/               # In-memory CRUD stores (mock mode only)
│   ├── router/              # createBrowserRouter config
│   ├── services/
│   │   ├── baseApi.ts       # RTK createApi instance
│   │   ├── mockUtils.ts     # mockableQuery / mockableMutation
│   │   └── adapters.ts      # Backend response shape adapters
│   ├── store/               # Redux store setup
│   ├── styles/              # globals.css + reset
│   ├── theme/               # Design token definitions
│   │   ├── tokens.ts        # Raw values
│   │   └── semantic.ts      # Semantic mappings
│   └── types/
│       ├── models/          # TypeScript interfaces per entity
│       ├── enums.ts         # Shared domain union types
│       ├── api.ts           # Generic response wrappers
│       └── ui.ts            # UI-only types (TableColumn, SelectOption, etc.)
├── docs/                    # This handoff documentation
├── .env.development
└── .env.production
```

---

## 2. Feature Module Pattern

Every business domain follows the same structure:

```
src/features/vendors/
├── VendorsPage.tsx            # Route component — owns state, calls hooks
├── VendorsPage.module.css
├── components/
│   ├── VendorTable.tsx        # Presentational — receives data as props
│   ├── VendorTable.module.css
│   ├── VendorModal.tsx        # React Hook Form modal for add/edit
│   └── VendorModal.module.css
└── services/
    └── vendorsApi.ts          # RTK Query endpoints (mock + real switch)
```

**What lives where:**

| Concern | Location |
|---------|----------|
| Server state (fetch, mutate) | `services/<name>Api.ts` via RTK Query |
| Local UI state (modal open, delete target) | `<Name>Page.tsx` via useState |
| Form state (field values, validation) | `<Name>Modal.tsx` via React Hook Form |
| Shared display logic | Shared components in `components/ui/` |

---

## 3. Shared Components Reference

### Layout

| Component | Usage |
|-----------|-------|
| `PageShell` | Wraps every page — provides heading, description, action slot |
| `SectionCard` | White card container for table or form sections |
| `SectionHeader` | Section title inside a card |

### UI Primitives

| Component | Key Props |
|-----------|-----------|
| `Button` | `variant` (primary/secondary/danger/ghost), `leftIcon`, `loading`, `disabled` |
| `Input` | `label`, `error`, `hint`, `fullWidth`, `disabled` — always use with React Hook Form `register()` |
| `Select` | `label`, `options: SelectOption[]`, `error` |
| `Modal` | `isOpen`, `onClose`, `title`, `footer`, `maxWidth` |
| `DataTable<T>` | `columns: TableColumn<T>[]`, `data`, `isLoading`, `emptyMessage` |
| `StatusBadge` | `statusMap: Record<string, StatusDisplay>`, `value` — never use inline color logic |
| `Badge` | `variant` (success/warning/danger/info/neutral/primary) |
| `ConfirmDialog` | `isOpen`, `message`, `onConfirm`, `onCancel`, `isLoading` |
| `ToastProvider` + `useToast` | Wrap at app root; call `toast.success/error/info()` in mutation handlers |
| `ErrorBoundary` | Class component — wrap critical subtrees; `RouterErrorPage` is wired in router |

---

## 4. Theme and Token System

### Token flow

```
src/theme/tokens.ts          Raw values (colors, spacing scale, radii, fonts)
        ↓
src/theme/semantic.ts        Semantic mappings (color-primary → brand-600, etc.)
        ↓
src/styles/globals.css       :root { --color-primary: #...; --space-4: 1rem; ... }
        ↓
Component CSS modules        background: var(--color-primary);
```

**Rule:** Never use raw hex values or pixel literals in component CSS files. Always use `var(--token-name)`.

### Core token groups

| Group | Examples |
|-------|---------|
| Colors | `--color-primary`, `--color-danger`, `--color-text-primary`, `--color-text-muted`, `--color-bg-subtle`, `--color-border` |
| Spacing | `--space-1` through `--space-10` (4px increments) |
| Typography | `--font-size-xs` through `--font-size-xl`, `--font-weight-*` |
| Radius | `--radius-sm`, `--radius-md`, `--radius-lg` |
| Shadows | `--shadow-sm`, `--shadow-md` |
| Transitions | `--transition-fast`, `--transition-base` |

### Changing the brand color

Edit **only** `src/theme/tokens.ts`. Update the primary hue values. All components update automatically via CSS custom properties.

---

## 5. Semantic CSS Variable Flow

Status colors are computed via the status system — not hardcoded:

```ts
// src/constants/statuses.ts
export const VENDOR_STATUS_MAP: Record<VendorStatus, StatusDisplay> = {
  'Active':   { label: 'Active',   variant: 'success' },
  'On Hold':  { label: 'On Hold',  variant: 'warning' },
  'Inactive': { label: 'Inactive', variant: 'neutral' },
};

// In a table component:
<StatusBadge statusMap={VENDOR_STATUS_MAP} value={vendor.status} />
// StatusBadge looks up the variant → Badge renders the correct token
```

To add a new status value: add to `statuses.ts` only. Table and badge rendering update automatically.

---

## 6. Reusable Hooks and Utilities

| Hook/Utility | Location | Purpose |
|-------------|----------|---------|
| `useToast()` | `components/ui/Toast` | Show success/error/info toasts |
| `formatINR()` | `services/mockUtils.ts` | Format numbers as Indian currency |
| `adaptVendor()`, `adaptJob()` | `services/adapters.ts` | Map backend shapes to frontend models |
| `serializeVendorDto()` | `services/adapters.ts` | Map frontend DTOs to backend payload format |

---

## 7. How to Add a New Screen / Module

Follow these steps in order:

### Step 1 — Define the types

Create `src/types/models/<entity>.ts`:

```ts
import type { YourStatus } from '@/constants/statuses';

export interface YourEntity {
  id:        string;
  name:      string;
  status:    YourStatus;
  createdAt: string;
}

export interface CreateYourEntityDto {
  name: string;
}

export interface UpdateYourEntityDto extends Partial<CreateYourEntityDto> {
  status?: YourStatus;
}
```

Export from `src/types/models/index.ts`.

### Step 2 — Add status constants (if new status type)

In `src/constants/statuses.ts`, add:

```ts
export const YOUR_STATUS = { ACTIVE: 'Active', INACTIVE: 'Inactive' } as const;
export type YourStatus = typeof YOUR_STATUS[keyof typeof YOUR_STATUS];
export const YOUR_STATUS_MAP: Record<YourStatus, StatusDisplay> = { ... };
```

### Step 3 — Create the mock store

Create `src/mocks/<entity>.ts`:

```ts
import type { YourEntity, CreateYourEntityDto } from '@/types/models/<entity>';

let store: YourEntity[] = [ /* seed data */ ];

export const yourEntityMock = {
  list:   ():                              YourEntity[] => [...store],
  create: (dto: CreateYourEntityDto):     YourEntity  => { const item = { id: crypto.randomUUID(), ...dto, createdAt: new Date().toISOString() }; store = [...store, item]; return item; },
  update: (id: string, dto: Partial<CreateYourEntityDto>): YourEntity  => { const i = store.findIndex(x => x.id === id); if (i === -1) throw new Error('Not found'); store = store.map((x, j) => j === i ? { ...x, ...dto } : x); return store[i]; },
  remove: (id: string):                   string      => { store = store.filter(x => x.id !== id); return id; },
};
```

### Step 4 — Create the API slice

Create `src/features/<name>/services/<name>Api.ts`:

```ts
import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation } from '@/services/mockUtils';
import { yourEntityMock } from '@/mocks/<entity>';
import type { YourEntity, CreateYourEntityDto, UpdateYourEntityDto } from '@/types/models/<entity>';

export const yourApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getYourEntities: builder.query<YourEntity[], void>({
      ...mockableQuery({ mockFn: () => yourEntityMock.list(), url: '/your-entity' }),
      providesTags: ['YourEntity'],   // must be registered in baseApi.ts tagTypes
    }),
    createYourEntity: builder.mutation<YourEntity, CreateYourEntityDto>({
      ...mockableMutation({ mockFn: (dto) => yourEntityMock.create(dto), url: '/your-entity', method: 'POST' }),
      invalidatesTags: ['YourEntity'],
    }),
    // ... updateYourEntity, deleteYourEntity
  }),
  overrideExisting: false,
});

export const { useGetYourEntitiesQuery, useCreateYourEntityMutation } = yourApi;
```

**Register the tag:** Add `'YourEntity'` to the `tagTypes` array in `src/services/baseApi.ts`.

### Step 5 — Build the page and components

Create `src/features/<name>/`:
- `<Name>Page.tsx` — use `useToast`, `useState` for modal/delete state, `ConfirmDialog`
- `components/<Name>Table.tsx` — uses `DataTable<YourEntity>` with `TableColumn<YourEntity>[]`
- `components/<Name>Modal.tsx` — uses `useForm` + `zodResolver`, `Input`, `Select`, `Modal`

### Step 6 — Wire the route

In `src/router/index.tsx`, add:
```ts
{ path: ROUTES.YOUR_ENTITY, element: <YourEntityPage /> }
```

In `src/constants/routes.ts`, add:
```ts
export const ROUTES = { ..., YOUR_ENTITY: '/your-entity' } as const;
```

In `src/constants/nav.ts`, add a nav item entry.

---

## 8. How to Add a New RTK Query Tag

1. Open `src/services/baseApi.ts`
2. Add the new tag string to `tagTypes`:
   ```ts
   tagTypes: ['Vendor', ..., 'YourNewTag'],
   ```
3. Use `providesTags: ['YourNewTag']` in queries and `invalidatesTags: ['YourNewTag']` in mutations.

Tag names are plain strings. There is no registry file — `baseApi.ts` is the single source of truth.

---

## 9. Keeping UI Types Separate from API DTOs

The frontend maintains two layers of types:

| Layer | Purpose | Example |
|-------|---------|---------|
| **Entity interface** (`Job`, `Vendor`) | Represents the display model — may include denormalized strings, computed fields | `Job.customerName` (string displayed in table) |
| **DTO** (`CreateJobDto`, `UpdateJobDto`) | Represents the API payload — only sendable fields | `CreateJobDto.customerId` (ID only, not name) |
| **Backend shape** (`BackendJob`, `BackendVendor`) | What the API actually returns (may be snake_case, different structure) | `BackendJob.customer_name` |

Use `src/services/adapters.ts` to map between the backend shape and the frontend entity interface in `transformResponse`.

**Rule:** Components only import from entity interfaces and DTOs. They never construct or inspect `BackendX` shapes. The adapter layer is the only place where backend-specific knowledge lives.

---

## 10. Current Technical Debt and Refactor Opportunities

| Item | Effort | Impact |
|------|--------|--------|
| Extract `.tableHeader` / `.count` CSS (9 duplicates) | Low | Medium |
| Extract modal `.footer` / `.row` CSS (9 duplicates) | Low | Medium |
| `useCrudModal` custom hook for CRUD page state | Medium | High — eliminates ~20 lines of identical boilerplate per page |
| Claim `history[]` array — move to separate `/claims/:id/timeline` endpoint | Medium | High — prevents bloated claim response |
| Add `getById` endpoint to all modules | Medium | High — needed for detail pages |
| Pagination support in list endpoints | Medium | High — required before production launch |
| Server-side search/filter params | Medium | High — all filter logic is currently client-side |
| Reports page date range filter | Medium | Medium |
| Replace `window.confirm` remaining usage | Done | — |
| `useCrudModal` hook | Low | Medium |
