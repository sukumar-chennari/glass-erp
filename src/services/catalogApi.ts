import { baseApi } from '@/services/baseApi';
import { mockableQuery, normalizeArray } from '@/services/mockUtils';
import type { CatalogVariant, CatalogGlassType } from '@/types/models/catalog';

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
  useGetVariantsQuery,
  useGetGlassTypesQuery,
  useGetDescriptionsQuery,
} = catalogApi;
