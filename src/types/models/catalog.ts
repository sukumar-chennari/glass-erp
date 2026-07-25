export type CatalogStatus = 'ACTIVE' | 'INACTIVE';

export interface CatalogVariant {
  id:          string;
  modelId:     string;
  variantName: string;
  period:      string;
  status:      CatalogStatus;
}

export interface CatalogGlassType {
  id:     string;
  name:   string;
  status: CatalogStatus;
}
