export type BoardType   = 'Yellow' | 'White';
export type CCCondition = 'Above 1500cc' | 'Below 1500cc';

export interface InsuranceRule {
  id:           string;
  boardType:    BoardType;
  ccCondition:  CCCondition;
  extraCharges: number;   // flat INR amount
  depreciation: number;   // percentage 0-100
  isActive:     boolean;
}

export type InsuranceRulePayload       = Omit<InsuranceRule, 'id'>;
export type InsuranceRuleUpdatePayload = { id: string } & Partial<InsuranceRulePayload>;
