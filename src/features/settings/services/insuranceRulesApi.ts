import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation } from '@/services/mockUtils';
import { insuranceRuleMock } from '@/mocks/insuranceRules';
import type { InsuranceRule, InsuranceRulePayload, InsuranceRuleUpdatePayload } from '@/types/models/insuranceRule';

export const insuranceRulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInsuranceRules: builder.query<InsuranceRule[], void>({
      ...mockableQuery<InsuranceRule[], void>({
        mockFn: () => insuranceRuleMock.list(),
        url:    '/settings/insurance-rules',
      }),
      providesTags: ['InsuranceRule'],
    }),

    createInsuranceRule: builder.mutation<InsuranceRule, InsuranceRulePayload>({
      ...mockableMutation<InsuranceRule, InsuranceRulePayload>({
        mockFn: (p) => insuranceRuleMock.create(p),
        url:    '/settings/insurance-rules',
        method: 'POST',
      }),
      invalidatesTags: ['InsuranceRule'],
    }),

    updateInsuranceRule: builder.mutation<InsuranceRule, InsuranceRuleUpdatePayload>({
      ...mockableMutation<InsuranceRule, InsuranceRuleUpdatePayload>({
        mockFn: (p)         => insuranceRuleMock.update(p),
        url:    (arg)       => `/settings/insurance-rules/${arg.id}`,
        method: 'PUT',
        body:   ({ id: _id, ...dto }) => dto,
      }),
      invalidatesTags: ['InsuranceRule'],
    }),

    deleteInsuranceRule: builder.mutation<null, string>({
      ...mockableMutation<null, string>({
        mockFn: (id) => { insuranceRuleMock.remove(id); return null; },
        url:    (id) => `/settings/insurance-rules/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['InsuranceRule'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetInsuranceRulesQuery,
  useCreateInsuranceRuleMutation,
  useUpdateInsuranceRuleMutation,
  useDeleteInsuranceRuleMutation,
} = insuranceRulesApi;
