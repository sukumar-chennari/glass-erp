import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation } from '@/services/mockUtils';
import { branchMock } from '@/mocks/adminBranches';
import type { Branch, BranchCreatePayload, BranchUpdatePayload } from '@/types/models/branch';

export const branchesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBranches: builder.query<Branch[], void>({
      ...mockableQuery<Branch[], void>({
        mockFn: () => branchMock.list(),
        url: '/settings/branches',
      }),
      providesTags: ['Branch'],
    }),

    createBranch: builder.mutation<Branch, BranchCreatePayload>({
      ...mockableMutation<Branch, BranchCreatePayload>({
        mockFn: (payload) => branchMock.create(payload),
        url: '/settings/branches',
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
