import { baseApi } from '@/services/baseApi';
import { mockableQuery, normalizeArray } from '@/services/mockUtils';
import { adminSummaryMock } from '@/mocks/adminSummary';
import type { AdminSummary, BranchPerformanceRow } from '@/types/models/adminSummary';

export const adminSummaryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminSummary: builder.query<AdminSummary, void>({
      ...mockableQuery<AdminSummary, void>({
        mockFn: () => adminSummaryMock.getAdminSummary(),
        url: '/dashboard/admin-summary',
      }),
      providesTags: ['AdminSummary'],
    }),

    getBranchPerformance: builder.query<BranchPerformanceRow[], void>({
      ...mockableQuery<BranchPerformanceRow[], void>({
        mockFn: () => adminSummaryMock.getBranchPerformance(),
        url: '/reports/branch-summary',
        params: () => ({ period: 'today' }),
        transformResponse: (raw) => normalizeArray<BranchPerformanceRow>(raw, 'branches'),
      }),
      providesTags: ['AdminSummary'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAdminSummaryQuery,
  useGetBranchPerformanceQuery,
} = adminSummaryApi;
