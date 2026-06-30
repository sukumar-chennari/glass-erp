import { useState } from 'react';
import { UserCheck, Briefcase } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useGetTechniciansQuery } from '@/features/technicians/services/techniciansApi';
import { TECH_STATUS } from '@/constants/statuses';
import type { Job } from '@/types/models/job';
import styles from './AssignTechnicianModal.module.css';

interface Props {
  job:      Job | null;
  isOpen:   boolean;
  onClose:  () => void;
  onAssign: (technicianId: string, technicianName: string) => Promise<void>;
}

export function AssignTechnicianModal({ job, isOpen, onClose, onAssign }: Props) {
  const { data: technicians = [], isLoading } = useGetTechniciansQuery();
  const [selected, setSelected]  = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const activeTechs = technicians.filter((t) => t.status === TECH_STATUS.ACTIVE);

  async function handleAssign() {
    if (!selected || !job) return;
    const tech = activeTechs.find((t) => t.id === selected);
    if (!tech) return;
    setAssigning(true);
    try {
      await onAssign(tech.id, tech.name);
      setSelected(null);
    } finally {
      setAssigning(false);
    }
  }

  function handleClose() {
    if (assigning) return;
    setSelected(null);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Assign Technician"
      maxWidth="480px"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={handleClose} disabled={assigning}>
            Cancel
          </Button>
          <Button
            leftIcon={<UserCheck size={15} />}
            onClick={handleAssign}
            disabled={!selected}
            loading={assigning}
          >
            Assign
          </Button>
        </div>
      }
    >
      {job && (
        <div className={styles.jobMeta}>
          <span className={styles.jobNo}>{job.jobNumber}</span>
          <span>{job.customerName} · {job.glassPosition}</span>
          <span className={styles.vehicle}>{job.vehicleName}</span>
        </div>
      )}

      {isLoading ? (
        <div className={styles.loading}>Loading technicians…</div>
      ) : activeTechs.length === 0 ? (
        <div className={styles.empty}>No active technicians available.</div>
      ) : (
        <div className={styles.list}>
          {activeTechs.map((tech) => {
            const isSelected = selected === tech.id;
            const load       = tech.assignedJobs;
            const isBusy     = load >= 3;
            return (
              <button
                key={tech.id}
                type="button"
                className={`${styles.techRow} ${isSelected ? styles.selected : ''} ${isBusy ? styles.busy : ''}`}
                onClick={() => !isBusy && setSelected(tech.id)}
                disabled={isBusy}
              >
                <div className={styles.avatar}>{tech.name.charAt(0)}</div>
                <div className={styles.techInfo}>
                  <div className={styles.techName}>{tech.name}</div>
                  <div className={styles.techSpec}>
                    {tech.specialization ?? 'General'} · {tech.yearsExperience ?? 0}y exp
                  </div>
                </div>
                <div className={styles.loadChip}>
                  <Briefcase size={11} />
                  {load} active
                </div>
                {isSelected && <Badge label="Selected" variant="primary" size="sm" />}
                {isBusy    && <Badge label="Full"     variant="neutral" size="sm" />}
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
