import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation, mockId, USE_MOCK, MOCK_DELAY } from '@/services/mockUtils';
import { branchMock } from '@/mocks/adminBranches';
import type {
  BranchListItem,
  BranchListResponse,
  BranchListStatus,
  BranchCreatePayload,
  BranchCreateResponse,
  BranchPatchPayload,
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

    // PATCH /api/v1/branches/:id — confirmed live endpoint.
    // All editable fields are required in the body; id goes in the URL only.
    // Response is the updated BranchListItem. invalidatesTags triggers list refetch.
    updateBranch: builder.mutation<BranchListItem, BranchPatchPayload>({
      ...mockableMutation<BranchListItem, BranchPatchPayload>({
        mockFn: ({ id, ...dto }) => ({
          id,
          code:       'mock-code',
          createdById: 'mock-user',
          createdAt:   new Date().toISOString(),
          updatedAt:   new Date().toISOString(),
          ...dto,
        }),
        url:    (arg) => `/branches/${arg.id}`,
        method: 'PATCH',
        body:   ({ id: _id, ...rest }) => rest,
      }),
      invalidatesTags: ['Branch'],
    }),

    // DELETE /api/v1/branches/:id — deactivates the branch (sets status = INACTIVE).
    // Returns 204 No Content on success. Uses responseHandler to skip JSON parsing on
    // the empty body; bypasses mockableMutation for the same reason.
    deactivateBranch: builder.mutation<void, string>({
      ...(USE_MOCK
        ? {
            queryFn: async () => {
              await new Promise<void>((r) => setTimeout(r, MOCK_DELAY));
              return { data: undefined };
            },
          }
        : {
            query: (id) => ({
              url:             `/branches/${id}`,
              method:          'DELETE',
              responseHandler: async () => undefined,
            }),
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
  useDeactivateBranchMutation,
} = branchesApi;
