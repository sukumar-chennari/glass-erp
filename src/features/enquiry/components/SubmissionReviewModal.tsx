import {
  Phone, Car, Wrench, MapPin, CreditCard, Shield,
  Image, FileText, CheckCircle2, MessageCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { CustomerSubmission } from '../types';
import styles from './SubmissionReviewModal.module.css';

interface Props {
  submission: CustomerSubmission | null;
  isOpen:     boolean;
  onClose:    () => void;
  onConvert:  (sub: CustomerSubmission) => void;
  onDismiss:  (id: string) => void;
}

export function SubmissionReviewModal({
  submission, isOpen, onClose, onConvert, onDismiss,
}: Props) {
  if (!submission) return null;

  const sub = submission;
  const isInsurance = sub.paymentPreference === 'insurance';

  function handleConvert() {
    onConvert(sub);
    onClose();
  }

  function handleDismiss() {
    onDismiss(sub.id);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Submission Review"
      maxWidth="620px"
      footer={
        <div className={styles.footer}>
          <Button variant="ghost" onClick={handleDismiss}>
            Dismiss
          </Button>
          <div className={styles.footerRight}>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleConvert}>
              Create Enquiry from this Submission
            </Button>
          </div>
        </div>
      }
    >
      <div className={styles.body}>

        {/* Meta banner */}
        <div className={styles.metaBanner}>
          <div className={styles.metaId}>SUB-{sub.id.toUpperCase().replace('SUB-', '')}</div>
          <div className={styles.metaTime}>
            Received {new Date(sub.submittedAt).toLocaleString('en-IN', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </div>
        </div>

        {/* ── Contact ─────────────────────────────────────────────── */}
        <Section icon={<Phone size={14} />} title="Contact Details">
          <Row label="Name" value={sub.name} />
          <Row label="Phone" value={`+91 ${sub.phone}`} />
          <Row
            label="WhatsApp"
            value={
              sub.whatsappVerified ? (
                <span className={styles.verified}><CheckCircle2 size={12} /> Verified</span>
              ) : (
                <span className={styles.unverified}>Not verified</span>
              )
            }
          />
        </Section>

        {/* ── Vehicle ─────────────────────────────────────────────── */}
        <Section icon={<Car size={14} />} title="Vehicle Details">
          <Row label="Make / Model" value={`${sub.vehicleMake} ${sub.vehicleModel}`} />
          <Row label="Year" value={String(sub.vehicleYear)} />
          <Row label="Registration" value={sub.vehicleNo} mono />
          <Row
            label="RC Document"
            value={
              sub.rcUploaded ? (
                <span className={styles.verified}><FileText size={12} /> Uploaded</span>
              ) : (
                <span className={styles.unverified}>Not uploaded</span>
              )
            }
          />
        </Section>

        {/* ── Glass & Damage ───────────────────────────────────────── */}
        <Section icon={<Wrench size={14} />} title="Glass & Damage">
          <Row label="Glass Type" value={sub.glassType} />
          {sub.glassPosition && <Row label="Position" value={sub.glassPosition} />}
          <Row label="Description" value={sub.description} />
          <Row
            label="Photos"
            value={
              sub.photoCount > 0 ? (
                <span className={styles.photoChip}>
                  <Image size={12} />
                  {sub.photoCount} photo{sub.photoCount !== 1 ? 's' : ''} attached
                </span>
              ) : (
                <span className={styles.unverified}>No photos</span>
              )
            }
          />
        </Section>

        {/* ── Preferences ─────────────────────────────────────────── */}
        <Section icon={<MapPin size={14} />} title="Preferences">
          <Row label="Branch" value={sub.preferredBranch} />
          <Row
            label="Payment"
            value={
              <span className={`${styles.payChip} ${isInsurance ? styles.payInsurance : styles.payCash}`}>
                {sub.paymentPreference === 'insurance' ? (
                  <><Shield size={11} /> Insurance</>
                ) : sub.paymentPreference === 'cash' ? (
                  <><CreditCard size={11} /> Cash</>
                ) : sub.paymentPreference === 'card' ? (
                  <><CreditCard size={11} /> Card/UPI</>
                ) : (
                  'Undecided'
                )}
              </span>
            }
          />
        </Section>

        {/* ── Insurance Details (conditional) ─────────────────────── */}
        {isInsurance && (sub.insuranceInsurer || sub.insurancePolicyNo) && (
          <Section icon={<Shield size={14} />} title="Insurance Details">
            {sub.insuranceInsurer  && <Row label="Insurer"       value={sub.insuranceInsurer}  />}
            {sub.insurancePolicyNo && <Row label="Policy Number" value={sub.insurancePolicyNo} mono />}
          </Section>
        )}

        {isInsurance && !sub.insuranceInsurer && !sub.insurancePolicyNo && (
          <Section icon={<Shield size={14} />} title="Insurance Details">
            <div className={styles.missingNote}>
              <MessageCircle size={13} />
              Customer selected insurance but did not provide policy details. Request before creating enquiry.
            </div>
          </Section>
        )}

      </div>
    </Modal>
  );
}

// ── Helper components ─────────────────────────────────────────────────
function Section({
  icon, title, children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        {icon}
        <span>{title}</span>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}

function Row({
  label, value, mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={`${styles.rowValue} ${mono ? styles.mono : ''}`}>{value}</span>
    </div>
  );
}
