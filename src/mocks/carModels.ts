import type { CarModel, CarModelPayload } from '@/types/models/carModel';

let store: CarModel[] = [
  { id: 'cm-001', brand_id: 'cb-001', name: 'Swift',      compare_name: 'swift',      image: null, status: 'ACTIVE' },
  { id: 'cm-002', brand_id: 'cb-001', name: 'Baleno',     compare_name: 'baleno',     image: null, status: 'ACTIVE' },
  { id: 'cm-003', brand_id: 'cb-001', name: 'Dzire',      compare_name: 'dzire',      image: null, status: 'ACTIVE' },
  { id: 'cm-004', brand_id: 'cb-002', name: 'i20',        compare_name: 'i20',        image: null, status: 'ACTIVE' },
  { id: 'cm-005', brand_id: 'cb-002', name: 'Creta',      compare_name: 'creta',      image: null, status: 'ACTIVE' },
  { id: 'cm-006', brand_id: 'cb-002', name: 'Venue',      compare_name: 'venue',      image: null, status: 'ACTIVE' },
  { id: 'cm-007', brand_id: 'cb-003', name: 'Nexon',      compare_name: 'nexon',      image: null, status: 'ACTIVE' },
  { id: 'cm-008', brand_id: 'cb-003', name: 'Punch',      compare_name: 'punch',      image: null, status: 'ACTIVE' },
  { id: 'cm-009', brand_id: 'cb-004', name: 'Thar',       compare_name: 'thar',       image: null, status: 'ACTIVE' },
  { id: 'cm-010', brand_id: 'cb-005', name: 'City',       compare_name: 'city',       image: null, status: 'ACTIVE' },
  { id: 'cm-011', brand_id: 'cb-005', name: 'Amaze',      compare_name: 'amaze',      image: null, status: 'INACTIVE' },
  { id: 'cm-012', brand_id: 'cb-006', name: 'Innova',     compare_name: 'innova',     image: null, status: 'ACTIVE' },
  { id: 'cm-013', brand_id: 'cb-007', name: 'Seltos',     compare_name: 'seltos',     image: null, status: 'ACTIVE' },
  { id: 'cm-014', brand_id: 'cb-008', name: 'Hector',     compare_name: 'hector',     image: null, status: 'ACTIVE' },
];

let counter = store.length;

function nextId(): string {
  counter += 1;
  return `cm-${String(counter).padStart(3, '0')}`;
}

export const carModelMock = {
  list: (): CarModel[]              => [...store],
  create: (p: CarModelPayload): CarModel => {
    const record: CarModel = { id: nextId(), ...p };
    store = [record, ...store];
    return record;
  },
  update: (p: { id: string } & Partial<CarModelPayload>): CarModel => {
    store = store.map((m) => (m.id === p.id ? { ...m, ...p } : m));
    return store.find((m) => m.id === p.id)!;
  },
  remove: (id: string): void => {
    store = store.filter((m) => m.id !== id);
  },
};
