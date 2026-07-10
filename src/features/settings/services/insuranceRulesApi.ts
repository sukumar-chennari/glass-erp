import { baseApi } from '@/services/baseApi';
import { mockableQuery, mockableMutation, normalizeArray } from '@/services/mockUtils';
import { ENDPOINTS } from '@/services/api';
import { insuranceRuleMock } from '@/mocks/insuranceRules';
import type { InsuranceRule, InsuranceRulePayload, InsuranceRuleUpdatePayload } from '@/types/models/insuranceRule';

export const insuranceRulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInsuranceRules: builder.query<InsuranceRule[], void>({
      ...mockableQuery<InsuranceRule[], void>({
        mockFn: () => insuranceRuleMock.list(),
        url:    ENDPOINTS.insuranceRules.list,
        transformResponse: (raw) => normalizeArray<InsuranceRule>(raw, 'rules'),
      }),
      providesTags: ['InsuranceRule'],
    }),

    createInsuranceRule: builder.mutation<InsuranceRule, InsuranceRulePayload>({
      ...mockableMutation<InsuranceRule, InsuranceRulePayload>({
        mockFn: (p) => insuranceRuleMock.create(p),
        url:    ENDPOINTS.insuranceRules.create,
        method: 'POST',
      }),
      invalidatesTags: ['InsuranceRule'],
    }),

    updateInsuranceRule: builder.mutation<InsuranceRule, InsuranceRuleUpdatePayload>({
      ...mockableMutation<InsuranceRule, InsuranceRuleUpdatePayload>({
        mockFn: (p)   => insuranceRuleMock.update(p),
        url:    (arg) => ENDPOINTS.insuranceRules.update(arg.id),
        method: 'PUT',
        body:   ({ id: _id, ...dto }) => dto,
      }),
      invalidatesTags: ['InsuranceRule'],
    }),

    deleteInsuranceRule: builder.mutation<null, string>({
      ...mockableMutation<null, string>({
        mockFn: (id) => { insuranceRuleMock.remove(id); return null; },
        url:    (id) => ENDPOINTS.insuranceRules.remove(id),
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
