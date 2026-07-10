export type BranchStatus = 'Active' | 'Inactive';

// Separate backend enum used in POST /branches payload
export type BranchCreateStatus = 'ACTIVE' | 'INACTIVE';

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

// Matches POST /api/v1/branches request body exactly.
export interface BranchCreatePayload {
  name:                   string;
  code:                   string;
  state:                  string;
  district:               string;
  address:                string;
  pincode:                string;
  latitude:               number;
  longitude:              number;
  contactNumber:          string;
  alternateContactNumber: string;
  email:                  string;
  openingTime:            string;
  closingTime:            string;
  status:                 BranchCreateStatus;
  adminName:              string;
  adminEmail:             string;
  adminPassword:          string;
  adminPhone:             string;
}

// 201 response from POST /branches — matches live API exactly.
// Branch list shape (GET /settings/branches) is intentionally separate.
export interface BranchCreatedRecord {
  id:                      string;
  code:                    string;
  name:                    string;
  state:                   string;
  district:                string;
  address:                 string;
  pincode:                 string;
  latitude:                number;
  longitude:               number;
  contactNumber:           string;
  alternateContactNumber:  string;
  email:                   string;
  openingTime:             string;
  closingTime:             string;
  status:                  BranchCreateStatus;
  createdById:             string;
  createdAt:               string;
  updatedAt:               string;
}

export interface BranchCreatedAdmin {
  id:        string;
  name:      string;
  email:     string;
  phone:     string;
  role:      string;
  branchId:  string;
  isActive:  boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BranchCreateResponse {
  branch: BranchCreatedRecord;
  admin:  BranchCreatedAdmin;
}

// Decoupled from BranchCreatePayload to prevent the updated create shape
// from cascading into the update flow. Effective fields unchanged.
export interface BranchUpdatePayload {
  id:            string;
  name?:         string;
  address?:      string;
  phone?:        string;
  mapsUrl?:      string;
  openTime?:     string;
  closeTime?:    string;
  serviceAreas?: string;
  pincodes?:     string;
  managerId?:    string;
  status?:       BranchStatus;
}
