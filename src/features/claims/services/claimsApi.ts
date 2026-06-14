import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation } from '@/services/mockUtils';
import { claimMock } from '@/mocks/claims';
import { customerMock } from '@/mocks/customers';
import type { Claim, CreateClaimDto } from '@/types/models/claim';

interface UpdateClaimArg {
  id:             string;
  status?:        Claim['status'];
  approvedAmount?: number;
  remarks?:       string;
  surveyorName?:  string;
}

export const claimsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClaims: builder.query<Claim[], void>({
      ...mockableQuery<Claim[], void>({
        mockFn: () => claimMock.list(),
        url: '/insurance-claims',
      }),
      providesTags: ['Claim'],
    }),

    createClaim: builder.mutation<Claim, CreateClaimDto>({
      ...mockableMutation<Claim, CreateClaimDto>({
        mockFn: (dto) => {
          const customer = customerMock.list().find((c) => c.id === dto.customerId);
          return claimMock.create(dto, customer?.name ?? 'Unknown');
        },
        url: '/insurance-claims',
        method: 'POST',
      }),
      invalidatesTags: ['Claim', 'Dashboard'],
    }),

    updateClaim: builder.mutation<Claim, UpdateClaimArg>({
      ...mockableMutation<Claim, UpdateClaimArg>({
        mockFn: ({ id, ...dto }) => claimMock.update(id, dto),
        url: (arg) => `/insurance-claims/${arg.id}`,
        method: 'PUT',
        body: ({ id: _id, ...dto }) => dto,
      }),
      invalidatesTags: ['Claim', 'Dashboard'],
    }),

    deleteClaim: builder.mutation<string, string>({
      ...mockableMutation<string, string>({
        mockFn: (id) => claimMock.remove(id),
        url: (id) => `/insurance-claims/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Claim', 'Dashboard'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetClaimsQuery,
  useCreateClaimMutation,
  useUpdateClaimMutation,
  useDeleteClaimMutation,
} = claimsApi;
