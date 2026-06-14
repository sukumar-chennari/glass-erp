import type { PoStatus } from '@/constants/statuses';

export interface POItem {
  id:          string;
  productId?:  string;
  productName: string;
  quantity:    number;
  unitPrice:   number;
  totalPrice:  number;
}

export interface PurchaseOrder {
  id:                   string;
  poNumber:             string;
  vendorId:             string;
  vendorName:           string;
  items:                POItem[];
  subtotal:             number;
  gstAmount:            number;
  totalAmount:          number;
  status:               PoStatus;
  expectedDeliveryDate?: string;
  notes?:               string;
  createdAt:            string;
  updatedAt?:           string;
}

export interface CreatePOItemDto {
  productId?:  string;
  productName: string;
  quantity:    number;
  unitPrice:   number;
}

export interface CreatePurchaseOrderDto {
  vendorId:              string;
  items:                 CreatePOItemDto[];
  expectedDeliveryDate?: string;
  notes?:                string;
}

export interface UpdatePurchaseOrderDto extends Partial<Omit<CreatePurchaseOrderDto, 'vendorId'>> {
  status?: PoStatus;
}
