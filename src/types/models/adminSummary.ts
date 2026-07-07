export interface BranchPerformanceRow {
  id:        string;
  name:      string;
  jobs:      number;
  completed: number;
  revenue:   number;
  overdue:   number;
}

export interface AdminSummary {
  totalActiveJobs: number;
  totalJobsToday:  number;
  totalRevenue:    number;
  pendingPayments: number;
}
