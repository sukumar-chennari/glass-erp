import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation, normalizeArray } from '@/services/mockUtils';
import { userMock } from '@/mocks/adminUsers';
import type { AppUser, UserCreatePayload, UserUpdateStatusPayload } from '@/types/models/appUser';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<AppUser[], void>({
      ...mockableQuery<AppUser[], void>({
        mockFn: () => userMock.list(),
        url: '/settings/users',
        transformResponse: (raw) => normalizeArray<AppUser>(raw, 'users'),
      }),
      providesTags: ['AppUser'],
    }),

    createUser: builder.mutation<AppUser, UserCreatePayload>({
      ...mockableMutation<AppUser, UserCreatePayload>({
        mockFn: (payload) => userMock.create(payload),
        url: '/settings/users',
        method: 'POST',
      }),
      invalidatesTags: ['AppUser'],
    }),

    updateUserStatus: builder.mutation<AppUser, UserUpdateStatusPayload>({
      ...mockableMutation<AppUser, UserUpdateStatusPayload>({
        mockFn: ({ id, status }) => userMock.updateStatus(id, status),
        url: (arg) => `/settings/users/${arg.id}/status`,
        method: 'PUT',
        body: ({ id: _id, status }) => ({ status }),
      }),
      invalidatesTags: ['AppUser'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserStatusMutation,
} = usersApi;
