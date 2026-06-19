import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { PageShell, SectionCard, SectionHeader } from '@/components/layout/PageShell';
import { useGetJobsQuery } from '@/features/jobs/services/jobsApi';
import { useGetInvoicesQuery } from '@/features/invoices/services/invoicesApi';
import { useGetClaimsQuery } from '@/features/claims/services/claimsApi';
import { useGetVendorsQuery } from '@/features/vendors/services/vendorsApi';
import { formatINR } from '@/services/mockUtils';
import { JOB_STATUS, INVOICE_STATUS, CLAIM_STATUS, VENDOR_STATUS } from '@/constants/statuses';
import { glassPositionKey } from '@/i18n/statusKeys';
import styles from './ReportsPage.module.css';

export function ReportsPage() {
  const { t } = useTranslation(['reports', 'common']);
  const { data: jobs = [] }     = useGetJobsQuery();
  const { data: invoices = [] } = useGetInvoicesQuery();
  const { data: claims = [] }   = useGetClaimsQuery();
  const { data: vendors = [] }  = useGetVendorsQuery();

  // ── Computed metrics ──────────────────────────────────────────────
  const completedJobs  = jobs.filter((j) => j.status === JOB_STATUS.COMPLETED).length;
  const activeJobs     = jobs.filter((j) => j.status === JOB_STATUS.IN_PROGRESS).length;
  const paidInvoiceList = invoices.filter((i) => i.status === INVOICE_STATUS.PAID);
  const totalRevenue   = paidInvoiceList.reduce((s, i) => s + i.totalAmount, 0);
  const pendingInvoices = invoices.filter(
    (i) => i.status === INVOICE_STATUS.SENT || i.status === INVOICE_STATUS.OVERDUE,
  );
  const pendingRevenue  = pendingInvoices.reduce((s, i) => s + i.totalAmount, 0);
  const approvedClaims  = claims.filter((c) => c.status === CLAIM_STATUS.APPROVED || c.status === CLAIM_STATUS.PARTIAL).length;
  const totalApproved   = claims
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
  const topCustomers = Object.values(customerJobMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxJobs = topCustomers[0]?.count ?? 1;

  // ── Jobs by glass position ────────────────────────────────────────
  const positionMap: Record<string, number> = {};
  jobs.forEach((j) => {
    positionMap[j.glassPosition] = (positionMap[j.glassPosition] ?? 0) + 1;
  });
  const topPositions = Object.entries(positionMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const maxPos = topPositions[0]?.[1] ?? 1;

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
                    <div
                      className={styles.barFill}
                      style={{ width: `${(c.count / maxJobs) * 100}%` }}
                    />
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
                    <div
                      className={styles.barFill}
                      style={{ width: `${(count / maxPos) * 100}%` }}
                    />
                  </div>
                  <span className={styles.rankValue}>{count}</span>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

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
