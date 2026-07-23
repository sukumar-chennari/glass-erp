import { baseApi } from '@/services/baseApi';
import { ENDPOINTS } from '@/services/api/endpoints';

export type BackendEnquiryStatus = 'SUBMITTED' | 'CONVERTED' | 'LOST';

// Shape returned by GET /enquiries and GET /enquiries/:id.
// Fields beyond the core 4 may be absent on quick-submitted enquiries
// (filled in later by branch staff via the full admin form).
export interface BackendEnquiry {
  id:            string;
  status:        BackendEnquiryStatus;
  customerName:  string;
  phone:         string;
  branchId:      string;
  createdAt:     string;
  updatedAt:     string;
  enquiryNo?:       string | null;
  source?:          string | null;
  vehicleBrandId?:  string | null;
  vehicleBrand?:    string | null;
  vehicleModel?:    string | null;
  vehicleYear?:     string | null;
  vehicleNumber?:   string | null;
  vehicleType?:     string | null;
  glassType?:       string | null;
  paymentType?:     string | null;
  insurerName?:     string | null;
  accidentDate?:    string | null;
  appointmentDate?: string | null;
  damageNotes?:     string | null;
  quotedPrice?:     number | null;
  priceBrand?:      string | null;
  closeReason?:     string | null;
  closeNotes?:      string | null;
  jobRef?:          string | null;
}

export interface GetEnquiriesParams {
  page?:      number;
  limit?:     number;
  sortBy?:    'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  status?:    BackendEnquiryStatus;
}

export interface GetEnquiriesResponse {
  data:  BackendEnquiry[];
  total: number;
  page:  number;
  limit: number;
}

// PATCH /enquiries/:id — fill in or update details on a SUBMITTED enquiry.
// Only include fields that have a value; omitted fields are not overwritten.
// Frontend field → backend field name mapping:
//   vehicleBrand    → vehicleMake
//   vehicleNumber   → vehicleReg
//   appointmentDate → preferredDate
//   damageNotes     → notes
export interface UpdateEnquiryPayload {
  id:            string;
  customerName?: string;
  phone?:        string;
  vehicleMake?:  string;
  vehicleModel?: string;
  vehicleYear?:  string;
  vehicleReg?:   string;
  glassType?:    string;
  vehicleType?:  string;
  source?:       string;
  paymentType?:  string;
  insurerName?:  string;
  accidentDate?: string;
  preferredDate?: string;
  notes?:        string;
}

export const enquiriesListApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEnquiries: builder.query<GetEnquiriesResponse, GetEnquiriesParams>({
      query: (params) => ({
        url:    ENDPOINTS.enquiries.list,
        method: 'GET',
        params,
      }),
      providesTags: ['Enquiry'],
    }),

    getEnquiryById: builder.query<BackendEnquiry, string>({
      query: (id) => ({
        url: ENDPOINTS.enquiries.byId(id),
      }),
      providesTags: (_result, _error, id) => [{ type: 'Enquiry' as const, id }],
    }),

    updateEnquiry: builder.mutation<BackendEnquiry, UpdateEnquiryPayload>({
      query: ({ id, ...body }) => ({
        url:    ENDPOINTS.enquiries.update(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Enquiry' as const, id: arg.id },
        'Enquiry',
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetEnquiriesQuery,
  useLazyGetEnquiryByIdQuery,
  useUpdateEnquiryMutation,
} = enquiriesListApi;
