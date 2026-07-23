import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { getToken, setToken, clearAuth, getRefreshToken, setRefreshToken, mapSession, notifySessionRefreshed } from '@/services/auth/http';
import type { BackendAuthResponse } from '@/services/auth/types';

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

function getBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? '/api';
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl:     getBaseUrl(),
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = getToken();  // reads from in-memory module variable (http.ts)
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

// Promise-based mutex: if multiple RTK queries 401 at the same moment (e.g. on
// page load with an expired token), only one /auth/refresh call is made.
// All concurrent callers share the same promise and get the same result.
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async (): Promise<boolean> => {
    try {
      const rt = getRefreshToken();
      const res = await fetch(`${getBaseUrl()}/auth/refresh`, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify(rt ? { refreshToken: rt } : {}),
      });
      if (res.ok) {
        const data = await res.json() as BackendAuthResponse;
        setToken(data.accessToken);
        if (data.refreshToken) setRefreshToken(data.refreshToken);
        notifySessionRefreshed(mapSession(data as unknown as Record<string, unknown>));
        return true;
      }
    } catch { /* network error — treat as failed refresh */ }
    return false;
  })().finally(() => { refreshPromise = null; });
  return refreshPromise;
}

// Paths where an invalid/missing session is expected and handled by the page itself.
// A 401 on these routes must NOT trigger a hard redirect to /login — the page
// renders its own unauthenticated state (e.g. EntryPage shows the booking form).
const PUBLIC_PATHS = ['/', '/submit', '/track'];

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-otp') ||
    pathname.startsWith('/setup-password')
  );
}

function forceLogout(): void {
  clearAuth();  // clears in-memory token + pre-13B.8 localStorage cleanup
  if (typeof window !== 'undefined' && !isPublicPath(window.location.pathname)) {
    window.location.href = '/login?reason=session_expired';
  }
}

const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    // Attempt silent refresh using the HttpOnly cookie.
    // tryRefreshToken() is mutex-guarded so concurrent 401s share one refresh call.
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      // Retry the original request — prepareHeaders will use the new token.
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      forceLogout();
    }
  } else if (result.error?.status === 403) {
    // 403 = deactivated account or role mismatch — refresh cannot recover this.
    forceLogout();
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
    'CarBrand',
    'CarModel',
    'Enquiry',
    'AuthSession',
  ],
  endpoints: () => ({}),
});
