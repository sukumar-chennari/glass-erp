# API Migration Example — Vendors Module (Mock → Real)

> **Purpose:** Step-by-step guide for migrating one module from mock RTK Query to a real REST API.  
> **Module chosen:** Vendors — lowest dependency, no cross-module data resolution required.  
> **Applies to:** All other modules follow the same pattern.

---

## 1. Current Mock Flow

```
VendorsPage.tsx
  → useGetVendorsQuery()           RTK Query hook
    → vendorsApi.getVendors        RTK endpoint (VITE_USE_MOCK_API=true)
      → queryFn: vendorMock.list() In-memory array in src/mocks/vendors.ts
        → delay(350ms)             Simulated network delay
          → returns Vendor[]       Directly matches frontend type
```

```ts
// src/features/vendors/services/vendorsApi.ts (current)
getVendors: builder.query<Vendor[], void>({
  ...mockableQuery<Vendor[], void>({
    mockFn: () => vendorMock.list(),
    url: '/vendors',           // ← real URL ready, just unused in mock mode
  }),
  providesTags: ['Vendor'],
}),
```

The `url: '/vendors'` is already wired — switching to real mode uses it automatically.

---

## 2. Target Real Endpoint Mapping

| Frontend action | HTTP method | Endpoint | Notes |
|-----------------|-------------|----------|-------|
| Load vendor list | `GET` | `/vendors` | With pagination + filter params |
| Get single vendor | `GET` | `/vendors/:id` | **Not yet added** — needed for detail page |
| Create vendor | `POST` | `/vendors` | Body: `CreateVendorDto` |
| Update vendor | `PUT` | `/vendors/:id` | Body: `UpdateVendorDto` (partial) |
| Delete vendor | `DELETE` | `/vendors/:id` | Returns `204 No Content` |

**Minimum backend requirements to make the Vendors page functional with real data:**
- `GET /vendors` returning an array (or paginated object) of vendor records
- `POST /vendors`, `PUT /vendors/:id`, `DELETE /vendors/:id` for mutations

---

## 3. Request/Response DTO Expectations

### GET /vendors response

If backend returns **camelCase matching the frontend model** (ideal case — no adapter needed):

```json
[
  {
    "id": "ven-001",
    "companyName": "RG Glass Works",
    "contactPerson": "Rajesh Gupta",
    "phone": "9876543210",
    "email": "rg@rgglassworks.com",
    "address": "14, Industrial Area",
    "city": "Mumbai",
    "gstNumber": "27AABCR1234A1Z5",
    "status": "Active",
    "createdAt": "2025-01-15T09:30:00.000Z",
    "updatedAt": "2025-06-01T14:22:00.000Z"
  }
]
```

If backend returns **snake_case** (common in Python/Django/Rails backends):

```json
{
  "data": [
    {
      "id": "ven-001",
      "company_name": "RG Glass Works",
      "contact_person": "Rajesh Gupta",
      "phone": "9876543210",
      "gst_number": "27AABCR1234A1Z5",
      "status": "Active",
      "created_at": "2025-01-15T09:30:00.000Z"
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 25
}
```

### POST /vendors request body

```json
{
  "companyName": "New Supplier Ltd",
  "contactPerson": "Amit Shah",
  "phone": "9988776655",
  "city": "Chennai",
  "gstNumber": "33AABCN1234A1Z5"
}
```

Backend generates `id`, `createdAt`. Frontend DTO excludes them.

### PUT /vendors/:id request body

Same fields as POST, all optional. Backend merges only provided fields.

---

## 4. Adapter/Mapper Example

Use this when backend shape differs from the frontend model.

**Scenario: Backend returns snake_case + paginated wrapper**

```ts
// src/services/adapters.ts (already exists — add your types here)

export interface BackendVendor {
  id:             string;
  company_name:   string;
  contact_person: string;
  phone:          string;
  email?:         string;
  address?:       string;
  city:           string;
  gst_number:     string;
  status:         string;
  created_at:     string;
  updated_at?:    string;
}

export function adaptVendor(raw: BackendVendor): Vendor {
  return {
    id:            raw.id,
    companyName:   raw.company_name,
    contactPerson: raw.contact_person,
    phone:         raw.phone,
    email:         raw.email,
    address:       raw.address,
    city:          raw.city,
    gstNumber:     raw.gst_number,
    status:        raw.status as VendorStatus,
    createdAt:     raw.created_at,
    updatedAt:     raw.updated_at,
  };
}
```

**Using the adapter in the API slice:**

```ts
// src/features/vendors/services/vendorsApi.ts
import { adaptVendor, type BackendVendor } from '@/services/adapters';
import type { PaginatedResponse } from '@/types/api';

getVendors: builder.query<Vendor[], VendorListParams>({
  query: (params) => ({ url: '/vendors', params }),
  transformResponse: (raw: PaginatedResponse<BackendVendor> | BackendVendor[]) => {
    const items = Array.isArray(raw) ? raw : raw.data;
    return items.map(adaptVendor);
  },
  providesTags: ['Vendor'],
}),
```

**DTO serializer (when payload must be snake_case):**

