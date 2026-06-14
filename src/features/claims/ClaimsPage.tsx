import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { ClaimCard } from './components/ClaimCard';
import { ClaimUpdateModal } from './components/ClaimUpdateModal';
import {
  useGetClaimsQuery,
  useUpdateClaimMutation,
  useDeleteClaimMutation,
} from './services/claimsApi';
import type { Claim } from '@/types/models/claim';
import styles from './ClaimsPage.module.css';

const FILTER_TABS = [
  { key: 'all',          label: 'All' },
  { key: 'Submitted',    label: 'Submitted' },
  { key: 'Under Review', label: 'Under Review' },
  { key: 'Surveyed',     label: 'Surveyed' },
  { key: 'Approved',     label: 'Approved' },
  { key: 'Partial',      label: 'Partial' },
  { key: 'Rejected',     label: 'Rejected' },
];

export function ClaimsPage() {
  const { data: claims = [], isLoading } = useGetClaimsQuery();
  const [updateClaim, { isLoading: updating }] = useUpdateClaimMutation();
  const [deleteClaim, { isLoading: deleting }] = useDeleteClaimMutation();
  const toast = useToast();

  const [modalOpen, setModalOpen]       = useState(false);
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const openEdit   = (c: Claim) => { setEditingClaim(c); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingClaim(null); };

  const handleUpdate = async (dto: {
    status?: Claim['status'];
    approvedAmount?: number;
    remarks?: string;
    surveyorName?: string;
  }) => {
    if (!editingClaim) return;
    try {
      await updateClaim({ id: editingClaim.id, ...dto }).unwrap();
      toast.success('Claim updated');
      closeModal();
    } catch {
      toast.error('Failed to update claim');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteClaim(deleteTarget).unwrap();
      toast.success('Claim deleted');
    } catch {
      toast.error('Failed to delete claim');
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = activeFilter === 'all'
    ? claims
    : claims.filter(c => c.status === activeFilter);

  return (
    <PageShell
      heading="Insurance Claims"
      description="Submit and track insurance claim approvals."
    >
      {/* Filter tabs */}
      <div className={styles.filters}>
        {FILTER_TABS.map(tab => {
          const count = tab.key === 'all'
            ? claims.length
            : claims.filter(c => c.status === tab.key).length;
          return (
            <button
              key={tab.key}
              className={`${styles.filterTab} ${activeFilter === tab.key ? styles.filterTabActive : ''}`}
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.label}
              {count > 0 && (
                <span className={styles.filterCount}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className={styles.loadingGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No claims found</p>
          <p className={styles.emptyHint}>Try a different filter or add a new claim.</p>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {filtered.map(claim => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              onEdit={openEdit}
              onDelete={(id) => setDeleteTarget(id)}
            />
          ))}
        </div>
      )}

      <ClaimUpdateModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleUpdate}
        claim={editingClaim}
        isSubmitting={updating}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        message="Delete this claim? This cannot be undone."
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageShell>
  );
}
