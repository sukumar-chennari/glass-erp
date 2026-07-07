import type { BranchPerformanceRow, AdminSummary } from '@/types/models/adminSummary';

const BRANCH_PERFORMANCE: BranchPerformanceRow[] = [
  { id: 'br-001', name: 'Banjara Hills', jobs: 12, completed: 8,  revenue: 48000, overdue: 1 },
  { id: 'br-002', name: 'Secunderabad',  jobs:  9, completed: 7,  revenue: 36000, overdue: 0 },
  { id: 'br-003', name: 'Madhapur',      jobs:  7, completed: 4,  revenue: 28000, overdue: 2 },
  { id: 'br-004', name: 'Kompally',      jobs:  5, completed: 5,  revenue: 22000, overdue: 0 },
  { id: 'br-005', name: 'Mehdipatnam',   jobs:  4, completed: 2,  revenue: 16000, overdue: 1 },
];

const ADMIN_SUMMARY: AdminSummary = {
  totalActiveJobs: 37,
  totalJobsToday:  26,
  totalRevenue:    150000,
  pendingPayments: 8,
};

export const adminSummaryMock = {
  getBranchPerformance: (): BranchPerformanceRow[] => BRANCH_PERFORMANCE,
  getAdminSummary:      (): AdminSummary            => ADMIN_SUMMARY,
};
