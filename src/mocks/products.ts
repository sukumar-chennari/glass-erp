import type { Product, CreateProductDto } from '@/types/models/product';
import { STOCK_STATUS } from '@/constants/statuses';
import type { StockStatus } from '@/constants/statuses';

function calcStatus(qty: number, threshold: number): StockStatus {
  if (qty === 0) return STOCK_STATUS.OUT_OF_STOCK;
  if (qty <= threshold) return STOCK_STATUS.LOW_STOCK;
  return STOCK_STATUS.IN_STOCK;
}

let store: Product[] = [
  {
    id: 'p-001',
    name: 'Maruti Suzuki Swift Front Windshield',
    sku: 'MS-SW-FW-001',
    vehicleMake: 'Maruti Suzuki',
    vehicleModel: 'Swift',
    vehicleYear: '2018-2024',
    glassPosition: 'Front Windshield',
    price: 4500,
    costPrice: 3200,
    gstRate: 18,
    stockQty: 12,
    lowStockThreshold: 3,
    stockStatus: STOCK_STATUS.IN_STOCK,
    vendorId: 'v-001',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'p-002',
    name: 'Hyundai i20 Front Windshield',
    sku: 'HY-I20-FW-001',
    vehicleMake: 'Hyundai',
    vehicleModel: 'i20',
    vehicleYear: '2020-2024',
    glassPosition: 'Front Windshield',
    price: 5200,
    costPrice: 3800,
    gstRate: 18,
    stockQty: 2,
    lowStockThreshold: 3,
    stockStatus: STOCK_STATUS.LOW_STOCK,
    vendorId: 'v-002',
    createdAt: '2024-02-01T09:00:00Z',
  },
  {
    id: 'p-003',
    name: 'Honda City Rear Windshield',
    sku: 'HC-CT-RW-001',
    vehicleMake: 'Honda',
    vehicleModel: 'City',
    vehicleYear: '2019-2023',
    glassPosition: 'Rear Windshield',
    price: 3800,
    costPrice: 2700,
    gstRate: 18,
    stockQty: 0,
    lowStockThreshold: 2,
    stockStatus: STOCK_STATUS.OUT_OF_STOCK,
    vendorId: 'v-001',
    createdAt: '2024-02-10T11:00:00Z',
  },
  {
    id: 'p-004',
    name: 'Toyota Innova Driver Side Window',
    sku: 'TY-IN-DSW-001',
    vehicleMake: 'Toyota',
    vehicleModel: 'Innova',
    vehicleYear: '2016-2023',
    glassPosition: 'Driver Side Window',
    price: 2800,
    costPrice: 1900,
    gstRate: 18,
    stockQty: 8,
    lowStockThreshold: 2,
    stockStatus: STOCK_STATUS.IN_STOCK,
    vendorId: 'v-003',
    createdAt: '2024-03-05T08:00:00Z',
  },
  {
    id: 'p-005',
    name: 'Tata Nexon Sunroof Glass',
    sku: 'TT-NX-SRF-001',
    vehicleMake: 'Tata',
    vehicleModel: 'Nexon',
    vehicleYear: '2020-2024',
    glassPosition: 'Sunroof Glass',
    price: 8500,
    costPrice: 6200,
    gstRate: 18,
    stockQty: 5,
    lowStockThreshold: 2,
    stockStatus: STOCK_STATUS.IN_STOCK,
    vendorId: 'v-002',
    createdAt: '2024-03-20T12:00:00Z',
  },
  {
    id: 'p-006',
    name: 'Mahindra XUV 700 Rear Windshield',
    sku: 'MH-X7-RW-001',
    vehicleMake: 'Mahindra',
    vehicleModel: 'XUV 700',
    vehicleYear: '2021-2024',
    glassPosition: 'Rear Windshield',
    price: 6500,
    costPrice: 4800,
    gstRate: 18,
    stockQty: 1,
    lowStockThreshold: 2,
    stockStatus: STOCK_STATUS.LOW_STOCK,
    vendorId: 'v-003',
    createdAt: '2024-04-01T10:00:00Z',
  },
];

let nextNum = 7;

export const productMock = {
  list: (): Product[] => [...store],

  create: (dto: CreateProductDto): Product => {
    const status = calcStatus(dto.stockQty, dto.lowStockThreshold);
    const product: Product = {
      ...dto,
      id: `p-00${nextNum++}`,
      stockStatus: status,
      createdAt: new Date().toISOString(),
    };
    store = [...store, product];
    return product;
  },

  update: (id: string, dto: Partial<CreateProductDto>): Product => {
    const idx = store.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Product ${id} not found`);
    const merged = { ...store[idx], ...dto };
    const status = calcStatus(merged.stockQty, merged.lowStockThreshold);
    const updated: Product = { ...merged, stockStatus: status, updatedAt: new Date().toISOString() } as Product & { updatedAt: string };
    store = store.map((p) => (p.id === id ? updated : p));
    return updated;
  },

  remove: (id: string): string => {
    store = store.filter((p) => p.id !== id);
    return id;
  },
};
