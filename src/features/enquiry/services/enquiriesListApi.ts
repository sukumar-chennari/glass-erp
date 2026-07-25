import { baseApi } from '@/services/baseApi';
import { ENDPOINTS } from '@/services/api/endpoints';

export type BackendEnquiryStatus =
  | 'SUBMITTED'   // enquiry received, not yet actioned
  | 'CONVERTED'   // converted to a job
  | 'LOST';       // marked as lost lead

// Shape returned by GET /enquiries and GET /enquiries/:id.
// Field names match the backend exactly — mapping to frontend names happens
// in EnquiryPage mapBackendToFrontend / mapBackendToFormValues.
export interface BackendEnquiry {
  id:            string;
  status:        BackendEnquiryStatus;
  customerName:  string;
  phone:         string;
  branchId:      string;
  createdAt:     string;
  updatedAt:     string;
  enquiryNo?:          string | null;
  source?:             string | null;
  vehicleMake?:        string | null;  // brand display name
  vehicleModel?:       string | null;
  vehicleYear?:        number | null;  // number, not string
  vehicleReg?:         string | null;  // registration number
  vehicleType?:        string | null;
  glassType?:          string | null;
  serviceType?:        string | null;
  paymentType?:        string | null;
  insurerName?:        string | null;
  accidentDate?:       string | null;
  preferredDate?:      string | null;  // ISO datetime string
  notes?:              string | null;  // damage notes
  carBrandId?:         string | null;
  carModelId?:         string | null;
  carModelVariantId?:  string | null;
  glassPartTypeId?:    string | null;
  bodyType?:           string | null;  // e.g. "LMV"
  quotedPrice?:        number | null;
  priceBrand?:         string | null;
  closeReason?:        string | null;
  closeNotes?:         string | null;
  jobRef?:             string | null;
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
//   vehicleYear     → vehicleYear (number)
//   appointmentDate → preferredDate
//   damageNotes     → notes
//   vehicleBrandId  → carBrandId
//   vehicleModelId  → carModelId
//   variantId       → carModelVariantId
//   glassTypeId     → glassPartTypeId
//   modelBodyType[0]→ bodyType
export interface UpdateEnquiryPayload {
  id:                  string;
  customerName?:       string;
  phone?:              string;
  vehicleMake?:        string;
  vehicleModel?:       string;
  vehicleYear?:        number;
  vehicleReg?:         string;
  glassType?:          string;
  serviceType?:        string;
  vehicleType?:        string;
  source?:             string;
  paymentType?:        string;
  insurerName?:        string;
  accidentDate?:       string;
  preferredDate?:      string;
  notes?:              string;
  carBrandId?:         string;
  carModelId?:         string;
  carModelVariantId?:  string;
  glassPartTypeId?:    string;
  bodyType?:           string;
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
