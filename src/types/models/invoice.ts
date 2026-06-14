import type { InvoiceStatus } from '@/constants/statuses';
import type { PaymentType } from '@/types/enums';

export interface InvoiceLineItem {
  id:          string;
  description: string;
  quantity:    number;
  unitPrice:   number;
  gstRate:     number;
  totalPrice:  number;
}

export interface Invoice {
  id:            string;
  invoiceNumber: string;
  jobId?:        string;
  customerId:    string;
  customerName:  string;
  customerPhone: string;
  vehicleName:   string;
  registrationNo: string;
  items:         InvoiceLineItem[];
  subtotal:      number;
  gstAmount:     number;
  discount:      number;
  totalAmount:   number;
  paymentType:   PaymentType;
  status:        InvoiceStatus;
  dueDate?:      string;
  paidDate?:     string;
  notes?:        string;
  createdAt:     string;
  updatedAt?:    string;
}

export interface CreateInvoiceDto {
  customerId:    string;
  jobId?:        string;
  vehicleName:   string;
  registrationNo: string;
  items:         Omit<InvoiceLineItem, 'id' | 'totalPrice'>[];
  discount?:     number;
  paymentType:   PaymentType;
  dueDate?:      string;
  notes?:        string;
}

export interface UpdateInvoiceDto extends Partial<Omit<CreateInvoiceDto, 'customerId'>> {
  status?: InvoiceStatus;
  paidDate?: string;
}
