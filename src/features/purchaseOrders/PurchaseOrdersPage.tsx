import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FilePlus } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { POTable } from './components/POTable';
import { POModal } from './components/POModal';
import {
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
} from './services/purchaseOrdersApi';
import { useGetVendorsQuery } from '@/features/vendors/services/vendorsApi';
import type { PurchaseOrder, CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from '@/types/models/purchaseOrder';
import type { SelectOption } from '@/types/ui';
import styles from './PurchaseOrdersPage.module.css';

export function PurchaseOrdersPage() {
  const { data: orders = [], isLoading } = useGetPurchaseOrdersQuery();
  const { data: vendors = [] } = useGetVendorsQuery();
  const [createPO, { isLoading: creating }] = useCreatePurchaseOrderMutation();
  const [updatePO, { isLoading: updating }] = useUpdatePurchaseOrderMutation();
  const [deletePO, { isLoading: deleting }] = useDeletePurchaseOrderMutation();
  const toast = useToast();
  const { t } = useTranslation(['purchaseOrders', 'common']);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const vendorOptions = useMemo<SelectOption[]>(
    () => vendors.map((v) => ({ value: v.id, label: v.companyName })),
    [vendors],
  );

  const openAdd  = () => { setEditingPO(null); setModalOpen(true); };
  const openEdit = (po: PurchaseOrder) => { setEditingPO(po); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingPO(null); };

  const handleSubmit = async (data: CreatePurchaseOrderDto | UpdatePurchaseOrderDto) => {
    try {
      if (editingPO) {
        await updatePO({ id: editingPO.id, ...data }).unwrap();
        toast.success(t('messages.updated'));
      } else {
        await createPO(data as CreatePurchaseOrderDto).unwrap();
        toast.success(t('messages.created'));
      }
      closeModal();
    } catch {
      toast.error(t('messages.saveFailed'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePO(deleteTarget).unwrap();
      toast.success(t('messages.deleted'));
    } catch {
      toast.error(t('messages.deleteFailed'));
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <PageShell
      heading={t('title')}
      description={t('description')}
      actions={
        <Button leftIcon={<FilePlus size={16} />} onClick={openAdd}>
          {t('actions.newOrder')}
        </Button>
      }
    >
      <SectionCard>
        <div className={styles.tableHeader}>
          <span className={styles.count}>
            {isLoading ? t('table.loading') : t('count', { count: orders.length })}
          </span>
        </div>

        <POTable
          orders={orders}
          isLoading={isLoading}
          onEdit={openEdit}
          onDelete={(id) => setDeleteTarget(id)}
        />
      </SectionCard>

      <POModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        order={editingPO}
        isSubmitting={creating || updating}
        vendorOptions={vendorOptions}
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
