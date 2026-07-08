import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';

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

// Raw fetch base
const rawBaseQuery = fetchBaseQuery({
  baseUrl:     import.meta.env.VITE_API_BASE_URL ?? '/api',
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('glass_erp_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

// TODO (backend): wrap rawBaseQuery once real API endpoints are active.
// When the server returns 401 or 403, clear the token and redirect to the
// login page with ?reason=session_expired so LoginPage can show the right message.
const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && (result.error.status === 401 || result.error.status === 403)) {
    localStorage.removeItem('glass_erp_token');
    // Guard: only redirect in browser; avoid redirect loops on the login page itself
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login?reason=session_expired';
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
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
    'Branch',
    'AppUser',
    'AdminSummary',
    'InsuranceRule',
    'VehicleModel',
    'AuthSession',
  ],
  endpoints: () => ({}),
});
