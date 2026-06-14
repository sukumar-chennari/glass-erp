import type { ClaimStatus } from '@/constants/statuses';
import type { GlassPosition, DamageType as JobDamageType, Insurer } from '@/types/enums';
export type { Insurer } from '@/types/enums';
export type { GlassPosition } from '@/types/enums';

export interface ClaimTimelineStep {
  step:  string;
  date:  string;
  note:  string;
  state: 'done' | 'active' | 'partial' | 'rejected' | 'pending';
}

export interface Claim {
  id:             string;
  claimNumber:    string;
  jobId?:         string;
  customerId:     string;
  customerName:   string;
  vehicleName:    string;
  registrationNo: string;
  glassPosition:  GlassPosition;
  damageType:     JobDamageType;
  insurer:        Insurer;
  policyNumber:   string;
  policyExpiry?:  string;
  surveyorName?:  string;
  surveyorCompany?: string;
  surveyorVisitDate?: string;
  claimedAmount:  number;
  approvedAmount: number;
  customerBalance: number;  // claimedAmount - approvedAmount
  deductible?:    number;
  status:         ClaimStatus;
  remarks?:       string;
  documents?:     string[];
  history:        ClaimTimelineStep[];
  submittedAt:    string;
  updatedAt?:     string;
}

export interface CreateClaimDto {
  customerId:    string;
  vehicleName:   string;
  registrationNo:string;
  glassPosition: GlassPosition;
  damageType:    JobDamageType;
  incidentDate:  string;
  insurer:       Insurer;
  policyNumber:  string;
  policyExpiry?: string;
  claimedAmount: number;
  deductible?:   number;
  description?:  string;
  surveyorName?: string;
}

export interface UpdateClaimDto {
  status?:         ClaimStatus;
  approvedAmount?: number;
  remarks?:        string;
  surveyorName?:   string;
  surveyorCompany?: string;
  surveyorVisitDate?: string;
}
