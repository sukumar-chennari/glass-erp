import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation, normalizeArray } from '@/services/mockUtils';
import { jobMock } from '@/mocks/jobs';
import { customerMock } from '@/mocks/customers';
import { technicianMock } from '@/mocks/technicians';
import type {
  Job, CreateJobDto,
  InsuranceProcessing, StockResolution, StageEvent,
} from '@/types/models/job';
import type { PaymentStatus } from '@/constants/statuses';

interface UpdateJobArg extends Partial<CreateJobDto> {
  id:                   string;
  status?:              Job['status'];
  technicianName?:      string;
  stageHistory?:        StageEvent[];
  paymentStatus?:       PaymentStatus;
  insuranceProcessing?: InsuranceProcessing;
  stockResolution?:     StockResolution;
}

export const jobsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getJobs: builder.query<Job[], void>({
      ...mockableQuery<Job[], void>({
        mockFn: () => jobMock.list(),
        url: '/jobs',
        transformResponse: (raw) => normalizeArray<Job>(raw, 'jobs'),
      }),
      providesTags: ['Job'],
    }),

    createJob: builder.mutation<Job, CreateJobDto>({
      ...mockableMutation<Job, CreateJobDto>({
        mockFn: (dto) => {
          const customer    = customerMock.list().find((c) => c.id === dto.customerId);
          const technician  = dto.technicianId
            ? technicianMock.list().find((t) => t.id === dto.technicianId)
            : undefined;
          return jobMock.create(
            dto,
            customer?.name      ?? 'Unknown',
            customer?.phone     ?? '',
            technician?.name,
          );
        },
        url: '/jobs',
        method: 'POST',
      }),
      invalidatesTags: ['Job', 'Dashboard'],
    }),

    updateJob: builder.mutation<Job, UpdateJobArg>({
      ...mockableMutation<Job, UpdateJobArg>({
        mockFn: ({ id, ...dto }) => {
          // Resolve technician name when technicianId is being set
          const technicianName =
            dto.technicianId && !dto.technicianName
              ? technicianMock.list().find((t) => t.id === dto.technicianId)?.name
              : dto.technicianName;
          return jobMock.update(id, { ...dto, technicianName });
        },
        url: (arg) => `/jobs/${arg.id}`,
        method: 'PUT',
        body: ({ id: _id, ...dto }) => dto,
      }),
      invalidatesTags: ['Job', 'Dashboard'],
    }),

    deleteJob: builder.mutation<string, string>({
      ...mockableMutation<string, string>({
        mockFn: (id) => jobMock.remove(id),
        url: (id) => `/jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Job', 'Dashboard'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetJobsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
} = jobsApi;
