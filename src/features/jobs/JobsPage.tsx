import { useState, useMemo } from 'react';
import { ClipboardPlus } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { JobTable } from './components/JobTable';
import { JobModal } from './components/JobModal';
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
  const { data: jobs = [], isLoading } = useGetJobsQuery();
  const { data: customers = [] }       = useGetCustomersQuery();
  const { data: technicians = [] }     = useGetTechniciansQuery();
  const [createJob, { isLoading: creating }] = useCreateJobMutation();
  const [updateJob, { isLoading: updating }] = useUpdateJobMutation();
  const [deleteJob, { isLoading: deleting }] = useDeleteJobMutation();
  const toast = useToast();

  const [modalOpen, setModalOpen]   = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const customerOptions = useMemo<SelectOption[]>(
    () => customers.map((c) => ({ value: c.id, label: `${c.name} (${c.phone})` })),
    [customers],
  );

  const technicianOptions = useMemo<SelectOption[]>(
    () => technicians.map((t) => ({ value: t.id, label: t.name })),
    [technicians],
  );

  const openAdd  = () => { setEditingJob(null); setModalOpen(true); };
  const openEdit = (j: Job) => { setEditingJob(j); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingJob(null); };

  const handleSubmit = async (data: CreateJobDto & { status?: Job['status'] }) => {
    try {
      if (editingJob) {
        await updateJob({ id: editingJob.id, ...data }).unwrap();
        toast.success('Job updated');
      } else {
        await createJob(data).unwrap();
        toast.success('Job created');
      }
      closeModal();
    } catch {
      toast.error('Failed to save job');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteJob(deleteTarget).unwrap();
      toast.success('Job deleted');
    } catch {
      toast.error('Failed to delete job');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <PageShell
      heading="Job Cards"
      description="Create jobs, assign technicians and track status."
      actions={
        <Button leftIcon={<ClipboardPlus size={16} />} onClick={openAdd}>
          New Job
        </Button>
      }
    >
      <SectionCard>
        <div className={styles.tableHeader}>
          <span className={styles.count}>
            {isLoading ? 'Loading…' : `${jobs.length} job${jobs.length !== 1 ? 's' : ''}`}
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
        message="Delete this job card? This cannot be undone."
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageShell>
  );
}
