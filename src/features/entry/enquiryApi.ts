import { baseApi } from '@/services/baseApi';
import { ENDPOINTS } from '@/services/api/endpoints';

// POST /api/v1/enquiries/quick — unauthenticated quick-capture endpoint.
// Only three fields are sent; vehicle details are added later by branch staff.
export interface QuickEnquiryPayload {
  customerName: string;
  phone:        string;
  branchId:     string;
}

// 201 response shape.
export interface QuickEnquiryResponse {
  enquiryId: string;
}

export const enquiryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createQuickEnquiry: builder.mutation<QuickEnquiryResponse, QuickEnquiryPayload>({
      query: (body) => ({
        url:    ENDPOINTS.enquiries.quick,
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useCreateQuickEnquiryMutation } = enquiryApi;
