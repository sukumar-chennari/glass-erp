import { useState, useMemo } from 'react';
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
        toast.success('Purchase order updated');
      } else {
        await createPO(data as CreatePurchaseOrderDto).unwrap();
        toast.success('Purchase order created');
      }
      closeModal();
    } catch {
      toast.error('Failed to save purchase order');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePO(deleteTarget).unwrap();
      toast.success('Purchase order deleted');
    } catch {
      toast.error('Failed to delete purchase order');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <PageShell
      heading="Purchase Orders"
      description="Track vendor orders and delivery status."
      actions={
        <Button leftIcon={<FilePlus size={16} />} onClick={openAdd}>
          New Order
        </Button>
      }
    >
      <SectionCard>
        <div className={styles.tableHeader}>
          <span className={styles.count}>
            {isLoading ? 'Loading…' : `${orders.length} order${orders.length !== 1 ? 's' : ''}`}
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
        message="Delete this purchase order? This cannot be undone."
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageShell>
  );
}
