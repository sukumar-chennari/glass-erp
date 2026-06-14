import type { Vendor, CreateVendorDto, UpdateVendorDto } from '@/types/models/vendor';
import { VENDOR_STATUS } from '@/constants/statuses';

let store: Vendor[] = [
  {
    id: 'v-001',
    companyName:   'Bajaj Glass Supplies',
    contactPerson: 'Rajesh Patel',
    phone:         '9876543210',
    email:         'rajesh@bajajglass.in',
    gstNumber:     '27AABCB1234A1Z5',
    city:          'Mumbai',
    state:         'Maharashtra',
    productsSupplied: ['Windshields', 'Side Glass'],
    status:        VENDOR_STATUS.ACTIVE,
    createdAt:     '2024-01-10T09:00:00Z',
  },
  {
    id: 'v-002',
    companyName:   'AGC Glass India',
    contactPerson: 'Priya Sharma',
    phone:         '9876543211',
    email:         'priya@agcglass.in',
    gstNumber:     '07AABCA5678B2Z0',
    city:          'Delhi',
    state:         'Delhi',
    productsSupplied: ['Windshields', 'Rear Glass', 'Sunroof'],
    status:        VENDOR_STATUS.ACTIVE,
    createdAt:     '2024-02-14T10:30:00Z',
  },
  {
    id: 'v-003',
    companyName:   'Guardian Glass Ltd',
    contactPerson: 'Suresh Nair',
    phone:         '9876543215',
    email:         'suresh@guardianglass.in',
    gstNumber:     '29AABCG4321C3Z1',
    city:          'Bengaluru',
    state:         'Karnataka',
    productsSupplied: ['All Glass Types'],
    status:        VENDOR_STATUS.ACTIVE,
    createdAt:     '2024-03-05T08:00:00Z',
  },
  {
    id: 'v-004',
    companyName:   'Premium Glass Works',
    contactPerson: 'Meena Iyer',
    phone:         '9876543219',
    email:         'meena@premiumglass.in',
    gstNumber:     '33AABCP9876D4Z2',
    city:          'Chennai',
    state:         'Tamil Nadu',
    productsSupplied: ['Windshields', 'Side Glass'],
    status:        VENDOR_STATUS.ON_HOLD,
    createdAt:     '2024-04-20T11:00:00Z',
  },
];

let nextNum = 5;

export const vendorMock = {
  list: (): Vendor[] => [...store],

  create: (dto: CreateVendorDto): Vendor => {
    const vendor: Vendor = {
      ...dto,
      id: `v-00${nextNum++}`,
      status: VENDOR_STATUS.ACTIVE,
      createdAt: new Date().toISOString(),
    };
    store = [...store, vendor];
    return vendor;
  },

  update: (id: string, dto: UpdateVendorDto): Vendor => {
    const idx = store.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error(`Vendor ${id} not found`);
    const updated: Vendor = { ...store[idx], ...dto, updatedAt: new Date().toISOString() };
    store = store.map((v) => (v.id === id ? updated : v));
    return updated;
  },

  remove: (id: string): string => {
    store = store.filter((v) => v.id !== id);
    return id;
  },
};
