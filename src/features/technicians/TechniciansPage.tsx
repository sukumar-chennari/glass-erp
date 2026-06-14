import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { TechnicianTable } from './components/TechnicianTable';
import { TechnicianModal } from './components/TechnicianModal';
import {
  useGetTechniciansQuery,
  useCreateTechnicianMutation,
  useUpdateTechnicianMutation,
  useDeleteTechnicianMutation,
} from './services/techniciansApi';
import type { Technician, CreateTechnicianDto, UpdateTechnicianDto } from '@/types/models/technician';
import styles from './TechniciansPage.module.css';

export function TechniciansPage() {
  const { data: technicians = [], isLoading } = useGetTechniciansQuery();
  const [createTechnician, { isLoading: creating }] = useCreateTechnicianMutation();
  const [updateTechnician, { isLoading: updating }] = useUpdateTechnicianMutation();
  const [deleteTechnician, { isLoading: deleting }] = useDeleteTechnicianMutation();
  const toast = useToast();

  const [modalOpen, setModalOpen]     = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const openAdd  = () => { setEditingTech(null); setModalOpen(true); };
  const openEdit = (t: Technician) => { setEditingTech(t); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingTech(null); };

  const handleSubmit = async (data: CreateTechnicianDto | UpdateTechnicianDto) => {
    try {
      if (editingTech) {
        await updateTechnician({ id: editingTech.id, ...data }).unwrap();
        toast.success('Technician updated');
      } else {
        await createTechnician(data as CreateTechnicianDto).unwrap();
        toast.success('Technician added');
      }
      closeModal();
    } catch {
      toast.error('Failed to save technician');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTechnician(deleteTarget).unwrap();
      toast.success('Technician removed');
    } catch {
      toast.error('Failed to remove technician');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <PageShell
      heading="Technicians"
      description="Onboard and manage your service team."
      actions={
        <Button leftIcon={<UserPlus size={16} />} onClick={openAdd}>
          Add Technician
        </Button>
      }
    >
      <SectionCard>
        <div className={styles.tableHeader}>
          <span className={styles.count}>
            {isLoading
              ? 'Loading…'
              : `${technicians.length} technician${technicians.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        <TechnicianTable
          technicians={technicians}
          isLoading={isLoading}
          onEdit={openEdit}
          onDelete={(id) => setDeleteTarget(id)}
        />
      </SectionCard>

      <TechnicianModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        technician={editingTech}
        isSubmitting={creating || updating}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        message="Remove this technician? This cannot be undone."
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageShell>
  );
}
