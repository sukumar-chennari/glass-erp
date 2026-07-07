import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation } from '@/services/mockUtils';
import { vehicleModelMock } from '@/mocks/vehicleModels';
import type { VehicleModel, VehicleModelPayload, VehicleModelUpdatePayload } from '@/types/models/vehicleModel';

export const vehicleModelsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVehicleModels: builder.query<VehicleModel[], void>({
      ...mockableQuery<VehicleModel[], void>({
        mockFn: () => vehicleModelMock.list(),
        url:    '/settings/vehicle-models',
      }),
      providesTags: ['VehicleModel'],
    }),

    createVehicleModel: builder.mutation<VehicleModel, VehicleModelPayload>({
      ...mockableMutation<VehicleModel, VehicleModelPayload>({
        mockFn: (p) => vehicleModelMock.create(p),
        url:    '/settings/vehicle-models',
        method: 'POST',
      }),
      invalidatesTags: ['VehicleModel'],
    }),

    updateVehicleModel: builder.mutation<VehicleModel, VehicleModelUpdatePayload>({
      ...mockableMutation<VehicleModel, VehicleModelUpdatePayload>({
        mockFn: (p)         => vehicleModelMock.update(p),
        url:    (arg)       => `/settings/vehicle-models/${arg.id}`,
        method: 'PUT',
        body:   ({ id: _id, ...dto }) => dto,
      }),
      invalidatesTags: ['VehicleModel'],
    }),

    deleteVehicleModel: builder.mutation<null, string>({
      ...mockableMutation<null, string>({
        mockFn: (id) => { vehicleModelMock.remove(id); return null; },
        url:    (id) => `/settings/vehicle-models/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['VehicleModel'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetVehicleModelsQuery,
  useCreateVehicleModelMutation,
  useUpdateVehicleModelMutation,
  useDeleteVehicleModelMutation,
} = vehicleModelsApi;
