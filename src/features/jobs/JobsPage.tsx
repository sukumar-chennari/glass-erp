import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardPlus } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { JobTable } from './components/JobTable';
import { JobModal } from './components/JobModal';
import { TechnicianJobView } from './components/TechnicianJobView';
import { useAuth } from '@/context/AuthContext';
import {
  useGetJobsQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
} from './services/jobsApi';
import { useGetCustomersQuery } from '@/features/customers/services/customersApi';
import { useGetTechniciansQuery } from '@/features/technicians/services/techniciansApi';
import type { Job, CreateJobDto } from '@/types/models/job';
import type { SelectOption } from '@/types/ui';
import styles from './JobsPage.module.css';

export function JobsPage() {
  const { session } = useAuth();
  const { data: jobs = [], isLoading } = useGetJobsQuery();
  const { data: customers = [] }       = useGetCustomersQuery();
  const { data: technicians = [] }     = useGetTechniciansQuery();
  const [createJob, { isLoading: creating }] = useCreateJobMutation();
  const [updateJob, { isLoading: updating }] = useUpdateJobMutation();
  const [deleteJob, { isLoading: deleting }] = useDeleteJobMutation();
  const toast = useToast();
  const { t } = useTranslation(['jobs', 'common']);

  const [modalOpen, setModalOpen]   = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  if (session?.role === 'technician') {
    return <TechnicianJobView />;
  }

  const customerOptions = useMemo<SelectOption[]>(
    () => customers.map((c) => ({ value: c.id, label: `${c.name} (${c.phone})` })),
    [customers],
  );

  const technicianOptions = useMemo<SelectOption[]>(
    () => technicians.map((tech) => ({ value: tech.id, label: tech.name })),
    [technicians],
  );

  const openAdd  = () => { setEditingJob(null); setModalOpen(true); };
  const openEdit = (j: Job) => { setEditingJob(j); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingJob(null); };

  const handleSubmit = async (data: CreateJobDto & { status?: Job['status'] }) => {
    try {
      if (editingJob) {
        await updateJob({ id: editingJob.id, ...data }).unwrap();
        toast.success(t('messages.updated'));
      } else {
        await createJob(data).unwrap();
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
      await deleteJob(deleteTarget).unwrap();
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
        <Button leftIcon={<ClipboardPlus size={16} />} onClick={openAdd}>
          {t('form.title.add')}
        </Button>
      }
    >
      <SectionCard>
        <div className={styles.tableHeader}>
          <span className={styles.count}>
            {isLoading ? t('table.loading') : t('count', { count: jobs.length })}
          </span>
        </div>

        <JobTable
          jobs={jobs}
          isLoading={isLoading}
          onEdit={openEdit}
          onDelete={(id) => setDeleteTarget(id)}
        />
      </SectionCard>

      <JobModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        job={editingJob}
        isSubmitting={creating || updating}
        customerOptions={customerOptions}
        technicianOptions={technicianOptions}
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
