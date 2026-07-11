import { baseApi } from '@/services/baseApi';
import { mockableMutation } from '@/services/mockUtils';

export interface EnquiryPayload {
  branchId:      string;
  vehicleBrand:  string;
  vehicleModel:  string;
  customerPhone: string;
}

export interface EnquiryResponse {
  id:            string;
  jobNumber:     string;
  branchId:      string;
  vehicleBrand:  string;
  vehicleModel:  string;
  customerPhone: string;
  status:        string;
}

// TODO_ACTIVATE_ME: probe POST /api/v1/enquiries on the live backend before removing the mock path.
// POST /api/v1/enquiries endpoint existence is unconfirmed as of Phase 13B.9.
// Mock returns a plausible response shape so the UI flow is fully testable in mock mode.
export const enquiryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createEnquiry: builder.mutation<EnquiryResponse, EnquiryPayload>({
      ...mockableMutation<EnquiryResponse, EnquiryPayload>({
        mockFn: (payload) => ({
          id:            `enq-${Date.now()}`,
          jobNumber:     `WX-${Math.floor(100000 + Math.random() * 900000)}`,
          branchId:      payload.branchId,
          vehicleBrand:  payload.vehicleBrand,
          vehicleModel:  payload.vehicleModel,
          customerPhone: payload.customerPhone,
          status:        'PENDING',
        }),
        url:    '/enquiries',
        method: 'POST',
        body:   (payload) => payload,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useCreateEnquiryMutation } = enquiryApi;
