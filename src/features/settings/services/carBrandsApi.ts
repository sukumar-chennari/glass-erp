import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation, normalizeArray } from '@/services/mockUtils';
import { carBrandMock } from '@/mocks/carBrands';
import type { CarBrand, CarBrandPayload, CarBrandUpdatePayload, CarBrandStatus } from '@/types/models/carBrand';

export const carBrandsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET /api/v1/car-brands — returns { data, total, page, limit } envelope.
    // Optional ?status=ACTIVE|INACTIVE&search=<term> backend filters.
    getCarBrands: builder.query<CarBrand[], { status?: CarBrandStatus; search?: string } | void>({
      ...mockableQuery<CarBrand[], { status?: CarBrandStatus; search?: string } | void>({
        mockFn: (arg) => {
          let items = carBrandMock.list();
          const a = arg as { status?: CarBrandStatus; search?: string } | undefined;
          if (a?.status) items = items.filter((b) => b.status === a.status);
          if (a?.search) {
            const q = a.search.toLowerCase();
            items = items.filter((b) => b.name.toLowerCase().includes(q));
          }
          return items;
        },
        url: '/car-brands',
        params: (arg) => {
          const a = arg as { status?: CarBrandStatus; search?: string } | undefined;
          const p: Record<string, unknown> = {};
          if (a?.status) p['status'] = a.status;
          if (a?.search) p['search'] = a.search;
          return Object.keys(p).length > 0 ? p : undefined;
        },
        transformResponse: (raw) =>
          normalizeArray<Record<string, unknown>>(raw).map((b) => ({
            id:           b['id'],
            name:         b['brandName'],
            compare_name: b['name'],
            image:        b['image'],
            status:       b['status'],
            createdAt:    b['createdAt'],
            updatedAt:    b['updatedAt'],
          })) as CarBrand[],
      }),
      providesTags: ['CarBrand'],
    }),

    // POST /api/v1/car-brands — confirmed live contract: { brandName, name, image, status }.
    // Internal CarBrandPayload uses { name (display), compare_name (slug) };
    // the body function remaps to backend field names before sending.
    createCarBrand: builder.mutation<CarBrand, CarBrandPayload>({
      ...mockableMutation<CarBrand, CarBrandPayload>({
        mockFn: (payload) => carBrandMock.create(payload),
        url:    '/car-brands',
        method: 'POST',
        body:   (payload) => ({
          brandName: payload.name,
          name:      payload.compare_name,
          image:     payload.image ?? '',
          status:    payload.status,
        }),
      }),
      invalidatesTags: ['CarBrand'],
    }),

    updateCarBrand: builder.mutation<CarBrand, CarBrandUpdatePayload>({
      ...mockableMutation<CarBrand, CarBrandUpdatePayload>({
        mockFn: (payload) => carBrandMock.update(payload),
        url:    (arg) => `/car-brands/${arg.id}`,
        method: 'PATCH',
        body:   ({ name, compare_name, image, status }) => ({
          brandName: name,
          name:      compare_name,
          image:     image ?? '',
          status,
        }),
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
