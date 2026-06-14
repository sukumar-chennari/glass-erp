import type { Customer, CreateCustomerDto } from '@/types/models/customer';

let store: Customer[] = [
  {
    id: 'c-001',
    name:  'Ravi Kumar',
    phone: '9876543210',
    email: 'ravi.kumar@gmail.com',
    city:  'New Delhi',
    vehicles: [
      { id: 'vh-001', make: 'Honda', model: 'City', year: 2020, registrationNo: 'DL 01 AB 1234', color: 'White' },
    ],
    totalJobs: 3,
    createdAt: '2024-05-10T09:00:00Z',
  },
  {
    id: 'c-002',
    name:  'Priya Sharma',
    phone: '9876543211',
    email: 'priya.sharma@gmail.com',
    city:  'Gurugram',
    vehicles: [
      { id: 'vh-002', make: 'Maruti', model: 'Swift', year: 2018, registrationNo: 'HR 26 CD 5678', color: 'Red' },
    ],
    totalJobs: 5,
    createdAt: '2024-03-22T10:00:00Z',
  },
  {
    id: 'c-003',
    name:  'Mohan Singh',
    phone: '9876543212',
    city:  'Noida',
    vehicles: [
      { id: 'vh-003', make: 'Hyundai', model: 'i20', year: 2021, registrationNo: 'UP 07 EF 9012', color: 'Silver' },
    ],
    totalJobs: 2,
    createdAt: '2024-06-01T08:30:00Z',
  },
  {
    id: 'c-004',
    name:  'Anjali Verma',
    phone: '9876543213',
    email: 'anjali.v@gmail.com',
    city:  'Mumbai',
    vehicles: [
      { id: 'vh-004', make: 'Toyota', model: 'Innova Crysta', year: 2022, registrationNo: 'MH 02 GH 3456', color: 'Grey' },
    ],
    totalJobs: 1,
    createdAt: '2025-01-15T12:00:00Z',
  },
  {
    id: 'c-005',
    name:  'Suresh Reddy',
    phone: '9876543214',
    city:  'Hyderabad',
    vehicles: [
      { id: 'vh-005', make: 'Kia', model: 'Seltos', year: 2023, registrationNo: 'TS 09 IJ 7890', color: 'Black' },
    ],
    totalJobs: 4,
    createdAt: '2024-08-20T10:00:00Z',
  },
];

let nextCust = 6;
let nextVeh  = 6;

export const customerMock = {
  list: (): Customer[] => [...store],

  create: (dto: CreateCustomerDto): Customer => {
    const customer: Customer = {
      id: `c-00${nextCust++}`,
      name:     dto.name,
      phone:    dto.phone,
      email:    dto.email,
      address:  dto.address,
      city:     dto.city,
      vehicles: (dto.vehicles ?? []).map((v) => ({ ...v, id: `vh-0${nextVeh++}` })),
      totalJobs: 0,
      createdAt: new Date().toISOString(),
    };
    store = [...store, customer];
    return customer;
  },

  update: (id: string, dto: Partial<CreateCustomerDto>): Customer => {
    const idx = store.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`Customer ${id} not found`);
    const existing = store[idx];
    const updated: Customer = {
      ...existing,
      ...dto,
      vehicles: dto.vehicles
        ? dto.vehicles.map((v, i) => ({
            ...v,
            id: existing.vehicles[i]?.id ?? `vh-0${nextVeh++}`,
          }))
        : existing.vehicles,
      updatedAt: new Date().toISOString(),
    };
    store = store.map((c) => (c.id === id ? updated : c));
    return updated;
  },

  remove: (id: string): string => {
    store = store.filter((c) => c.id !== id);
    return id;
  },
};
