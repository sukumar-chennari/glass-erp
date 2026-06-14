import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Base RTK Query API instance.
 *
 * All feature API slices call `baseApi.injectEndpoints(...)`.
 * This keeps one shared cache, one reducer, and one middleware entry.
 *
 * In mock mode (VITE_USE_MOCK_API=true) each endpoint defines a `queryFn`
 * that returns mock data directly — no HTTP requests are made.
 * In real mode the same endpoint uses `query` with a URL, handled by
 * `fetchBaseQuery`. Components are never aware of the difference.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('glass_erp_token');
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    'Dashboard',
    'Vendor',
    'Product',
    'Customer',
    'Technician',
    'PurchaseOrder',
    'Stock',
    'Job',
    'Invoice',
    'Claim',
    'Report',
  ],
  endpoints: () => ({}),
});
