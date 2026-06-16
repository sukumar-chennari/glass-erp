import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

const STATUS_FILTER_KEYS = [
  { key: 'all',          i18nKey: 'status.all'         },
  { key: 'Submitted',    i18nKey: 'status.submitted'   },
  { key: 'Under Review', i18nKey: 'status.underReview' },
  { key: 'Surveyed',     i18nKey: 'status.surveyed'    },
  { key: 'Approved',     i18nKey: 'status.approved'    },
  { key: 'Partial',      i18nKey: 'status.partial'     },
  { key: 'Rejected',     i18nKey: 'status.rejected'    },
];

export function ClaimsPage() {
  const { t } = useTranslation(['claims', 'common']);
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
      toast.success(t('messages.updated'));
      closeModal();
    } catch {
      toast.error(t('messages.updateFailed'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteClaim(deleteTarget).unwrap();
      toast.success(t('messages.removed'));
    } catch {
      toast.error(t('messages.removeFailed'));
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = activeFilter === 'all'
    ? claims
    : claims.filter(c => c.status === activeFilter);

  return (
    <PageShell
      heading={t('title')}
      description={t('description')}
    >
      {/* Filter tabs */}
      <div className={styles.filters}>
        {STATUS_FILTER_KEYS.map(tab => {
          const count = tab.key === 'all'
            ? claims.length
            : claims.filter(c => c.status === tab.key).length;
          return (
            <button
              key={tab.key}
              className={`${styles.filterTab} ${activeFilter === tab.key ? styles.filterTabActive : ''}`}
              onClick={() => setActiveFilter(tab.key)}
            >
              {t(tab.i18nKey)}
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
          <p className={styles.emptyTitle}>{t('empty.title')}</p>
          <p className={styles.emptyHint}>{t('empty.hint')}</p>
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
        message={t('messages.confirmDelete')}
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageShell>
  );
}
