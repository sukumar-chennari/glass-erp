import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation, normalizeArray } from '@/services/mockUtils';
import { customerMock } from '@/mocks/customers';
import type { Customer, CreateCustomerDto } from '@/types/models/customer';

interface UpdateCustomerArg extends Partial<CreateCustomerDto> {
  id: string;
}

export const customersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<Customer[], void>({
      ...mockableQuery<Customer[], void>({
        mockFn: () => customerMock.list(),
        url: '/customers',
        transformResponse: (raw) => normalizeArray<Customer>(raw, 'customers'),
      }),
      providesTags: ['Customer'],
    }),

    createCustomer: builder.mutation<Customer, CreateCustomerDto>({
      ...mockableMutation<Customer, CreateCustomerDto>({
        mockFn: (dto) => customerMock.create(dto),
        url: '/customers',
        method: 'POST',
      }),
      invalidatesTags: ['Customer'],
    }),

    updateCustomer: builder.mutation<Customer, UpdateCustomerArg>({
      ...mockableMutation<Customer, UpdateCustomerArg>({
        mockFn: ({ id, ...dto }) => customerMock.update(id, dto),
        url: (arg) => `/customers/${arg.id}`,
        method: 'PUT',
        body: ({ id: _id, ...dto }) => dto,
      }),
      invalidatesTags: ['Customer'],
    }),

    deleteCustomer: builder.mutation<string, string>({
      ...mockableMutation<string, string>({
        mockFn: (id) => customerMock.remove(id),
        url: (id) => `/customers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Customer'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customersApi;
