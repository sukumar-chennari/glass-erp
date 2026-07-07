import { mockId } from '@/services/mockUtils';
import type { InsuranceRule, InsuranceRulePayload, InsuranceRuleUpdatePayload } from '@/types/models/insuranceRule';

let store: InsuranceRule[] = [
  { id: 'ir-001', boardType: 'Yellow', ccCondition: 'Above 1500cc', extraCharges: 1500, depreciation: 15, isActive: true  },
  { id: 'ir-002', boardType: 'Yellow', ccCondition: 'Below 1500cc', extraCharges: 1000, depreciation: 10, isActive: true  },
  { id: 'ir-003', boardType: 'White',  ccCondition: 'Above 1500cc', extraCharges: 800,  depreciation: 12, isActive: true  },
  { id: 'ir-004', boardType: 'White',  ccCondition: 'Below 1500cc', extraCharges: 600,  depreciation:  8, isActive: false },
];

export const insuranceRuleMock = {
  list: (): InsuranceRule[] => [...store],

  create: (p: InsuranceRulePayload): InsuranceRule => {
    const rule: InsuranceRule = { ...p, id: mockId('ir-') };
    store = [...store, rule];
    return rule;
  },

  update: ({ id, ...dto }: InsuranceRuleUpdatePayload): InsuranceRule => {
    store = store.map((r) => (r.id === id ? { ...r, ...dto } : r));
    const updated = store.find((r) => r.id === id);
    if (!updated) throw new Error(`InsuranceRule ${id} not found`);
    return updated;
  },

  remove: (id: string): void => {
    store = store.filter((r) => r.id !== id);
  },
};
