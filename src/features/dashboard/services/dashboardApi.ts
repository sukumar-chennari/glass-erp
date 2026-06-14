import { baseApi } from '@/services/baseApi';
import { mockableQuery } from '@/services/mockUtils';
import { MOCK_DASHBOARD } from '@/mocks/dashboard';
import type { DashboardData } from '@/types/models/dashboard';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<DashboardData, void>({
      ...mockableQuery({
        mockFn: () => MOCK_DASHBOARD,
        url:    '/dashboard',
      }),
      providesTags: ['Dashboard'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetDashboardQuery } = dashboardApi;
