/**
 * Response adapters / mappers for backend API integration.
 *
 * WHEN TO USE: When the backend returns a shape that differs from the
 * frontend model (e.g. snake_case keys, missing denormalized fields,
 * different date formats), write an adapter here and call it in the
 * RTK Query endpoint's transformResponse option.
 *
 * EXAMPLE USAGE in an API slice:
 *
 *   getVendors: builder.query<Vendor[], void>({
 *     query: () => '/vendors',
 *     transformResponse: (raw: BackendVendor[]) => raw.map(adaptVendor),
 *     providesTags: ['Vendor'],
 *   }),
 */

import type { Vendor } from '@/types/models/vendor';
import type { Job } from '@/types/models/job';
import type { VendorStatus } from '@/constants/statuses';
import type { GlassPosition, PaymentType, DamageType } from '@/types/enums';

// ── Shape the backend may return (snake_case, id-only relations) ─────

export interface BackendVendor {
  id:             string;
  company_name:   string;
  contact_person: string;
  phone:          string;
  email?:         string;
  address?:       string;
  city:           string;
  gst_number:     string;
  status:         string;
  rating?:        number;
  created_at:     string;
  updated_at?:    string;
}

export interface BackendJob {
  id:              string;
  job_number:      string;
  customer_id:     string;
  customer_name:   string;     // backend may or may not denormalize
  customer_phone:  string;
  vehicle_name:    string;
  registration_no: string;
  glass_position:  string;
  damage_type:     string;
  product_id?:     string;
  product_name?:   string;
  technician_id?:  string;
  technician_name?: string;
  payment_type:    string;
  estimated_cost?: number;
  status:          string;
  notes?:          string;
  scheduled_date:  string;
  completed_date?: string;
  created_at:      string;
  updated_at?:     string;
}

// ── Adapter functions ────────────────────────────────────────────────

export function adaptVendor(raw: BackendVendor): Vendor {
  return {
    id:            raw.id,
    companyName:   raw.company_name,
    contactPerson: raw.contact_person,
    phone:         raw.phone,
    email:         raw.email,
    address:       raw.address,
    city:          raw.city,
    gstNumber:     raw.gst_number,
    status:        raw.status as VendorStatus,
    createdAt:     raw.created_at,
    updatedAt:     raw.updated_at,
  };
}

export function adaptJob(raw: BackendJob): Job {
  return {
    id:             raw.id,
    jobNumber:      raw.job_number,
    customerId:     raw.customer_id,
    customerName:   raw.customer_name ?? '',
    customerPhone:  raw.customer_phone ?? '',
    vehicleName:    raw.vehicle_name,
    registrationNo: raw.registration_no,
    glassPosition:  raw.glass_position as GlassPosition,
    damageType:     raw.damage_type as DamageType,
    productId:      raw.product_id,
    productName:    raw.product_name,
    technicianId:   raw.technician_id,
    technicianName: raw.technician_name,
    paymentType:    raw.payment_type as PaymentType,
    estimatedCost:  raw.estimated_cost,
    status:         raw.status as Job['status'],
    notes:          raw.notes,
    scheduledDate:  raw.scheduled_date,
    completedDate:  raw.completed_date,
    createdAt:      raw.created_at,
    updatedAt:      raw.updated_at,
  };
}

// ── DTO serializers (frontend model → API payload) ───────────────────

export function serializeVendorDto(dto: Partial<Vendor>): Partial<BackendVendor> {
  return {
    company_name:   dto.companyName,
    contact_person: dto.contactPerson,
    phone:          dto.phone,
    email:          dto.email,
    address:        dto.address,
    city:           dto.city,
    gst_number:     dto.gstNumber,
    status:         dto.status,
  };
}
