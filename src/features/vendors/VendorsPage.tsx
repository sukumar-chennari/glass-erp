import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['vendors', 'common']);
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
        toast.success(t('messages.updated'));
      } else {
        await createVendor(data as CreateVendorDto).unwrap();
        toast.success(t('messages.added'));
      }
      closeModal();
    } catch {
      toast.error(t('messages.saveFailed'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVendor(deleteTarget).unwrap();
      toast.success(t('messages.removed'));
    } catch {
      toast.error(t('messages.removeFailed'));
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <PageShell
      heading={t('title')}
      description={t('description')}
      actions={
        <Button leftIcon={<Plus size={16} />} onClick={openAdd}>
          {t('form.title.add')}
        </Button>
      }
    >
      <SectionCard>
        <div className={styles.tableHeader}>
          <span className={styles.count}>
            {isLoading
              ? t('table.loading')
              : t('count', { count: vendors.length })}
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
        message={t('messages.confirmDelete')}
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageShell>
  );
}
