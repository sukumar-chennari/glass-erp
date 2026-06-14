export interface DashboardKpi {
  id:        string;
  label:     string;
  value:     string;
  rawValue:  number;
  change:    string;
  trend:     'up' | 'down' | 'neutral';
  icon:      string;  // lucide-react icon name
  variant:   'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export interface DashboardRecentCustomer {
  id:             string;
  name:           string;
  phone:          string;
  vehicleName:    string;
  registrationNo: string;
  totalJobs:      number;
}

export interface DashboardPendingClaim {
  id:            string;
  claimNumber:   string;
  customerName:  string;
  amount:        number;
  daysPending:   number;
  status:        string;
}

export interface DashboardRecentJob {
  id:            string;
  jobNumber:     string;
  customerName:  string;
  vehicleName:   string;
  glassPosition: string;
  status:        string;
  scheduledDate: string;
}

export interface DashboardData {
  kpis:           DashboardKpi[];
  recentCustomers: DashboardRecentCustomer[];
  pendingClaims:  DashboardPendingClaim[];
  recentJobs:     DashboardRecentJob[];
}
