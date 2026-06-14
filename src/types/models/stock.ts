import type { StockStatus } from '@/constants/statuses';

export interface StockEntry {
  id:                string;
  productId:         string;
  productName:       string;
  sku?:              string;
  vehicleMake:       string;
  vehicleModel:      string;
  glassPosition:     string;
  currentQty:        number;
  lowStockThreshold: number;
  stockStatus:       StockStatus;
  lastUpdated:       string;
  vendorName?:       string;
  unitCost?:         number;
}

export interface AdjustStockDto {
  productId:   string;
  adjustment:  number;
  reason:      string;
}
