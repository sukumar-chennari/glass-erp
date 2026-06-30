import type { JobStatus, PaymentStatus } from '@/constants/statuses';
import type { GlassPosition, PaymentType, DamageType, Insurer } from '@/types/enums';
export type { PaymentType, DamageType } from '@/types/enums';
export type { GlassPosition } from '@/types/enums';
export type { Insurer } from '@/types/enums';

export interface InsuranceDetails {
  insurer:       Insurer;
  policyNumber:  string;
  accidentDate:  string;
  excessAmount?: number;
  claimId?:      string;
}

// ── Insurance Processing Workflow ─────────────────────────────────────
export type InsuranceProcessingState =
  | 'verifying_policy'
  | 'break_in_review'
  | 'documents_pending'
  | 'claim_submitted'
  | 'surveyor_assigned'
  | 'approved'
  | 'excess_pending'
  | 'excess_collected'
  | 'settlement_pending'
  | 'settled'
  | 'rejected';

export interface InsuranceDoc {
  id:       string;
  label:    string;
  required: boolean;
  uploaded: boolean;
}

export interface InsuranceProcessing {
  state:            InsuranceProcessingState;
  isBreakIn?:       boolean;
  claimNumber?:     string;
  surveyorName?:    string;
  approvedAmount?:  number;
  documents:        InsuranceDoc[];
  excessCollected?: boolean;
  updatedAt:        string;
}

// ── Stage History (technician execution timeline) ─────────────────────
export interface StageEvent {
  stage: string;
  at:    string;
  note?: string;
}

// ── Stock Resolution ──────────────────────────────────────────────────
export type StockResolutionState =
  | 'none'
  | 'transfer_requested'
  | 'transferred'
  | 'vendor_ordered'
  | 'branch_reassigned'
  | 'resolved';

export interface StockResolution {
  state:     StockResolutionState;
  note?:     string;
  updatedAt: string;
}

// ── Job ───────────────────────────────────────────────────────────────
export interface Job {
  id:                   string;
  jobNumber:            string;
  customerId:           string;
  customerName:         string;
  customerPhone:        string;
  vehicleId?:           string;
  vehicleName:          string;
  registrationNo:       string;
  glassPosition:        GlassPosition;
  damageType:           DamageType;
  productId?:           string;
  productName?:         string;
  technicianId?:        string;
  technicianName?:      string;
  paymentType:          PaymentType;
  estimatedCost?:       number;
  status:               JobStatus;
  notes?:               string;
  scheduledDate:        string;
  completedDate?:       string;
  assignedAt?:          string;
  insuranceDetails?:    InsuranceDetails;
  stageHistory?:        StageEvent[];
  paymentStatus?:       PaymentStatus;
  insuranceProcessing?: InsuranceProcessing;
  stockResolution?:     StockResolution;
  createdAt:            string;
  updatedAt?:           string;
}

export interface CreateJobDto {
  customerId:        string;
  vehicleId?:        string;
  vehicleName:       string;
  registrationNo:    string;
  glassPosition:     GlassPosition;
  damageType:        DamageType;
  productId?:        string;
  technicianId?:     string;
  paymentType:       PaymentType;
  estimatedCost?:    number;
  scheduledDate:     string;
  notes?:            string;
  insuranceDetails?: InsuranceDetails;
}

export interface UpdateJobDto extends Partial<CreateJobDto> {
  status?:              JobStatus;
  completedDate?:       string;
  technicianName?:      string;
  stageHistory?:        StageEvent[];
  paymentStatus?:       PaymentStatus;
  insuranceProcessing?: InsuranceProcessing;
  stockResolution?:     StockResolution;
}
