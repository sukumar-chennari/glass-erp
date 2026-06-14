import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation } from '@/services/mockUtils';
import { technicianMock } from '@/mocks/technicians';
import type { Technician, CreateTechnicianDto, UpdateTechnicianDto } from '@/types/models/technician';

interface UpdateTechnicianArg extends UpdateTechnicianDto {
  id: string;
}

export const techniciansApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTechnicians: builder.query<Technician[], void>({
      ...mockableQuery<Technician[], void>({
        mockFn: () => technicianMock.list(),
        url: '/technicians',
      }),
      providesTags: ['Technician'],
    }),

    createTechnician: builder.mutation<Technician, CreateTechnicianDto>({
      ...mockableMutation<Technician, CreateTechnicianDto>({
        mockFn: (dto) => technicianMock.create(dto),
        url: '/technicians',
        method: 'POST',
      }),
      invalidatesTags: ['Technician'],
    }),

    updateTechnician: builder.mutation<Technician, UpdateTechnicianArg>({
      ...mockableMutation<Technician, UpdateTechnicianArg>({
        mockFn: ({ id, ...dto }) => technicianMock.update(id, dto),
        url: (arg) => `/technicians/${arg.id}`,
        method: 'PUT',
        body: ({ id: _id, ...dto }) => dto,
      }),
      invalidatesTags: ['Technician'],
    }),

    deleteTechnician: builder.mutation<string, string>({
      ...mockableMutation<string, string>({
        mockFn: (id) => technicianMock.remove(id),
        url: (id) => `/technicians/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Technician'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTechniciansQuery,
  useCreateTechnicianMutation,
  useUpdateTechnicianMutation,
  useDeleteTechnicianMutation,
} = techniciansApi;
