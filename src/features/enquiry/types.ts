export interface CustomerSubmission {
  id:                 string;
  phone:              string;
  name:               string;
  vehicleNo:          string;
  vehicleMake:        string;
  vehicleModel:       string;
  vehicleYear:        number;
  glassType:          string;
  glassPosition?:     string;
  description:        string;
  submittedAt:        string;
  photoCount:         number;
  rcUploaded:         boolean;
  whatsappVerified:   boolean;
  preferredBranch:    string;
  paymentPreference:  'cash' | 'insurance' | 'card' | 'undecided';
  insuranceInsurer?:  string;
  insurancePolicyNo?: string;
}
