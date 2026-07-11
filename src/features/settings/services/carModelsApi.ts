import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation } from '@/services/mockUtils';
import { carModelMock } from '@/mocks/carModels';
import type { CarModel, CarModelPayload, CarModelUpdatePayload } from '@/types/models/carModel';

export const carModelsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getCarModels: builder.query<CarModel[], void>({
      ...mockableQuery<CarModel[], void>({
        mockFn: () => carModelMock.list(),
        url:    '/car-models',
      }),
      providesTags: ['CarModel'],
    }),

    createCarModel: builder.mutation<CarModel, CarModelPayload>({
      ...mockableMutation<CarModel, CarModelPayload>({
        mockFn: (payload) => carModelMock.create(payload),
        url:    '/car-models',
        method: 'POST',
      }),
      invalidatesTags: ['CarModel'],
    }),

    updateCarModel: builder.mutation<CarModel, CarModelUpdatePayload>({
      ...mockableMutation<CarModel, CarModelUpdatePayload>({
        mockFn: (payload) => carModelMock.update(payload),
        url:    (arg) => `/car-models/${arg.id}`,
        method: 'PATCH',
        body:   ({ id: _id, ...rest }) => rest,
      }),
      invalidatesTags: ['CarModel'],
    }),

    deleteCarModel: builder.mutation<void, string>({
      ...mockableMutation<void, string>({
        mockFn: (id) => carModelMock.remove(id),
        url:    (id) => `/car-models/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CarModel'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCarModelsQuery,
  useCreateCarModelMutation,
  useUpdateCarModelMutation,
  useDeleteCarModelMutation,
} = carModelsApi;
