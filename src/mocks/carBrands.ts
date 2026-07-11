import type { CarBrand, CarBrandPayload } from '@/types/models/carBrand';

let store: CarBrand[] = [
  { id: 'cb-001', name: 'Maruti Suzuki', compare_name: 'maruti suzuki', image: null, status: 'ACTIVE' },
  { id: 'cb-002', name: 'Hyundai',       compare_name: 'hyundai',       image: null, status: 'ACTIVE' },
  { id: 'cb-003', name: 'Tata',          compare_name: 'tata',          image: null, status: 'ACTIVE' },
  { id: 'cb-004', name: 'Mahindra',      compare_name: 'mahindra',      image: null, status: 'ACTIVE' },
  { id: 'cb-005', name: 'Honda',         compare_name: 'honda',         image: null, status: 'ACTIVE' },
  { id: 'cb-006', name: 'Toyota',        compare_name: 'toyota',        image: null, status: 'ACTIVE' },
  { id: 'cb-007', name: 'Kia',           compare_name: 'kia',           image: null, status: 'ACTIVE' },
  { id: 'cb-008', name: 'MG',            compare_name: 'mg',            image: null, status: 'ACTIVE' },
  { id: 'cb-009', name: 'Skoda',         compare_name: 'skoda',         image: null, status: 'INACTIVE' },
  { id: 'cb-010', name: 'Volkswagen',    compare_name: 'volkswagen',    image: null, status: 'INACTIVE' },
];

let counter = store.length;

function nextId(): string {
  counter += 1;
  return `cb-${String(counter).padStart(3, '0')}`;
}

export const carBrandMock = {
  list: (): CarBrand[]              => [...store],
  create: (p: CarBrandPayload): CarBrand => {
    const record: CarBrand = { id: nextId(), ...p };
    store = [record, ...store];
    return record;
  },
  update: (p: { id: string } & Partial<CarBrandPayload>): CarBrand => {
    store = store.map((b) => (b.id === p.id ? { ...b, ...p } : b));
    return store.find((b) => b.id === p.id)!;
  },
  remove: (id: string): void => {
    store = store.filter((b) => b.id !== id);
  },
};
