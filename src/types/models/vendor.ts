import type { VendorStatus } from '@/constants/statuses';

export interface Vendor {
  id:              string;
  companyName:     string;
  contactPerson:   string;
  phone:           string;
  email?:          string;
  gstNumber:       string;
  city:            string;
  state?:          string;
  address?:        string;
  productsSupplied?: string[];
  status:          VendorStatus;
  createdAt:       string;
  updatedAt?:      string;
}

export interface CreateVendorDto {
  companyName:     string;
  contactPerson:   string;
  phone:           string;
  email?:          string;
  gstNumber:       string;
  city:            string;
  state?:          string;
  address?:        string;
  productsSupplied?: string[];
}

export interface UpdateVendorDto extends Partial<CreateVendorDto> {
  status?: VendorStatus;
}
