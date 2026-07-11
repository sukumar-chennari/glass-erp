import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation } from '@/services/mockUtils';
import { carBrandMock } from '@/mocks/carBrands';
import type { CarBrand, CarBrandPayload, CarBrandUpdatePayload } from '@/types/models/carBrand';

export const carBrandsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getCarBrands: builder.query<CarBrand[], void>({
      ...mockableQuery<CarBrand[], void>({
        mockFn: () => carBrandMock.list(),
        url:    '/car-brands',
      }),
      providesTags: ['CarBrand'],
    }),

    createCarBrand: builder.mutation<CarBrand, CarBrandPayload>({
      ...mockableMutation<CarBrand, CarBrandPayload>({
        mockFn: (payload) => carBrandMock.create(payload),
        url:    '/car-brands',
        method: 'POST',
      }),
      invalidatesTags: ['CarBrand'],
    }),

    updateCarBrand: builder.mutation<CarBrand, CarBrandUpdatePayload>({
      ...mockableMutation<CarBrand, CarBrandUpdatePayload>({
        mockFn: (payload) => carBrandMock.update(payload),
        url:    (arg) => `/car-brands/${arg.id}`,
        method: 'PATCH',
        body:   ({ id: _id, ...rest }) => rest,
      }),
      invalidatesTags: ['CarBrand'],
    }),

    deleteCarBrand: builder.mutation<void, string>({
      ...mockableMutation<void, string>({
        mockFn: (id) => carBrandMock.remove(id),
        url:    (id) => `/car-brands/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CarBrand'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCarBrandsQuery,
  useCreateCarBrandMutation,
  useUpdateCarBrandMutation,
  useDeleteCarBrandMutation,
} = carBrandsApi;
