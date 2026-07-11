export type CarBrandStatus = 'ACTIVE' | 'INACTIVE';

export interface CarBrand {
  id:           string;
  name:         string;
  compare_name: string;
  image:        string | null;
  status:       CarBrandStatus;
}

export interface CarBrandPayload {
  name:         string;
  compare_name: string;
  image:        string | null;
  status:       CarBrandStatus;
}

export interface CarBrandUpdatePayload extends CarBrandPayload {
  id: string;
}
