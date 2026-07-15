import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation, normalizeArray } from '@/services/mockUtils';
import { carModelMock } from '@/mocks/carModels';
import type { CarModel, CarModelPayload, CarModelUpdatePayload, CarModelStatus } from '@/types/models/carModel';

export const carModelsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET /api/v1/car-models — paginated { data, total, page, limit } envelope.
    // Backend filter params: brandId?, status?
    // transformResponse remaps backend field names → frontend model.
    getCarModels: builder.query<CarModel[], { brandId?: string; status?: CarModelStatus } | void>({
      ...mockableQuery<CarModel[], { brandId?: string; status?: CarModelStatus } | void>({
        mockFn: (arg) => {
          let items = carModelMock.list();
          const a = arg as { brandId?: string; status?: CarModelStatus } | undefined;
          if (a?.brandId) items = items.filter((m) => m.brand_id === a.brandId);
          if (a?.status)  items = items.filter((m) => m.status   === a.status);
          return items;
        },
        url: '/car-models',
        params: (arg) => {
          const a = arg as { brandId?: string; status?: CarModelStatus } | undefined;
          const p: Record<string, unknown> = {};
          if (a?.brandId) p['brandId'] = a.brandId;
          if (a?.status)  p['status']  = a.status;
          return Object.keys(p).length > 0 ? p : undefined;
        },
        transformResponse: (raw) =>
          normalizeArray<Record<string, unknown>>(raw).map((m) => ({
            id:           m['id'],
            brand_id:     m['brandId'],
            name:         m['modelName'],
            compare_name: m['name'],
            image:        (m['image'] as string | null | undefined) ?? null,
            status:       m['status'],
          })) as CarModel[],
      }),
      providesTags: ['CarModel'],
    }),

    // POST /api/v1/car-models — confirmed body: { brandId, modelName, name, image, status }
    createCarModel: builder.mutation<CarModel, CarModelPayload>({
      ...mockableMutation<CarModel, CarModelPayload>({
        mockFn: (payload) => carModelMock.create(payload),
        url:    '/car-models',
        method: 'POST',
        body:   ({ brand_id, name, compare_name, image, status }) => ({
          brandId:   brand_id,
          modelName: name,
          name:      compare_name,
          image:     image ?? '',
          status,
        }),
      }),
      invalidatesTags: ['CarModel'],
    }),

    updateCarModel: builder.mutation<CarModel, CarModelUpdatePayload>({
      ...mockableMutation<CarModel, CarModelUpdatePayload>({
        mockFn: (payload) => carModelMock.update(payload),
        url:    (arg) => `/car-models/${arg.id}`,
        method: 'PATCH',
        // PATCH body: { modelName, name, image, status } — brandId is URL-only
        body:   ({ name, compare_name, image, status }) => ({
          modelName: name,
          name:      compare_name,
          image:     image ?? '',
          status,
        }),
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
