import type { StockStatus } from '@/constants/statuses';
import type { GlassPosition } from '@/types/enums';
export type { GlassPosition } from '@/types/enums';

export interface Product {
  id:             string;
  name:           string;
  sku?:           string;
  vehicleMake:    string;
  vehicleModel:   string;
  vehicleYear?:   string;  // e.g. "2018-2022"
  glassPosition:  GlassPosition;
  price:          number;
  costPrice?:     number;
  gstRate:        number;   // percentage, e.g. 18
  stockQty:       number;
  lowStockThreshold: number;
  stockStatus:    StockStatus;
  vendorId?:      string;
  imageUrl?:      string;
  createdAt:      string;
}

export interface CreateProductDto {
  name:           string;
  sku?:           string;
  vehicleMake:    string;
  vehicleModel:   string;
  vehicleYear?:   string;
  glassPosition:  GlassPosition;
  price:          number;
  costPrice?:     number;
  gstRate:        number;
  stockQty:       number;
  lowStockThreshold: number;
  vendorId?:      string;
  imageUrl?:      string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  status?: StockStatus;
}
