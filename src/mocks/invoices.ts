import type { Invoice, CreateInvoiceDto, InvoiceLineItem } from '@/types/models/invoice';
import { INVOICE_STATUS } from '@/constants/statuses';

function buildItems(raw: Omit<InvoiceLineItem, 'id' | 'totalPrice'>[], startIdx: number) {
  return raw.map((item, i) => ({
    ...item,
    id:         `ili-0${startIdx + i}`,
    totalPrice: item.quantity * item.unitPrice * (1 + item.gstRate / 100),
  }));
}

function calcTotals(items: InvoiceLineItem[], discount: number) {
  const subtotal  = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const gstAmount = items.reduce((s, i) => s + (i.quantity * i.unitPrice * i.gstRate) / 100, 0);
  const totalAmount = subtotal + gstAmount - discount;
  return { subtotal: Math.round(subtotal), gstAmount: Math.round(gstAmount), totalAmount: Math.round(totalAmount) };
}

let store: Invoice[] = [
  {
    id: 'inv-001', invoiceNumber: 'INV-2025-0051',
    jobId: 'j-002',
    customerId: 'c-003', customerName: 'Mohan Singh', customerPhone: '9876543212',
    vehicleName: 'Hyundai i20 2021', registrationNo: 'UP 07 EF 9012',
    items: [
      { id: 'ili-001', description: 'Driver Side Window Replacement', quantity: 1, unitPrice: 3800, gstRate: 18, totalPrice: 4484 },
      { id: 'ili-002', description: 'Labour Charges', quantity: 1, unitPrice: 500, gstRate: 18, totalPrice: 590 },
    ],
    subtotal: 4300, gstAmount: 774, discount: 0, totalAmount: 5074,
    paymentType: 'Cash', status: INVOICE_STATUS.PAID,
    paidDate: '2025-06-28', createdAt: '2025-06-28T12:00:00Z',
  },
  {
    id: 'inv-002', invoiceNumber: 'INV-2025-0050',
    jobId: 'j-004',
    customerId: 'c-004', customerName: 'Anjali Verma', customerPhone: '9876543213',
    vehicleName: 'Toyota Innova Crysta 2022', registrationNo: 'MH 02 GH 3456',
    items: [
      { id: 'ili-003', description: 'Sunroof Glass Replacement', quantity: 1, unitPrice: 8500, gstRate: 18, totalPrice: 10030 },
      { id: 'ili-004', description: 'Labour Charges', quantity: 1, unitPrice: 800, gstRate: 18, totalPrice: 944 },
    ],
    subtotal: 9300, gstAmount: 1674, discount: 500, totalAmount: 10474,
    paymentType: 'Card', status: INVOICE_STATUS.PAID,
    paidDate: '2025-06-26', createdAt: '2025-06-26T16:00:00Z',
  },
  {
    id: 'inv-003', invoiceNumber: 'INV-2025-0049',
    jobId: 'j-001',
    customerId: 'c-001', customerName: 'Ravi Kumar', customerPhone: '9876543210',
    vehicleName: 'Honda City 2020', registrationNo: 'DL 01 AB 1234',
    items: [
      { id: 'ili-005', description: 'Front Windshield Replacement', quantity: 1, unitPrice: 5200, gstRate: 18, totalPrice: 6136 },
      { id: 'ili-006', description: 'Labour Charges', quantity: 1, unitPrice: 700, gstRate: 18, totalPrice: 826 },
    ],
    subtotal: 5900, gstAmount: 1062, discount: 0, totalAmount: 6962,
    paymentType: 'Insurance', status: INVOICE_STATUS.SENT,
    dueDate: '2025-07-15', createdAt: '2025-06-30T10:00:00Z',
  },
  {
    id: 'inv-004', invoiceNumber: 'INV-2025-0048',
    customerId: 'c-002', customerName: 'Priya Sharma', customerPhone: '9876543211',
    vehicleName: 'Maruti Swift 2018', registrationNo: 'HR 26 CD 5678',
    items: [
      { id: 'ili-007', description: 'Rear Windshield Replacement', quantity: 1, unitPrice: 3500, gstRate: 18, totalPrice: 4130 },
    ],
    subtotal: 3500, gstAmount: 630, discount: 0, totalAmount: 4130,
    paymentType: 'UPI', status: INVOICE_STATUS.DRAFT,
    createdAt: '2025-06-27T09:00:00Z',
  },
  {
    id: 'inv-005', invoiceNumber: 'INV-2025-0047',
    customerId: 'c-005', customerName: 'Suresh Reddy', customerPhone: '9876543214',
    vehicleName: 'Kia Seltos 2023', registrationNo: 'TS 09 IJ 7890',
    items: [
      { id: 'ili-008', description: 'Front Windshield Replacement', quantity: 1, unitPrice: 5500, gstRate: 18, totalPrice: 6490 },
      { id: 'ili-009', description: 'Labour Charges', quantity: 1, unitPrice: 700, gstRate: 18, totalPrice: 826 },
    ],
    subtotal: 6200, gstAmount: 1116, discount: 0, totalAmount: 7316,
    paymentType: 'UPI', status: INVOICE_STATUS.OVERDUE,
    dueDate: '2025-05-10', createdAt: '2025-05-03T11:00:00Z',
  },
  {
    id: 'inv-006', invoiceNumber: 'INV-2025-0046',
    customerId: 'c-003', customerName: 'Mohan Singh', customerPhone: '9876543212',
    vehicleName: 'Hyundai i20 2021', registrationNo: 'UP 07 EF 9012',
    items: [
      { id: 'ili-010', description: 'Quarter Glass Replacement', quantity: 1, unitPrice: 2200, gstRate: 18, totalPrice: 2596 },
    ],
    subtotal: 2200, gstAmount: 396, discount: 0, totalAmount: 2596,
    paymentType: 'Cash', status: INVOICE_STATUS.VOID,
    notes: 'Voided — customer cancelled service', createdAt: '2025-04-15T14:00:00Z',
  },
];

let nextInv  = 52;
let nextItem = 11;

export const invoiceMock = {
  list: (): Invoice[] => [...store],

  create: (dto: CreateInvoiceDto, customerName: string, customerPhone: string): Invoice => {
    const items = buildItems(dto.items, nextItem);
    nextItem += dto.items.length;
    const { subtotal, gstAmount, totalAmount } = calcTotals(items, dto.discount ?? 0);
    const invoice: Invoice = {
      id:            `inv-00${store.length + 1}`,
      invoiceNumber: `INV-2025-00${nextInv++}`,
      jobId:         dto.jobId,
      customerId:    dto.customerId,
      customerName,
      customerPhone,
      vehicleName:    dto.vehicleName,
      registrationNo: dto.registrationNo,
      items,
      subtotal,
      gstAmount,
      discount:    dto.discount ?? 0,
      totalAmount,
      paymentType: dto.paymentType,
      status:      INVOICE_STATUS.DRAFT,
      dueDate:     dto.dueDate,
      notes:       dto.notes,
      createdAt:   new Date().toISOString(),
    };
    store = [...store, invoice];
    return invoice;
  },

  update: (id: string, dto: { status?: Invoice['status']; paidDate?: string; notes?: string }): Invoice => {
    const idx = store.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error(`Invoice ${id} not found`);
    const updated: Invoice = { ...store[idx], ...dto, updatedAt: new Date().toISOString() };
    store = store.map((i) => (i.id === id ? updated : i));
    return updated;
  },

  remove: (id: string): string => {
    store = store.filter((i) => i.id !== id);
    return id;
  },
};
