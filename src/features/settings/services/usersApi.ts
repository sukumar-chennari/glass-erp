import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation } from '@/services/mockUtils';
import { userMock } from '@/mocks/adminUsers';
import type { AppUser, StaffListResponse, UserCreatePayload, UserUpdateStatusPayload } from '@/types/models/appUser';
import { FRONTEND_TO_BACKEND_ROLE } from '@/types/models/appUser';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/staff — same { data, total, page, limit } envelope as /branches.
    // NOTE: backend role enum is FRONTOFFICE | TECHNICIAN; field-level mapping
    // deferred until /staff returns real records for verification.
    getUsers: builder.query<StaffListResponse, void>({
      ...mockableQuery<StaffListResponse, void>({
        mockFn: () => {
          const items = userMock.list();
          return { data: items, total: items.length, page: 1, limit: 20 };
        },
        url: '/staff',
        transformResponse: (raw: unknown): StaffListResponse => {
          const r = raw as { data?: unknown; total?: number; page?: number; limit?: number };
          return {
            data:  Array.isArray(r.data) ? (r.data as AppUser[]) : [],
            total: r.total  ?? 0,
            page:  r.page   ?? 1,
            limit: r.limit  ?? 20,
          };
        },
      }),
      providesTags: ['AppUser'],
    }),

    // POST /api/v1/staff — confirmed endpoint.
    // Role is mapped from frontend enum → backend enum via FRONTEND_TO_BACKEND_ROLE.
    // Only 'technician' has a confirmed mapping ('TECHNICIAN'); other roles are blocked
    // at the UI layer (UsersPage ROLE_OPTIONS) until backend confirms their equivalents.
    createUser: builder.mutation<AppUser, UserCreatePayload>({
      ...mockableMutation<AppUser, UserCreatePayload>({
        mockFn: (payload) => userMock.create(payload),
        url: '/staff',
        method: 'POST',
        body: (payload) => ({
          name:     payload.name,
          email:    payload.email,
          phone:    payload.phone,
          role:     FRONTEND_TO_BACKEND_ROLE[payload.role],
          branchId: payload.branchId,
        }),
      }),
      invalidatesTags: ['AppUser'],
    }),

    // TODO: backend status-update endpoint not yet implemented (PUT/PATCH /staff/:id/status → 404).
    // Kept on mock path only until backend confirms the endpoint and payload shape.
    updateUserStatus: builder.mutation<AppUser, UserUpdateStatusPayload>({
      ...mockableMutation<AppUser, UserUpdateStatusPayload>({
        mockFn: ({ id, status }) => userMock.updateStatus(id, status),
        url: (arg) => `/staff/${arg.id}/status`,
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
