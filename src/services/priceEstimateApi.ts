import { baseApi } from '@/services/baseApi';
import { ENDPOINTS } from '@/services/api/endpoints';

export interface PriceQuote {
  brand:          string;
  glassPrice:     number | null;
  labourCharges:  number | null;
  sealantCharges: number | null;
  total:          number | null;
}

export const priceEstimateApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPriceEstimate: builder.query<PriceQuote[], string>({
      query: (enquiryId) => ({
        url: ENDPOINTS.enquiries.priceEstimate(enquiryId),
      }),
      // API returns an object keyed by brand name:
      // { AIS: { glassPrice, labourCharges, sealantCharges, total }, Benson: {...}, ... }
      // Convert to array for uniform rendering.
      transformResponse: (raw: Record<string, Omit<PriceQuote, 'brand'>>): PriceQuote[] =>
        Object.entries(raw).map(([brand, vals]) => ({
          brand,
          glassPrice:     vals.glassPrice     ?? null,
          labourCharges:  vals.labourCharges   ?? null,
          sealantCharges: vals.sealantCharges  ?? null,
          total:          vals.total           ?? null,
        })),
      providesTags: (_result, _error, id) => [{ type: 'PriceEstimate' as const, id }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetPriceEstimateQuery } = priceEstimateApi;
