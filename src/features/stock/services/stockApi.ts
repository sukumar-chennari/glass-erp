import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation, normalizeArray } from '@/services/mockUtils';
import { stockMock } from '@/mocks/stock';
import type { StockEntry, AdjustStockDto } from '@/types/models/stock';

export const stockApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStock: builder.query<StockEntry[], void>({
      ...mockableQuery<StockEntry[], void>({
        mockFn: () => stockMock.list(),
        url: '/stock',
        transformResponse: (raw) => normalizeArray<StockEntry>(raw, 'stock'),
      }),
      providesTags: ['Stock'],
    }),

    adjustStock: builder.mutation<StockEntry, AdjustStockDto>({
      ...mockableMutation<StockEntry, AdjustStockDto>({
        mockFn: (dto) => stockMock.adjust(dto),
        url: '/stock/adjust',
        method: 'POST',
      }),
      invalidatesTags: ['Stock', 'Product'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetStockQuery, useAdjustStockMutation } = stockApi;
