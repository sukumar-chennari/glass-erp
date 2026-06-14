import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation } from '@/services/mockUtils';
import { vendorMock } from '@/mocks/vendors';
import type { Vendor, CreateVendorDto, UpdateVendorDto } from '@/types/models/vendor';

interface UpdateVendorArg extends UpdateVendorDto {
  id: string;
}

export const vendorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVendors: builder.query<Vendor[], void>({
      ...mockableQuery<Vendor[], void>({
        mockFn: () => vendorMock.list(),
        url: '/vendors',
      }),
      providesTags: ['Vendor'],
    }),

    createVendor: builder.mutation<Vendor, CreateVendorDto>({
      ...mockableMutation<Vendor, CreateVendorDto>({
        mockFn: (dto) => vendorMock.create(dto),
        url: '/vendors',
        method: 'POST',
      }),
      invalidatesTags: ['Vendor'],
    }),

    updateVendor: builder.mutation<Vendor, UpdateVendorArg>({
      ...mockableMutation<Vendor, UpdateVendorArg>({
        mockFn: ({ id, ...dto }) => vendorMock.update(id, dto),
        url: (arg) => `/vendors/${arg.id}`,
        method: 'PUT',
        body: ({ id: _id, ...dto }) => dto,
      }),
      invalidatesTags: ['Vendor'],
    }),

    deleteVendor: builder.mutation<string, string>({
      ...mockableMutation<string, string>({
        mockFn: (id) => vendorMock.remove(id),
        url: (id) => `/vendors/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Vendor'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetVendorsQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
} = vendorsApi;
