import type { StockEntry, AdjustStockDto } from '@/types/models/stock';
import { STOCK_STATUS } from '@/constants/statuses';
import type { StockStatus } from '@/constants/statuses';

function calcStatus(qty: number, threshold: number): StockStatus {
  if (qty === 0) return STOCK_STATUS.OUT_OF_STOCK;
  if (qty <= threshold) return STOCK_STATUS.LOW_STOCK;
  return STOCK_STATUS.IN_STOCK;
}

// Stock is derived from products; this mock simulates a dedicated stock view
let store: StockEntry[] = [
  {
    id: 'st-001', productId: 'p-001',
    productName: 'Maruti Suzuki Swift Front Windshield', sku: 'MS-SW-FW-001',
    vehicleMake: 'Maruti Suzuki', vehicleModel: 'Swift', glassPosition: 'Front Windshield',
    currentQty: 12, lowStockThreshold: 3, stockStatus: STOCK_STATUS.IN_STOCK,
    vendorName: 'Bajaj Glass Supplies', unitCost: 3200,
    lastUpdated: '2025-06-10T09:00:00Z',
  },
  {
    id: 'st-002', productId: 'p-002',
    productName: 'Hyundai i20 Front Windshield', sku: 'HY-I20-FW-001',
    vehicleMake: 'Hyundai', vehicleModel: 'i20', glassPosition: 'Front Windshield',
    currentQty: 2, lowStockThreshold: 3, stockStatus: STOCK_STATUS.LOW_STOCK,
    vendorName: 'AGC Glass India', unitCost: 3800,
    lastUpdated: '2025-06-08T14:00:00Z',
  },
  {
    id: 'st-003', productId: 'p-003',
    productName: 'Honda City Rear Windshield', sku: 'HC-CT-RW-001',
    vehicleMake: 'Honda', vehicleModel: 'City', glassPosition: 'Rear Windshield',
    currentQty: 0, lowStockThreshold: 2, stockStatus: STOCK_STATUS.OUT_OF_STOCK,
    vendorName: 'Bajaj Glass Supplies', unitCost: 2700,
    lastUpdated: '2025-06-05T11:00:00Z',
  },
  {
    id: 'st-004', productId: 'p-004',
    productName: 'Toyota Innova Driver Side Window', sku: 'TY-IN-DSW-001',
    vehicleMake: 'Toyota', vehicleModel: 'Innova', glassPosition: 'Driver Side Window',
    currentQty: 8, lowStockThreshold: 2, stockStatus: STOCK_STATUS.IN_STOCK,
    vendorName: 'Guardian Glass Ltd', unitCost: 1900,
    lastUpdated: '2025-06-12T10:00:00Z',
  },
  {
    id: 'st-005', productId: 'p-005',
    productName: 'Tata Nexon Sunroof Glass', sku: 'TT-NX-SRF-001',
    vehicleMake: 'Tata', vehicleModel: 'Nexon', glassPosition: 'Sunroof Glass',
    currentQty: 5, lowStockThreshold: 2, stockStatus: STOCK_STATUS.IN_STOCK,
    vendorName: 'AGC Glass India', unitCost: 6200,
    lastUpdated: '2025-06-11T08:00:00Z',
  },
  {
    id: 'st-006', productId: 'p-006',
    productName: 'Mahindra XUV 700 Rear Windshield', sku: 'MH-X7-RW-001',
    vehicleMake: 'Mahindra', vehicleModel: 'XUV 700', glassPosition: 'Rear Windshield',
    currentQty: 1, lowStockThreshold: 2, stockStatus: STOCK_STATUS.LOW_STOCK,
    vendorName: 'Guardian Glass Ltd', unitCost: 4800,
    lastUpdated: '2025-06-09T16:00:00Z',
  },
];

export const stockMock = {
  list: (): StockEntry[] => [...store],

  adjust: (dto: AdjustStockDto): StockEntry => {
    const idx = store.findIndex((s) => s.productId === dto.productId);
    if (idx === -1) throw new Error(`Stock entry for product ${dto.productId} not found`);
    const newQty    = Math.max(0, store[idx].currentQty + dto.adjustment);
    const newStatus = calcStatus(newQty, store[idx].lowStockThreshold);
    const updated: StockEntry = {
      ...store[idx],
      currentQty:  newQty,
      stockStatus: newStatus,
      lastUpdated: new Date().toISOString(),
    };
    store = store.map((s) => (s.productId === dto.productId ? updated : s));
    return updated;
  },
};
