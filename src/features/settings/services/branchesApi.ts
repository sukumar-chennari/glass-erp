import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation, mockId, normalizeArray } from '@/services/mockUtils';
import { branchMock } from '@/mocks/adminBranches';
import type {
  Branch,
  BranchCreatePayload,
  BranchCreateResponse,
  BranchUpdatePayload,
} from '@/types/models/branch';

export const branchesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBranches: builder.query<Branch[], void>({
      ...mockableQuery<Branch[], void>({
        mockFn: () => branchMock.list(),
        url: '/settings/branches',
        transformResponse: (raw) => normalizeArray<Branch>(raw, 'branches'),
      }),
      providesTags: ['Branch'],
    }),

    createBranch: builder.mutation<BranchCreateResponse, BranchCreatePayload>({
      ...mockableMutation<BranchCreateResponse, BranchCreatePayload>({
        // Inline mock — avoids updating adminBranches.ts for the new payload shape.
        mockFn: (payload) => ({
          id:   mockId('br-'),
          name: payload.name,
          code: payload.code,
        }),
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
