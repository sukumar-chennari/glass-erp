export interface VehicleModel {
  id:          string;
  brand:       string;
  model:       string;
  marketPrice: number;   // INR
}

export type VehicleModelPayload       = Omit<VehicleModel, 'id'>;
export type VehicleModelUpdatePayload = { id: string } & Partial<VehicleModelPayload>;

/** Indian car brand → model list for dropdown cascade. */
export const BRAND_MODEL_MAP: Record<string, string[]> = {
  'Maruti Suzuki': ['Alto K10', 'WagonR', 'Swift', 'Dzire', 'Baleno', 'Brezza', 'Ertiga', 'XL6', 'Ciaz', 'Ignis', 'S-Cross'],
  'Hyundai':       ['Grand i10 NIOS', 'i20', 'Aura', 'Venue', 'Verna', 'Creta', 'Alcazar', 'Tucson'],
  'Tata':          ['Tiago', 'Tigor', 'Altroz', 'Punch', 'Nexon', 'Harrier', 'Safari', 'Hexa'],
  'Mahindra':      ['Bolero', 'Thar', 'Scorpio', 'Scorpio-N', 'XUV300', 'XUV400', 'XUV700', 'Marazzo'],
  'Honda':         ['Amaze', 'Jazz', 'City', 'City Hybrid', 'WR-V', 'Elevate', 'CR-V'],
  'Toyota':        ['Glanza', 'Urban Cruiser Hyryder', 'Innova Crysta', 'Innova HyCross', 'Fortuner', 'Camry'],
  'Kia':           ['Sonet', 'Seltos', 'Carens', 'Carnival'],
  'MG':            ['Astor', 'Hector', 'Hector Plus', 'ZS EV', 'Gloster'],
  'Ford':          ['Figo', 'Aspire', 'EcoSport', 'Endeavour'],
  'Renault':       ['Kwid', 'Triber', 'Kiger', 'Duster'],
  'Nissan':        ['Magnite', 'Kicks'],
  'Volkswagen':    ['Polo', 'Vento', 'Taigun', 'Virtus'],
  'Skoda':         ['Rapid', 'Kushaq', 'Slavia', 'Octavia', 'Superb'],
};

export const BRANDS = Object.keys(BRAND_MODEL_MAP);
