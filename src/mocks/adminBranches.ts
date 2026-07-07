import { mockId } from '@/services/mockUtils';
import type { Branch, BranchCreatePayload, BranchUpdatePayload } from '@/types/models/branch';

const MANAGER_MAP: Record<string, string> = {
  'u-002': 'Ramesh Kumar',
  'u-008': 'Anand Kumar',
  'u-009': 'Sundeep Reddy',
  'u-010': 'Vijaya Lakshmi',
  'u-011': 'Karthik Reddy',
};

let store: Branch[] = [
  {
    id: 'br-001', name: 'WindX Banjara Hills',
    address:      'Plot 45, Road No. 12, Banjara Hills, Hyderabad – 500034',
    phone:        '040-23456789',
    mapsUrl:      'https://maps.google.com/?q=17.4239,78.4428',
    openTime: '09:00', closeTime: '20:00',
    serviceAreas: 'Banjara Hills, Jubilee Hills, Film Nagar, Panjagutta',
    pincodes:     '500034, 500033, 500008',
    managerId: 'u-002', manager: 'Ramesh Kumar',
    staff: 6, status: 'Active',
  },
  {
    id: 'br-002', name: 'WindX Secunderabad',
    address:      '14 MG Road, Secunderabad, Hyderabad – 500003',
    phone:        '040-27654321',
    mapsUrl:      'https://maps.google.com/?q=17.4416,78.4983',
    openTime: '09:00', closeTime: '20:00',
    serviceAreas: 'Secunderabad, Maredpally, Trimulgherry, Bowenpally',
    pincodes:     '500003, 500026, 500015',
    managerId: 'u-008', manager: 'Anand Kumar',
    staff: 5, status: 'Active',
  },
  {
    id: 'br-003', name: 'WindX Madhapur',
    address:      'H.No 8-2-293/82, HITEC City Road, Madhapur, Hyderabad – 500081',
    phone:        '040-29876543',
    mapsUrl:      'https://maps.google.com/?q=17.4488,78.3892',
    openTime: '09:00', closeTime: '20:00',
    serviceAreas: 'Madhapur, Gachibowli, Kondapur, Nanakramguda',
    pincodes:     '500081, 500032, 500084',
    managerId: 'u-009', manager: 'Sundeep Reddy',
    staff: 4, status: 'Active',
  },
  {
    id: 'br-004', name: 'WindX Kompally',
    address:      'Plot 12, Kompally Main Road, Kompally, Hyderabad – 500014',
    phone:        '040-23112345',
    mapsUrl:      'https://maps.google.com/?q=17.5500,78.4787',
    openTime: '09:00', closeTime: '19:00',
    serviceAreas: 'Kompally, Jeedimetla, Quthbullapur, Medchal',
    pincodes:     '500014, 500055, 501401',
    managerId: 'u-010', manager: 'Vijaya Lakshmi',
    staff: 3, status: 'Active',
  },
  {
    id: 'br-005', name: 'WindX Mehdipatnam',
    address:      '5-9-21, Masab Tank Road, Mehdipatnam, Hyderabad – 500028',
    phone:        '040-23998877',
    mapsUrl:      'https://maps.google.com/?q=17.3939,78.4393',
    openTime: '09:30', closeTime: '19:30',
    serviceAreas: 'Mehdipatnam, Tolichowki, Attapur, Rethibowli',
    pincodes:     '500028, 500008, 500048',
    managerId: 'u-011', manager: 'Karthik Reddy',
    staff: 3, status: 'Active',
  },
];

export const branchMock = {
  list: (): Branch[] => [...store],

  create: (payload: BranchCreatePayload): Branch => {
    const manager = MANAGER_MAP[payload.managerId] ?? '—';
    const branch: Branch = { ...payload, id: mockId('br-'), manager, staff: 0, status: 'Active' };
    store = [...store, branch];
    return branch;
  },

  update: (id: string, dto: Partial<BranchUpdatePayload>): Branch => {
    store = store.map((b) => {
      if (b.id !== id) return b;
      const manager = dto.managerId ? (MANAGER_MAP[dto.managerId] ?? b.manager) : b.manager;
      return { ...b, ...dto, manager };
    });
    const updated = store.find((b) => b.id === id);
    if (!updated) throw new Error(`Branch ${id} not found`);
    return updated;
  },
};
