import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation } from '@/services/mockUtils';
import { purchaseOrderMock } from '@/mocks/purchaseOrders';
import { vendorMock } from '@/mocks/vendors';
import type {
  PurchaseOrder,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from '@/types/models/purchaseOrder';

interface UpdatePOArg extends UpdatePurchaseOrderDto {
  id: string;
}

export const purchaseOrdersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPurchaseOrders: builder.query<PurchaseOrder[], void>({
      ...mockableQuery<PurchaseOrder[], void>({
        mockFn: () => purchaseOrderMock.list(),
        url: '/purchase-orders',
      }),
      providesTags: ['PurchaseOrder'],
    }),

    createPurchaseOrder: builder.mutation<PurchaseOrder, CreatePurchaseOrderDto>({
      ...mockableMutation<PurchaseOrder, CreatePurchaseOrderDto>({
        mockFn: (dto) => {
          const vendor = vendorMock.list().find((v) => v.id === dto.vendorId);
          return purchaseOrderMock.create(dto, vendor?.companyName ?? 'Unknown Vendor');
        },
        url: '/purchase-orders',
        method: 'POST',
      }),
      invalidatesTags: ['PurchaseOrder', 'Dashboard'],
    }),

    updatePurchaseOrder: builder.mutation<PurchaseOrder, UpdatePOArg>({
      ...mockableMutation<PurchaseOrder, UpdatePOArg>({
        mockFn: ({ id, ...dto }) => purchaseOrderMock.update(id, dto),
        url: (arg) => `/purchase-orders/${arg.id}`,
        method: 'PUT',
        body: ({ id: _id, ...dto }) => dto,
      }),
      invalidatesTags: ['PurchaseOrder', 'Dashboard'],
    }),

    deletePurchaseOrder: builder.mutation<string, string>({
      ...mockableMutation<string, string>({
        mockFn: (id) => purchaseOrderMock.remove(id),
        url: (id) => `/purchase-orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PurchaseOrder', 'Dashboard'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
} = purchaseOrdersApi;
