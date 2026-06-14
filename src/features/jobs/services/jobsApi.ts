import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation } from '@/services/mockUtils';
import { jobMock } from '@/mocks/jobs';
import { customerMock } from '@/mocks/customers';
import { technicianMock } from '@/mocks/technicians';
import type { Job, CreateJobDto } from '@/types/models/job';

interface UpdateJobArg extends Partial<CreateJobDto> {
  id:      string;
  status?: Job['status'];
}

export const jobsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getJobs: builder.query<Job[], void>({
      ...mockableQuery<Job[], void>({
        mockFn: () => jobMock.list(),
        url: '/jobs',
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
        mockFn: ({ id, ...dto }) => jobMock.update(id, dto),
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
