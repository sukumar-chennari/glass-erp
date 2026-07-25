export type CarModelStatus = 'ACTIVE' | 'INACTIVE';

export interface CarModel {
  id:           string;
  brand_id:     string;
  name:         string;
  compare_name: string;
  image:        string | null;
  status:       CarModelStatus;
  cc:           number | null;
  ccCondition:  string | null;
  bodyType:     string[];
  brand?:       { id: string; name: string };
}

export interface CarModelPayload {
  brand_id:     string;
  name:         string;
  compare_name: string;
  image:        string | null;
  status:       CarModelStatus;
}

export interface CarModelUpdatePayload extends CarModelPayload {
  id: string;
}
