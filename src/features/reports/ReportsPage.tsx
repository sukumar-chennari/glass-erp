import { useTranslation } from 'react-i18next';
import { BarChart3, AlertTriangle } from 'lucide-react';
import { PageShell, SectionCard, SectionHeader } from '@/components/layout/PageShell';
import { useGetJobsQuery } from '@/features/jobs/services/jobsApi';
import { useGetInvoicesQuery } from '@/features/invoices/services/invoicesApi';
import { useGetClaimsQuery } from '@/features/claims/services/claimsApi';
import { useGetVendorsQuery } from '@/features/vendors/services/vendorsApi';
import { useGetStockQuery } from '@/features/stock/services/stockApi';
import { formatINR } from '@/services/mockUtils';
import { JOB_STATUS, INVOICE_STATUS, CLAIM_STATUS, VENDOR_STATUS, STOCK_STATUS, PAYMENT_STATUS } from '@/constants/statuses';
import { glassPositionKey } from '@/i18n/statusKeys';
import styles from './ReportsPage.module.css';

// Mock branch job distribution (TODO backend: GET /reports/branch-summary)
const BRANCH_STATS = [
  { name: 'Banjara Hills', jobs: 3, completed: 2, pct: 43 },
  { name: 'Secunderabad',  jobs: 2, completed: 1, pct: 29 },
  { name: 'Madhapur',      jobs: 1, completed: 0, pct: 14 },
  { name: 'Kompally',      jobs: 1, completed: 1, pct: 14 },
];

