import { mockId } from '@/services/mockUtils';
import type { VehicleModel, VehicleModelPayload, VehicleModelUpdatePayload } from '@/types/models/vehicleModel';

let store: VehicleModel[] = [
  { id: 'vm-001', brand: 'Maruti Suzuki', model: 'Swift',          marketPrice:  650000 },
  { id: 'vm-002', brand: 'Maruti Suzuki', model: 'Baleno',         marketPrice:  750000 },
  { id: 'vm-003', brand: 'Hyundai',       model: 'Creta',          marketPrice: 1100000 },
  { id: 'vm-004', brand: 'Hyundai',       model: 'i20',            marketPrice:  750000 },
  { id: 'vm-005', brand: 'Tata',          model: 'Nexon',          marketPrice:  800000 },
  { id: 'vm-006', brand: 'Tata',          model: 'Harrier',        marketPrice: 1400000 },
  { id: 'vm-007', brand: 'Honda',         model: 'City',           marketPrice: 1150000 },
  { id: 'vm-008', brand: 'Toyota',        model: 'Fortuner',       marketPrice: 3200000 },
  { id: 'vm-009', brand: 'Toyota',        model: 'Innova Crysta',  marketPrice: 2000000 },
  { id: 'vm-010', brand: 'Mahindra',      model: 'Scorpio-N',      marketPrice: 1350000 },
];

export const vehicleModelMock = {
  list: (): VehicleModel[] => [...store],

  create: (p: VehicleModelPayload): VehicleModel => {
    const vm: VehicleModel = { ...p, id: mockId('vm-') };
    store = [...store, vm];
    return vm;
  },

  update: ({ id, ...dto }: VehicleModelUpdatePayload): VehicleModel => {
    store = store.map((v) => (v.id === id ? { ...v, ...dto } : v));
    const updated = store.find((v) => v.id === id);
    if (!updated) throw new Error(`VehicleModel ${id} not found`);
    return updated;
  },

  remove: (id: string): void => {
    store = store.filter((v) => v.id !== id);
  },
};
