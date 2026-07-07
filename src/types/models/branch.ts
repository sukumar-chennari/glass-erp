export type BranchStatus = 'Active' | 'Inactive';

export interface Branch {
  id:           string;
  name:         string;
  address:      string;
  phone:        string;
  mapsUrl:      string;
  openTime:     string;
  closeTime:    string;
  serviceAreas: string;
  pincodes:     string;
  managerId:    string;
  manager:      string;
  staff:        number;
  status:       BranchStatus;
}

export interface BranchCreatePayload {
  name:         string;
  address:      string;
  phone:        string;
  mapsUrl:      string;
  openTime:     string;
  closeTime:    string;
  serviceAreas: string;
  pincodes:     string;
  managerId:    string;
}

export interface BranchUpdatePayload extends Partial<BranchCreatePayload> {
  id:      string;
  status?: BranchStatus;
}
