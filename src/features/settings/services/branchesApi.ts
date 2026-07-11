import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation, mockId, normalizeArray } from '@/services/mockUtils';
import { branchMock } from '@/mocks/adminBranches';
import type {
  Branch,
  BranchListItem,
  BranchListStatus,
  BranchCreatePayload,
  BranchCreateResponse,
  BranchUpdatePayload,
} from '@/types/models/branch';

export const branchesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBranches: builder.query<BranchListItem[], BranchListStatus | undefined>({
      ...mockableQuery<BranchListItem[], BranchListStatus | undefined>({
        mockFn: () => branchMock.list() as unknown as BranchListItem[],
        url: '/branches',
        params: (status) => (status ? { status } : {}),
        transformResponse: (raw) => normalizeArray<BranchListItem>(raw, 'branches'),
      }),
      providesTags: ['Branch'],
    }),

    createBranch: builder.mutation<BranchCreateResponse, BranchCreatePayload>({
      ...mockableMutation<BranchCreateResponse, BranchCreatePayload>({
        mockFn: (payload) => {
          const branchId = mockId('br-');
          const now = new Date().toISOString();
          return {
            branch: {
              id:                     branchId,
              code:                   payload.code,
              name:                   payload.name,
              state:                  payload.state,
              district:               payload.district,
              address:                payload.address,
              pincode:                payload.pincode,
              latitude:               payload.latitude,
              longitude:              payload.longitude,
              contactNumber:          payload.contactNumber,
              alternateContactNumber: payload.alternateContactNumber,
              email:                  payload.email,
              openingTime:            payload.openingTime,
              closingTime:            payload.closingTime,
              status:                 payload.status,
              createdById:            'mock-user',
              createdAt:              now,
              updatedAt:              now,
            },
            admin: {
              id:        mockId('usr-'),
              name:      payload.adminName,
              email:     payload.adminEmail,
              phone:     payload.adminPhone,
              role:      'ADMIN',
              branchId,
              isActive:  true,
              createdAt: now,
              updatedAt: now,
            },
          };
        },
        url: '/branches',
        method: 'POST',
      }),
      invalidatesTags: ['Branch'],
    }),

    updateBranch: builder.mutation<Branch, BranchUpdatePayload>({
      ...mockableMutation<Branch, BranchUpdatePayload>({
        mockFn: ({ id, ...dto }) => branchMock.update(id, dto),
        url: (arg) => `/settings/branches/${arg.id}`,
        method: 'PUT',
        body: ({ id: _id, ...dto }) => dto,
      }),
      invalidatesTags: ['Branch'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
} = branchesApi;