```ts
// src/services/adapters.ts
export function serializeVendorDto(dto: CreateVendorDto): Partial<BackendVendor> {
  return {
    company_name:   dto.companyName,
    contact_person: dto.contactPerson,
    phone:          dto.phone,
    email:          dto.email,
    address:        dto.address,
    city:           dto.city,
    gst_number:     dto.gstNumber,
  };
}

// In the API slice:
createVendor: builder.mutation<Vendor, CreateVendorDto>({
  query: (dto) => ({
    url: '/vendors',
    method: 'POST',
    body: serializeVendorDto(dto),
  }),
  transformResponse: (raw: BackendVendor) => adaptVendor(raw),
  invalidatesTags: ['Vendor'],
}),
```

---

## 5. Final API Slice (Real Mode)

Complete replacement for `src/features/vendors/services/vendorsApi.ts`:

```ts
import { baseApi } from '@/services/baseApi';
import { adaptVendor, serializeVendorDto, type BackendVendor } from '@/services/adapters';
import type { Vendor, CreateVendorDto, UpdateVendorDto } from '@/types/models/vendor';
import type { PaginatedResponse } from '@/types/api';

interface VendorListParams {
  search?: string;
  status?: string;
  page?:   number;
  limit?:  number;
}

interface UpdateVendorArg extends UpdateVendorDto {
  id: string;
}

export const vendorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getVendors: builder.query<Vendor[], VendorListParams | void>({
      query: (params) => ({ url: '/vendors', params: params ?? {} }),
      transformResponse: (raw: PaginatedResponse<BackendVendor> | BackendVendor[]) => {
        const items = Array.isArray(raw) ? raw : raw.data;
        return items.map(adaptVendor);
      },
      providesTags: ['Vendor'],
    }),

    getVendor: builder.query<Vendor, string>({
      query: (id) => `/vendors/${id}`,
      transformResponse: (raw: BackendVendor) => adaptVendor(raw),
      providesTags: (_, __, id) => [{ type: 'Vendor', id }],
    }),

    createVendor: builder.mutation<Vendor, CreateVendorDto>({
      query: (dto) => ({
        url: '/vendors',
        method: 'POST',
        body: serializeVendorDto(dto),  // omit if backend accepts camelCase
      }),
      transformResponse: (raw: BackendVendor) => adaptVendor(raw),
      invalidatesTags: ['Vendor'],
    }),

    updateVendor: builder.mutation<Vendor, UpdateVendorArg>({
      query: ({ id, ...dto }) => ({
        url: `/vendors/${id}`,
        method: 'PUT',
        body: serializeVendorDto(dto),
      }),
      transformResponse: (raw: BackendVendor) => adaptVendor(raw),
      invalidatesTags: ['Vendor'],
    }),

    deleteVendor: builder.mutation<void, string>({
      query: (id) => ({ url: `/vendors/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Vendor'],
    }),

  }),
  overrideExisting: false,
});

export const {
  useGetVendorsQuery,
  useGetVendorQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
} = vendorsApi;
```

> **Note:** If backend returns camelCase already, remove `serializeVendorDto` / `adaptVendor` and delete `transformResponse`. The query just returns the data directly.

---

## 6. providesTags / invalidatesTags Expectations

| Scenario | Tags |
|----------|------|
| `getVendors` (list) | `providesTags: ['Vendor']` |
| `getVendor` (single) | `providesTags: [{ type: 'Vendor', id }]` |
| `createVendor` | `invalidatesTags: ['Vendor']` — refetches list |
| `updateVendor` | `invalidatesTags: ['Vendor']` — or `[{ type: 'Vendor', id }]` for targeted |
| `deleteVendor` | `invalidatesTags: ['Vendor']` |

Vendors don't affect other module data, so no cross-module invalidation is needed.

---

## 7. Verification Checklist for Vendors Integration

### Setup
- [ ] `VITE_USE_MOCK_API=false` in env file
- [ ] `VITE_API_BASE_URL` points to real API base
- [ ] Auth token is stored after login (`localStorage.setItem('glass_erp_token', token)`)
- [ ] `Authorization: Bearer <token>` header appears in DevTools Network tab

### List behaviour
- [ ] Vendors list loads from real backend (check Network tab for `GET /vendors`)
- [ ] Response is an array or paginated wrapper — frontend renders it correctly
- [ ] Loading skeleton shows while fetching
- [ ] Empty state message shows when list is empty (`No vendors found...`)
- [ ] Console has no TypeScript / runtime errors

### Create
- [ ] Clicking "Add Vendor" opens modal
- [ ] Submitting the form sends `POST /vendors` with correct payload
- [ ] Success toast appears: "Vendor added"
- [ ] Modal closes and list refreshes with new vendor
- [ ] Validation error (400) from API shows `toast.error("Failed to save vendor")`

### Update
- [ ] Clicking Edit opens modal pre-filled with vendor data
- [ ] Submitting sends `PUT /vendors/:id`
- [ ] Success toast: "Vendor updated"
- [ ] List refreshes with updated data

### Delete
- [ ] Clicking Delete opens `ConfirmDialog` (not `window.confirm`)
- [ ] Confirming sends `DELETE /vendors/:id`
- [ ] Success toast: "Vendor removed"
- [ ] Vendor disappears from list
- [ ] Delete loading state shows on ConfirmDialog button while request is in flight

### Error cases
- [ ] Network error (API down): toast.error shown, modal stays open
- [ ] 401 Unauthorized: user is redirected to login
- [ ] 404 on delete (already deleted): toast.error shown, dialog closes gracefully
- [ ] 400 Validation: toast.error shown (field-level errors optional for now)

### Performance
- [ ] Navigating away and back to Vendors does not re-fetch (cache is valid)
- [ ] After a create/update, navigating away and back does re-fetch (tags invalidated)
