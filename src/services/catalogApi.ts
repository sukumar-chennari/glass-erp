import { baseApi } from '@/services/baseApi';
import { mockableQuery, normalizeArray } from '@/services/mockUtils';
import type { CatalogVariant, CatalogGlassType } from '@/types/models/catalog';

// ── Catalog listing ──────────────────────────────────────────────────────────

// Actual API response row shape (GET /catalog).
// Prices are nested under `price` keyed by brand name (e.g. { AIS: 2783, PK: 2 }).
// No top-level `id` field — rows are identified by variantId + glassPartTypeId composite.
export interface CatalogPricingRow {
  id:            string;   // synthetic: variantId_glassPartTypeId
  variantId:     string;
  glassPartTypeId: string;
  variantName:   string;
  glassPartType: string;
  carBrand:      string;
  carModel:      string;   // "model" in the raw response
  period:        string;
  cc:            number | null;
  bodyType:      string;   // joined array, e.g. "LMV"
  description:   string[]; // array of part description strings
  prices:        Record<string, number>;  // { AIS: 545, SG: 1, ... }
}

export interface CatalogListParams {
  page:  number;
  limit: number;
}

export interface CatalogListResponse {
  data:  CatalogPricingRow[];
  total: number;
  page:  number;
  limit: number;
}

// ── Upload result ────────────────────────────────────────────────────────────

export interface CatalogRowError {
  row?:     number;
  field?:   string;
  message:  string;
}

export interface CatalogUploadResult {
  brandsCreated:         number;
  modelsCreated:         number;
  variantsCreated:       number;
  glassPartTypesCreated: number;
  glassBrandsCreated:    number;
  pricingRowsCreated:    number;
  pricingRowsUpdated:    number;
  rowErrors:             CatalogRowError[];
}

export const catalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET /api/v1/catalog/variants?modelId=...&status=ACTIVE&limit=100
    getVariants: builder.query<CatalogVariant[], { modelId: string }>({
      ...mockableQuery<CatalogVariant[], { modelId: string }>({
        mockFn: () => [],
        url: '/catalog/variants',
        params: (arg) => ({ modelId: arg.modelId, page: 1, limit: 100 }),
        transformResponse: (raw) =>
          normalizeArray<Record<string, unknown>>(raw).map((v) => ({
            id:          v['id'] as string,
            modelId:     v['modelId'] as string,
            variantName: v['variantName'] as string,
            period:      (v['period'] as string | undefined) ?? '',
            status:      v['status'] as CatalogVariant['status'],
          })),
      }),
    }),

    // GET /api/v1/catalog/variants/{variantId}/glass-types
    // Response: plain array of { id, name, status, ... }
    getGlassTypes: builder.query<CatalogGlassType[], { variantId: string }>({
      ...mockableQuery<CatalogGlassType[], { variantId: string }>({
        mockFn: () => [],
        url: (arg) => `/catalog/variants/${arg.variantId}/glass-types`,
        transformResponse: (raw) =>
          normalizeArray<Record<string, unknown>>(raw).map((g) => ({
            id:     g['id'] as string,
            name:   g['name'] as string,
            status: g['status'] as CatalogGlassType['status'],
          })),
      }),
    }),

    // GET /api/v1/catalog?page=1&limit=20
    // Returns paginated pricing rows: one row per (variant × glass part type).
    // Prices are nested under the `price` key: { AIS: 545, SG: 1, PK: 2, ... }
    // No top-level id — composite key is variantId + glassPartTypeId.
    getCatalog: builder.query<CatalogListResponse, CatalogListParams>({
      query: ({ page, limit }) => ({ url: '/catalog', params: { page, limit } }),
      transformResponse: (raw: unknown): CatalogListResponse => {
        const r    = raw as Record<string, unknown>;
        const rows = Array.isArray(r['data']) ? (r['data'] as Record<string, unknown>[]) : [];
        const data = rows.map((row): CatalogPricingRow => {
          // Prices are in the nested `price` object keyed by brand name.
          const priceObj = (typeof row['price'] === 'object' && row['price'] !== null)
            ? (row['price'] as Record<string, unknown>)
            : {};
          const prices: Record<string, number> = {};
          for (const [brand, val] of Object.entries(priceObj)) {
            if (typeof val === 'number') prices[brand] = val;
          }

          const bodyTypeRaw = row['bodyType'];
          const bodyType = Array.isArray(bodyTypeRaw)
            ? (bodyTypeRaw as string[]).join(', ')
            : typeof bodyTypeRaw === 'string' ? bodyTypeRaw : '';

          const variantId      = String(row['variantId']      ?? '');
          const glassPartTypeId = String(row['glassPartTypeId'] ?? '');

          const descRaw   = row['description'];
          const description: string[] = Array.isArray(descRaw)
            ? (descRaw as unknown[]).map(String)
            : typeof descRaw === 'string' ? [descRaw] : [];

          return {
            id:              `${variantId}_${glassPartTypeId}`,
            variantId,
            glassPartTypeId,
            variantName:     String(row['variantName']   ?? ''),
            glassPartType:   String(row['glassPartType'] ?? ''),
            carBrand:        String(row['carBrand']      ?? ''),
            carModel:        String(row['model']         ?? ''),  // raw key is `model`
            period:          String(row['period']        ?? ''),
            cc:              typeof row['cc'] === 'number' ? row['cc'] : null,
            bodyType,
            description,
            prices,
          };
        });
        return {
          data,
          total: Number(r['total'] ?? 0),
          page:  Number(r['page']  ?? 1),
          limit: Number(r['limit'] ?? 20),
        };
      },
      providesTags: ['CatalogRow'],
    }),

    // POST /api/v1/catalog/upload — multipart/form-data, field: file (.xlsx only)
    // No mock: uploads are always live. RTK won't set Content-Type for FormData bodies.
    uploadCatalog: builder.mutation<CatalogUploadResult, FormData>({
      query: (formData) => ({
        url:    '/catalog/upload',
        method: 'POST',
        body:   formData,
      }),
      invalidatesTags: ['CatalogRow'],
    }),

    // GET /api/v1/catalog/variants/{variantId}/glass-types/{glassPartTypeId}/descriptions
    // Response: plain string[]
    getDescriptions: builder.query<string[], { variantId: string; glassPartTypeId: string }>({
      ...mockableQuery<string[], { variantId: string; glassPartTypeId: string }>({
        mockFn: () => [],
        url: (arg) =>
          `/catalog/variants/${arg.variantId}/glass-types/${arg.glassPartTypeId}/descriptions`,
        transformResponse: (raw) => (Array.isArray(raw) ? (raw as string[]) : []),
      }),
    }),

  }),
  overrideExisting: false,
});

export const {
  useGetCatalogQuery,
  useGetVariantsQuery,
  useGetGlassTypesQuery,
  useGetDescriptionsQuery,
  useUploadCatalogMutation,
} = catalogApi;
