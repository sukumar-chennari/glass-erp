import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  isOpen:        boolean;
  title?:        string;
  message:       string;
  confirmLabel?: string;
  isLoading?:    boolean;
  onConfirm:     () => void;
  onCancel:      () => void;
}

export function ConfirmDialog({
  isOpen,
  title        = 'Confirm Delete',
  message,
  confirmLabel = 'Delete',
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      maxWidth="400px"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className={styles.body}>
        <span className={styles.icon}>
          <AlertTriangle size={22} />
        </span>
        <p className={styles.message}>{message}</p>
      </div>
    </Modal>
  );
}
