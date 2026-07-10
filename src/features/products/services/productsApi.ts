import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation, normalizeArray } from '@/services/mockUtils';
import { productMock } from '@/mocks/products';
import type { Product, CreateProductDto } from '@/types/models/product';

interface UpdateProductArg extends Partial<CreateProductDto> {
  id: string;
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({
      ...mockableQuery<Product[], void>({
        mockFn: () => productMock.list(),
        url: '/products',
        transformResponse: (raw) => normalizeArray<Product>(raw, 'products'),
      }),
      providesTags: ['Product'],
    }),

    createProduct: builder.mutation<Product, CreateProductDto>({
      ...mockableMutation<Product, CreateProductDto>({
        mockFn: (dto) => productMock.create(dto),
        url: '/products',
        method: 'POST',
      }),
      invalidatesTags: ['Product'],
    }),

    updateProduct: builder.mutation<Product, UpdateProductArg>({
      ...mockableMutation<Product, UpdateProductArg>({
        mockFn: ({ id, ...dto }) => productMock.update(id, dto),
        url: (arg) => `/products/${arg.id}`,
        method: 'PUT',
        body: ({ id: _id, ...dto }) => dto,
      }),
      invalidatesTags: ['Product'],
    }),

    deleteProduct: builder.mutation<string, string>({
      ...mockableMutation<string, string>({
        mockFn: (id) => productMock.remove(id),
        url: (id) => `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;