export function ReportsPage() {
  const { t } = useTranslation(['reports', 'common']);
  const { data: jobs = [] }     = useGetJobsQuery();
  const { data: invoices = [] } = useGetInvoicesQuery();
  const { data: claims = [] }   = useGetClaimsQuery();
  const { data: vendors = [] }  = useGetVendorsQuery();
  const { data: stock = [] }    = useGetStockQuery();

  // ── Key metrics ────────────────────────────────────────────────────
  const completedJobs    = jobs.filter((j) => j.status === JOB_STATUS.COMPLETED).length;
  const activeJobs       = jobs.filter((j) =>
    j.status === JOB_STATUS.WORKING     ||
    j.status === JOB_STATUS.IN_PROGRESS ||
    j.status === JOB_STATUS.ACCEPTED    ||
    j.status === JOB_STATUS.TRAVELLING  ||
    j.status === JOB_STATUS.ARRIVED
  ).length;
  const paidInvoiceList  = invoices.filter((i) => i.status === INVOICE_STATUS.PAID);
  const totalRevenue     = paidInvoiceList.reduce((s, i) => s + i.totalAmount, 0);
  const pendingInvoices  = invoices.filter(
    (i) => i.status === INVOICE_STATUS.SENT || i.status === INVOICE_STATUS.OVERDUE,
  );
  const pendingRevenue   = pendingInvoices.reduce((s, i) => s + i.totalAmount, 0);
  const approvedClaims   = claims.filter((c) => c.status === CLAIM_STATUS.APPROVED || c.status === CLAIM_STATUS.PARTIAL).length;
  const totalApproved    = claims
    .filter((c) => c.status === CLAIM_STATUS.APPROVED || c.status === CLAIM_STATUS.PARTIAL)
    .reduce((s, c) => s + c.approvedAmount, 0);
  const activeVendorCount = vendors.filter((v) => v.status === VENDOR_STATUS.ACTIVE).length;

  // ── Top customers by jobs ─────────────────────────────────────────
  const customerJobMap: Record<string, { name: string; count: number }> = {};
  jobs.forEach((j) => {
    if (!customerJobMap[j.customerId]) {
      customerJobMap[j.customerId] = { name: j.customerName, count: 0 };
    }
    customerJobMap[j.customerId].count++;
  });
  const topCustomers = Object.values(customerJobMap).sort((a, b) => b.count - a.count).slice(0, 5);
  const maxJobs = topCustomers[0]?.count ?? 1;

  // ── Jobs by glass position ────────────────────────────────────────
  const positionMap: Record<string, number> = {};
  jobs.forEach((j) => { positionMap[j.glassPosition] = (positionMap[j.glassPosition] ?? 0) + 1; });
  const topPositions = Object.entries(positionMap).sort(([, a], [, b]) => b - a).slice(0, 5);
  const maxPos = topPositions[0]?.[1] ?? 1;

  // ── TAT performance ───────────────────────────────────────────────
  const completedWithDates = jobs.filter(
    (j) => j.status === JOB_STATUS.COMPLETED && j.completedDate && j.createdAt,
  );
  const tatDays = completedWithDates.map((j) => {
    const ms = new Date(j.completedDate!).getTime() - new Date(j.createdAt).getTime();
    return ms / (1000 * 60 * 60 * 24);
  });
  const avgTat = tatDays.length > 0
    ? (tatDays.reduce((s, d) => s + d, 0) / tatDays.length).toFixed(1)
    : '—';
  const overdueCount = jobs.filter(
    (j) => j.scheduledDate < new Date().toISOString().slice(0, 10) &&
      j.status !== JOB_STATUS.COMPLETED && j.status !== JOB_STATUS.CANCELLED,
  ).length;

  // ── Stock health ──────────────────────────────────────────────────
  const outOfStock = stock.filter((s) => s.stockStatus === STOCK_STATUS.OUT_OF_STOCK);
  const lowStock   = stock.filter((s) => s.stockStatus === STOCK_STATUS.LOW_STOCK);

  // ── Payment breakdown ─────────────────────────────────────────────
  const paymentBreakdown = [
    { label: 'Cash Collected',     count: jobs.filter((j) => j.paymentStatus === PAYMENT_STATUS.CASH_COLLECTED).length },
    { label: 'Insurance Settled',  count: jobs.filter((j) => j.paymentStatus === PAYMENT_STATUS.INSURANCE_SETTLED || j.paymentStatus === PAYMENT_STATUS.FINANCIALLY_CLOSED).length },
    { label: 'Excess Pending',     count: jobs.filter((j) => j.paymentStatus === PAYMENT_STATUS.EXCESS_PENDING).length },
    { label: 'Insurance Pending',  count: jobs.filter((j) => j.paymentStatus === PAYMENT_STATUS.INSURANCE_PENDING).length },
    { label: 'Payment Pending',    count: jobs.filter((j) => j.paymentStatus === PAYMENT_STATUS.PENDING || !j.paymentStatus).length },
  ];
  const maxPayment = Math.max(...paymentBreakdown.map((p) => p.count), 1);

  return (
    <PageShell
      heading={t('title')}
      description={t('description')}
    >
      {/* Key Metrics */}
      <SectionCard>
        <SectionHeader title={t('sections.keyMetrics')} />
        <div className={styles.statGrid}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>{t('metrics.totalRevenue')}</span>
            <span className={styles.statValue}>{formatINR(totalRevenue)}</span>
            <span className={styles.statSub}>{t('metrics.paidInvoices', { count: paidInvoiceList.length })}</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>{t('metrics.pendingCollections')}</span>
            <span className={styles.statValue}>{formatINR(pendingRevenue)}</span>
            <span className={styles.statSub}>{t('metrics.unpaidInvoices', { count: pendingInvoices.length })}</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>{t('metrics.jobsCompleted')}</span>
            <span className={styles.statValue}>{completedJobs}</span>
            <span className={styles.statSub}>{t('metrics.activeJobs', { count: activeJobs })}</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>{t('metrics.claimsApproved')}</span>
            <span className={styles.statValue}>{approvedClaims}</span>
            <span className={styles.statSub}>{t('metrics.totalApprovedAmount', { amount: formatINR(totalApproved) })}</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>{t('metrics.totalVendors')}</span>
            <span className={styles.statValue}>{vendors.length}</span>
            <span className={styles.statSub}>{t('metrics.activeVendors', { count: activeVendorCount })}</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>{t('metrics.totalJobs')}</span>
            <span className={styles.statValue}>{jobs.length}</span>
            <span className={styles.statSub}>{t('metrics.allTime')}</span>
          </div>
        </div>
      </SectionCard>

      <div className={styles.grid}>
        {/* Top Customers */}
        <SectionCard>
          <SectionHeader title={t('sections.topCustomers')} />
          <div className={styles.rankList}>
            {topCustomers.length === 0 ? (
              <span className={styles.emptyNote}>{t('empty.noData')}</span>
            ) : (
              topCustomers.map((c, i) => (
                <div key={c.name} className={styles.rankItem}>
                  <span className={styles.rankNum}>{i + 1}</span>
                  <span className={styles.rankName}>{c.name}</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${(c.count / maxJobs) * 100}%` }} />
                  </div>
                  <span className={styles.rankValue}>{c.count}</span>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Jobs by Glass Position */}
        <SectionCard>
          <SectionHeader title={t('sections.glassByPosition')} />
          <div className={styles.rankList}>
            {topPositions.length === 0 ? (
              <span className={styles.emptyNote}>{t('empty.noData')}</span>
            ) : (
              topPositions.map(([position, count], i) => (
                <div key={position} className={styles.rankItem}>
                  <span className={styles.rankNum}>{i + 1}</span>
                  <span className={styles.rankName}>{t(`glassPositions.${glassPositionKey(position)}`, { defaultValue: position })}</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${(count / maxPos) * 100}%` }} />
                  </div>
                  <span className={styles.rankValue}>{count}</span>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      {/* TAT Performance + Payment breakdown */}
      <div className={styles.grid}>
        <SectionCard>
          <SectionHeader title="TAT Performance" />
          <div className={styles.tatGrid}>
            <div className={styles.tatBox}>
              <span className={styles.tatBig}>{avgTat}</span>
              <span className={styles.tatLabel}>Avg. days job-to-complete</span>
            </div>
            <div className={styles.tatBox}>
              <span className={`${styles.tatBig} ${overdueCount > 0 ? styles.tatDanger : ''}`}>{overdueCount}</span>
              <span className={styles.tatLabel}>Jobs past scheduled date</span>
            </div>
            <div className={styles.tatBox}>
              <span className={styles.tatBig}>{completedJobs}</span>
              <span className={styles.tatLabel}>Total completed</span>
            </div>
          </div>
          <div className={styles.tatNote}>
            Avg. TAT excludes jobs still in progress.
            {overdueCount > 0 && (
              <span className={styles.overdueWarn}>
                <AlertTriangle size={12} />
                {overdueCount} job{overdueCount !== 1 ? 's' : ''} overdue — review from the Branch Manager dashboard.
              </span>
            )}
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader title="Payment Status Breakdown" />
          <div className={styles.rankList}>
            {paymentBreakdown.map((p) => (
              <div key={p.label} className={styles.rankItem}>
                <span className={styles.rankName}>{p.label}</span>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ width: `${(p.count / maxPayment) * 100}%` }} />
                </div>
                <span className={styles.rankValue}>{p.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Branch Performance */}
      <SectionCard>
        <SectionHeader title="Branch Job Performance" />
        <div className={styles.branchTable}>
          <div className={styles.branchHeader}>
            <span>Branch</span>
            <span>Total Jobs</span>
            <span>Completed</span>
            <span>Share</span>
          </div>
          {BRANCH_STATS.map((b) => (
            <div key={b.name} className={styles.branchRow}>
              <span className={styles.branchName}>{b.name}</span>
              <span>{b.jobs}</span>
              <span>{b.completed}</span>
              <div className={styles.branchBarWrap}>
                <div className={styles.branchBar} style={{ width: `${b.pct}%` }} />
                <span className={styles.branchPct}>{b.pct}%</span>
              </div>
            </div>
          ))}
        </div>
        <p className={styles.branchNote}>Branch attribution requires branchId on jobs. TODO (backend): GET /reports/branch-summary.</p>
      </SectionCard>

      {/* Stock Health */}
      <SectionCard>
        <SectionHeader title="Stock Health" />
        <div className={styles.stockSummary}>
          <div className={`${styles.stockBadge} ${styles.stockOos}`}>
            <span className={styles.stockNum}>{outOfStock.length}</span>
            <span>Out of Stock</span>
          </div>
          <div className={`${styles.stockBadge} ${styles.stockLow}`}>
            <span className={styles.stockNum}>{lowStock.length}</span>
            <span>Low Stock</span>
          </div>
          <div className={styles.stockBadge}>
            <span className={styles.stockNum}>{stock.length - outOfStock.length - lowStock.length}</span>
            <span>Healthy</span>
          </div>
        </div>

        {(outOfStock.length > 0 || lowStock.length > 0) && (
          <div className={styles.stockAlerts}>
            {outOfStock.map((s) => (
              <div key={s.id} className={`${styles.alertRow} ${styles.alertOos}`}>
                <AlertTriangle size={13} />
                <span><strong>{s.productName}</strong> — Out of Stock</span>
              </div>
            ))}
            {lowStock.map((s) => (
              <div key={s.id} className={`${styles.alertRow} ${styles.alertLow}`}>
                <AlertTriangle size={13} />
                <span><strong>{s.productName}</strong> — Only {s.currentQty} remaining</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Lost Leads */}
      <SectionCard>
        <SectionHeader title="Lost Leads" />
        <LostLeadsSection />
      </SectionCard>

      {/* Revenue chart placeholder */}
      <SectionCard>
        <SectionHeader title={t('sections.monthlyRevenue')} />
        <div className={styles.chartPlaceholder}>
          <BarChart3 size={48} className={styles.chartIcon} />
          <div>
            <strong>{t('chart.title')}</strong>
            <p>{t('chart.desc')}</p>
          </div>
        </div>
      </SectionCard>
    </PageShell>
  );
}

// ── Lost Leads breakdown ──────────────────────────────────────────────────────
// TODO (backend): GET /reports/lost-leads — currently mock data
const LOST_REASONS: Array<{ reason: string; count: number; pct: number }> = [
  { reason: 'Declined pricing — too expensive',    count: 38, pct: 34 },
  { reason: 'Found another vendor',                count: 27, pct: 24 },
  { reason: 'Customer unresponsive / wrong number',count: 22, pct: 20 },
  { reason: 'Insurance claim rejected upfront',    count: 14, pct: 13 },
  { reason: 'Competitor quoted faster TAT',         count:  7, pct:  6 },
  { reason: 'Other / unknown',                     count:  4, pct:  3 },
];
const TOTAL_LOST = LOST_REASONS.reduce((a, r) => a + r.count, 0);

function LostLeadsSection() {
  return (
    <div className={styles.lostLeads}>
      <div className={styles.lostSummary}>
        <span className={styles.lostTotal}>{TOTAL_LOST}</span>
        <span className={styles.lostLabel}>enquiries closed as lost this month</span>
      </div>
      <div className={styles.lostRows}>
        {LOST_REASONS.map((r) => (
          <div key={r.reason} className={styles.lostRow}>
            <span className={styles.lostReason}>{r.reason}</span>
            <div className={styles.lostBar}>
              <div className={styles.lostBarFill} style={{ width: `${r.pct}%` }} />
            </div>
            <span className={styles.lostCount}>{r.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
