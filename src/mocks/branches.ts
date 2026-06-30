export interface Branch {
  id:        string;
  name:      string;
  address:   string;
  area:      string;
  city:      string;
  phone:     string;
  lat:       number;
  lng:       number;
  openTime:  string;
  closeTime: string;
}

export const BRANCHES: Branch[] = [
  {
    id: 'b-001', name: 'WindX Banjara Hills',
    address: 'Plot 45, Road No. 12, Banjara Hills',
    area: 'Banjara Hills', city: 'Hyderabad',
    phone: '040-23456789',
    lat: 17.4239, lng: 78.4428,
    openTime: '09:00', closeTime: '20:00',
  },
  {
    id: 'b-002', name: 'WindX Secunderabad',
    address: '34A, M.G. Road, Paradise Circle',
    area: 'Secunderabad', city: 'Hyderabad',
    phone: '040-27891234',
    lat: 17.4416, lng: 78.4983,
    openTime: '09:00', closeTime: '19:30',
  },
  {
    id: 'b-003', name: 'WindX Madhapur',
    address: 'H.No. 8-2-318, Hi-Tech City Road',
    area: 'Madhapur', city: 'Hyderabad',
    phone: '040-29875643',
    lat: 17.4488, lng: 78.3892,
    openTime: '09:00', closeTime: '21:00',
  },
  {
    id: 'b-004', name: 'WindX Kompally',
    address: 'Survey No. 124, Kompally Main Road',
    area: 'Kompally', city: 'Hyderabad',
    phone: '040-23109876',
    lat: 17.5500, lng: 78.4787,
    openTime: '09:30', closeTime: '19:00',
  },
  {
    id: 'b-005', name: 'WindX Mehdipatnam',
    address: '15-1-507, Opp. Old Bridge',
    area: 'Mehdipatnam', city: 'Hyderabad',
    phone: '040-24678901',
    lat: 17.3939, lng: 78.4393,
    openTime: '09:00', closeTime: '20:00',
  },
];

export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}
