export type BranchStatus = 'Active' | 'Inactive';

// Backend enum used in POST /branches and GET /branches ?status filter
export type BranchCreateStatus = 'ACTIVE' | 'INACTIVE';
export type BranchListStatus   = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

// Shape returned by GET /api/v1/branches list items.
// Field names match the live backend (contactNumber, openingTime, closingTime).
// Intentionally separate from the legacy mock Branch type used by the edit flow.
export interface BranchListItem {
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
  status:                  BranchListStatus;
  createdById:             string;
  createdAt:               string;
  updatedAt:               string;
}

// Paginated envelope returned by GET /api/v1/branches.
// data is the item array; total/page/limit ready for pagination controls.
export interface BranchListResponse {
  data:  BranchListItem[];
  total: number;
  page:  number;
  limit: number;
}

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

// Matches PATCH /api/v1/branches/:id request body exactly.
// id goes in the URL; all remaining fields are required in the body.
// Response is the updated BranchListItem.
export interface BranchPatchPayload {
  id:                     string;
  name:                   string;
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
  status:                 BranchListStatus;
}
