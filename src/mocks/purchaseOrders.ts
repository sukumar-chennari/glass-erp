import type {
  PurchaseOrder,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
} from '@/types/models/purchaseOrder';
import { PO_STATUS } from '@/constants/statuses';

function calcTotals(items: { quantity: number; unitPrice: number }[]) {
  const subtotal  = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const gstAmount = Math.round(subtotal * 0.18);
  return { subtotal, gstAmount, totalAmount: subtotal + gstAmount };
}

let store: PurchaseOrder[] = [
  {
    id: 'po-001',
    poNumber: 'PO-2025-001',
    vendorId: 'v-001',
    vendorName: 'Bajaj Glass Supplies',
    items: [
      { id: 'poi-001', productName: 'Swift Front Windshield', quantity: 5, unitPrice: 3200, totalPrice: 16000 },
      { id: 'poi-002', productName: 'i20 Front Windshield',   quantity: 3, unitPrice: 3800, totalPrice: 11400 },
    ],
    subtotal:    27400,
    gstAmount:   4932,
    totalAmount: 32332,
    status:      PO_STATUS.IN_TRANSIT,
    expectedDeliveryDate: '2025-07-10',
    createdAt:   '2025-06-20T10:00:00Z',
  },
  {
    id: 'po-002',
    poNumber: 'PO-2025-002',
    vendorId: 'v-002',
    vendorName: 'AGC Glass India',
    items: [
      { id: 'poi-003', productName: 'Honda City Rear Windshield', quantity: 4, unitPrice: 2700, totalPrice: 10800 },
    ],
    subtotal:    10800,
    gstAmount:   1944,
    totalAmount: 12744,
    status:      PO_STATUS.ACCEPTED,
    expectedDeliveryDate: '2025-07-15',
    createdAt:   '2025-06-18T09:00:00Z',
  },
  {
    id: 'po-003',
    poNumber: 'PO-2025-003',
    vendorId: 'v-003',
    vendorName: 'Guardian Glass Ltd',
    items: [
      { id: 'poi-004', productName: 'Toyota Innova Side Window',  quantity: 6, unitPrice: 1900, totalPrice: 11400 },
      { id: 'poi-005', productName: 'XUV 700 Rear Windshield',    quantity: 3, unitPrice: 4800, totalPrice: 14400 },
    ],
    subtotal:    25800,
    gstAmount:   4644,
    totalAmount: 30444,
    status:      PO_STATUS.RECEIVED,
    expectedDeliveryDate: '2025-06-05',
    createdAt:   '2025-05-28T11:00:00Z',
  },
  {
    id: 'po-004',
    poNumber: 'PO-2025-004',
    vendorId: 'v-001',
    vendorName: 'Bajaj Glass Supplies',
    items: [
      { id: 'poi-006', productName: 'Nexon Sunroof Glass', quantity: 2, unitPrice: 6200, totalPrice: 12400 },
    ],
    subtotal:    12400,
    gstAmount:   2232,
    totalAmount: 14632,
    status:      PO_STATUS.DRAFT,
    expectedDeliveryDate: '2025-07-25',
    createdAt:   '2025-06-25T14:00:00Z',
  },
];

let nextPO   = 5;
let nextItem = 7;

export const purchaseOrderMock = {
  list: (): PurchaseOrder[] => [...store],

  create: (dto: CreatePurchaseOrderDto, vendorName: string): PurchaseOrder => {
    const items = dto.items.map((i) => ({
      id:         `poi-0${nextItem++}`,
      productId:  i.productId,
      productName: i.productName,
      quantity:   i.quantity,
      unitPrice:  i.unitPrice,
      totalPrice: i.quantity * i.unitPrice,
    }));
    const { subtotal, gstAmount, totalAmount } = calcTotals(items);
    const po: PurchaseOrder = {
      id:                   `po-00${nextPO}`,
      poNumber:             `PO-2025-00${nextPO++}`,
      vendorId:             dto.vendorId,
      vendorName,
      items,
      subtotal,
      gstAmount,
      totalAmount,
      status:               PO_STATUS.DRAFT,
      expectedDeliveryDate: dto.expectedDeliveryDate,
      notes:                dto.notes,
      createdAt:            new Date().toISOString(),
    };
    store = [...store, po];
    return po;
  },

  update: (id: string, dto: UpdatePurchaseOrderDto): PurchaseOrder => {
    const idx = store.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`PO ${id} not found`);
    const existing = store[idx];
    const items = dto.items
      ? dto.items.map((i) => ({
          id: `poi-0${nextItem++}`,
          productId: i.productId,
          productName: i.productName,
          quantity:   i.quantity,
          unitPrice:  i.unitPrice,
          totalPrice: i.quantity * i.unitPrice,
        }))
      : existing.items;
    const totals = dto.items ? calcTotals(items) : {
      subtotal: existing.subtotal,
      gstAmount: existing.gstAmount,
      totalAmount: existing.totalAmount,
    };
    const updated: PurchaseOrder = {
      ...existing,
      ...totals,
      items,
      status:               dto.status               ?? existing.status,
      expectedDeliveryDate: dto.expectedDeliveryDate ?? existing.expectedDeliveryDate,
      notes:                dto.notes                ?? existing.notes,
      updatedAt:            new Date().toISOString(),
    };
    store = store.map((p) => (p.id === id ? updated : p));
    return updated;
  },

  remove: (id: string): string => {
    store = store.filter((p) => p.id !== id);
    return id;
  },
};
