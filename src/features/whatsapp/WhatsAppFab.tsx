import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import styles from './WhatsAppFab.module.css';

interface Props {
  onClick: () => void;
}

export function WhatsAppFab({ onClick }: Props) {
  return (
    <div className={styles.wrap}>
      <span className={styles.label} aria-hidden="true">Send Form Link</span>
      <button
        className={styles.fab}
        onClick={onClick}
        aria-label="Send WhatsApp Form Link"
      >
        <WhatsAppIcon size={22} />
      </button>
    </div>
  );
}
