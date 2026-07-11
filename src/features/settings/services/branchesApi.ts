import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation, mockId } from '@/services/mockUtils';
import { branchMock } from '@/mocks/adminBranches';
import type {
  Branch,
  BranchListItem,
  BranchListResponse,
  BranchListStatus,
  BranchCreatePayload,
  BranchCreateResponse,
  BranchUpdatePayload,
} from '@/types/models/branch';

export const branchesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBranches: builder.query<BranchListResponse, BranchListStatus | undefined>({
      ...mockableQuery<BranchListResponse, BranchListStatus | undefined>({
        mockFn: () => {
          const items = branchMock.list() as unknown as BranchListItem[];
          return { data: items, total: items.length, page: 1, limit: 20 };
        },
        url: '/branches',
        params: (status) => (status ? { status } : {}),
        transformResponse: (raw: unknown): BranchListResponse => {
          const r = raw as { data?: unknown; total?: number; page?: number; limit?: number };
          return {
            data:  Array.isArray(r.data) ? (r.data as BranchListItem[]) : [],
            total: r.total  ?? 0,
            page:  r.page   ?? 1,
            limit: r.limit  ?? 20,
          };
        },
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
