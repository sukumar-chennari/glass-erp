import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation } from '@/services/mockUtils';
import { userMock } from '@/mocks/adminUsers';
import type { AppUser, StaffListResponse, StaffCreatePayload, StaffUpdatePayload, UserCreatePayload } from '@/types/models/appUser';
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

    // POST /api/v1/staff — ADMIN (branch_manager) scope.
    // Body: { name, phone, role } only. Branch is auto-assigned from session on backend.
    // role must be a BackendStaffRole (FRONTOFFICE | TECHNICIAN) — sent directly, no mapping.
    createStaff: builder.mutation<AppUser, StaffCreatePayload>({
      ...mockableMutation<AppUser, StaffCreatePayload>({
        mockFn: (payload) => userMock.create({
          name:     payload.name,
          email:    '',
          phone:    payload.phone,
          role:     payload.role === 'FRONTOFFICE' ? 'operator' : 'technician',
          branchId: null,
        }),
        url:    '/staff',
        method: 'POST',
        body:   (payload) => ({
          name:  payload.name,
          phone: payload.phone,
          role:  payload.role,
        }),
      }),
      invalidatesTags: ['AppUser'],
    }),

    // PATCH /api/v1/staff/:id — confirmed live contract.
    // Accepts only { name, isActive } in the body; id is URL-only.
    updateStaff: builder.mutation<AppUser, StaffUpdatePayload>({
      ...mockableMutation<AppUser, StaffUpdatePayload>({
        mockFn: ({ id, isActive }) => userMock.updateStatus(id, isActive ? 'Active' : 'Inactive'),
        url:    (arg) => `/staff/${arg.id}`,
        method: 'PATCH',
        body:   ({ name, isActive }) => ({ name, isActive }),
      }),
      invalidatesTags: ['AppUser'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useCreateStaffMutation,
  useUpdateStaffMutation,
} = usersApi;
