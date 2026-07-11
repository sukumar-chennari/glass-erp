import { baseApi } from '@/services/baseApi';
import type { BranchListItem } from '@/types/models/branch';

// Server returns all BranchListItem fields plus server-computed distanceKm.
// distanceKm is present on GPS queries; may be absent on district-only queries.
export interface NearbyBranch extends BranchListItem {
  distanceKm?: number;
}

// GPS and district are mutually exclusive search modes.
// Params are narrowed at the call site — only the relevant fields are ever set.
export interface NearbyBranchParams {
  // GPS mode: send lat+lng, omit district
  lat?:      number;
  lng?:      number;
  // District mode: send district, omit lat/lng
  district?: string;
}

function buildUrl(params: NearbyBranchParams): string {
  const q = new URLSearchParams();
  if (params.lat != null && params.lng != null) {
    // GPS mode — lat+lng only, server sorts by distanceKm ascending
    q.set('lat', String(params.lat));
    q.set('lng', String(params.lng));
  } else if (params.district) {
    // District mode — district only, no coordinate params sent
    q.set('district', params.district);
  }
  return `/branches/nearby?${q.toString()}`;
}

// GET /api/v1/branches/nearby — public, no authentication required.
// The existing baseApi prepareHeaders only attaches a Bearer token when
// getToken() is non-null; anonymous visitors carry no token so no
// Authorization header is sent to this endpoint.
export const nearbyBranchesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNearbyBranches: builder.query<NearbyBranch[], NearbyBranchParams>({
      query: buildUrl,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNearbyBranchesQuery,
  useLazyGetNearbyBranchesQuery,
} = nearbyBranchesApi;
