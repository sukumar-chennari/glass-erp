import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { VendorTable } from './components/VendorTable';
import { VendorModal } from './components/VendorModal';
import {
  useGetVendorsQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
} from './services/vendorsApi';
import type { Vendor, CreateVendorDto, UpdateVendorDto } from '@/types/models/vendor';
import styles from './VendorsPage.module.css';

export function VendorsPage() {
  const { data: vendors = [], isLoading } = useGetVendorsQuery();
  const [createVendor, { isLoading: creating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: updating }] = useUpdateVendorMutation();
  const [deleteVendor, { isLoading: deleting }] = useDeleteVendorMutation();
  const toast = useToast();

  const [modalOpen, setModalOpen]         = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<string | null>(null);

  const openAdd  = () => { setEditingVendor(null); setModalOpen(true); };
  const openEdit = (vendor: Vendor) => { setEditingVendor(vendor); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingVendor(null); };

  const handleSubmit = async (data: CreateVendorDto | UpdateVendorDto) => {
    try {
      if (editingVendor) {
        await updateVendor({ id: editingVendor.id, ...data }).unwrap();
        toast.success('Vendor updated');
      } else {
        await createVendor(data as CreateVendorDto).unwrap();
        toast.success('Vendor added');
      }
      closeModal();
    } catch {
      toast.error('Failed to save vendor');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVendor(deleteTarget).unwrap();
      toast.success('Vendor removed');
    } catch {
      toast.error('Failed to remove vendor');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <PageShell
      heading="Vendors"
      description="Manage your glass suppliers and procurement partners."
      actions={
        <Button leftIcon={<Plus size={16} />} onClick={openAdd}>
          Add Vendor
        </Button>
      }
    >
      <SectionCard>
        <div className={styles.tableHeader}>
          <span className={styles.count}>
            {isLoading ? 'Loading…' : `${vendors.length} vendor${vendors.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        <VendorTable
          vendors={vendors}
          isLoading={isLoading}
          onEdit={openEdit}
          onDelete={(id) => setDeleteTarget(id)}
        />
      </SectionCard>

      <VendorModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        vendor={editingVendor}
        isSubmitting={creating || updating}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        message="Remove this vendor? This cannot be undone."
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageShell>
  );
}
