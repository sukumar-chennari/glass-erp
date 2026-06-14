import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation } from '@/services/mockUtils';
import { invoiceMock } from '@/mocks/invoices';
import { customerMock } from '@/mocks/customers';
import type { Invoice, CreateInvoiceDto, UpdateInvoiceDto } from '@/types/models/invoice';

interface UpdateInvoiceArg extends UpdateInvoiceDto {
  id: string;
}

export const invoicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query<Invoice[], void>({
      ...mockableQuery<Invoice[], void>({
        mockFn: () => invoiceMock.list(),
        url: '/invoices',
      }),
      providesTags: ['Invoice'],
    }),

    createInvoice: builder.mutation<Invoice, CreateInvoiceDto>({
      ...mockableMutation<Invoice, CreateInvoiceDto>({
        mockFn: (dto) => {
          const customer = customerMock.list().find((c) => c.id === dto.customerId);
          return invoiceMock.create(dto, customer?.name ?? 'Unknown', customer?.phone ?? '');
        },
        url: '/invoices',
        method: 'POST',
      }),
      invalidatesTags: ['Invoice', 'Dashboard'],
    }),

    updateInvoice: builder.mutation<Invoice, UpdateInvoiceArg>({
      ...mockableMutation<Invoice, UpdateInvoiceArg>({
        mockFn: ({ id, ...dto }) => invoiceMock.update(id, dto),
        url: (arg) => `/invoices/${arg.id}`,
        method: 'PUT',
        body: ({ id: _id, ...dto }) => dto,
      }),
      invalidatesTags: ['Invoice', 'Dashboard'],
    }),

    deleteInvoice: builder.mutation<string, string>({
      ...mockableMutation<string, string>({
        mockFn: (id) => invoiceMock.remove(id),
        url: (id) => `/invoices/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Invoice', 'Dashboard'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
} = invoicesApi;
