import type { JobStatus } from '@/constants/statuses';
import type { GlassPosition, PaymentType, DamageType } from '@/types/enums';
export type { PaymentType, DamageType } from '@/types/enums';
export type { GlassPosition } from '@/types/enums';

export interface Job {
  id:             string;
  jobNumber:      string;
  customerId:     string;
  customerName:   string;
  customerPhone:  string;
  vehicleId?:     string;
  vehicleName:    string;     // "Honda City 2020"
  registrationNo: string;
  glassPosition:  GlassPosition;
  damageType:     DamageType;
  productId?:     string;
  productName?:   string;
  technicianId?:  string;
  technicianName?: string;
  paymentType:    PaymentType;
  estimatedCost?: number;
  status:         JobStatus;
  notes?:         string;
  scheduledDate:  string;
  completedDate?: string;
  createdAt:      string;
  updatedAt?:     string;
}

export interface CreateJobDto {
  customerId:    string;
  vehicleId?:    string;
  vehicleName:   string;
  registrationNo:string;
  glassPosition: GlassPosition;
  damageType:    DamageType;
  productId?:    string;
  technicianId?: string;
  paymentType:   PaymentType;
  estimatedCost?: number;
  scheduledDate: string;
  notes?:        string;
}

export interface UpdateJobDto extends Partial<CreateJobDto> {
  status?: JobStatus;
  completedDate?: string;
}
