import { useState, useEffect, useRef } from 'react';
import { X, Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { useSendWhatsAppLinkMutation } from './whatsappApi';
import { useGetBranchesQuery } from '@/features/settings/services/branchesApi';
import styles from './SendWhatsAppModal.module.css';

// ── Props ────────────────────────────────────────────────────────────────────
// All initial* props are optional pre-fills — e.g. Entry Page passes whatever
// the customer already typed into the booking form.
// To reuse on Staff pages: just render <SendWhatsAppModal isOpen onClose /> with
// no initial* props and the modal is fully self-contained.

export interface SendWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  initialName?: string;
  initialBranchId?: string;
}

// ── Phone helpers ────────────────────────────────────────────────────────────

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  // strip leading 91 from 12-digit inputs
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
}

function validatePhone(raw: string): string | null {
  const n = normalizePhone(raw);
  if (!n) return 'Phone number is required';
  if (n.length !== 10) return 'Enter a valid 10-digit mobile number';
  if (!/^[6-9]/.test(n)) return 'Must start with 6, 7, 8, or 9';
  return null;
}

// ── Component ────────────────────────────────────────────────────────────────

type View = 'form' | 'success' | 'error';

export function SendWhatsAppModal({
  isOpen,
  onClose,
  initialPhone    = '',
  initialName     = '',
  initialBranchId = '',
}: SendWhatsAppModalProps) {
  const [sendLink, { isLoading: sending }] = useSendWhatsAppLinkMutation();

  // Branches — fetched inside the modal so it stays self-contained on any page.
  // skip:true when closed avoids unnecessary network requests.
  const {
    data: branchRes,
    isLoading: branchesLoading,
    isError: branchesError,
    refetch: retryBranches,
  } = useGetBranchesQuery('ACTIVE', { skip: !isOpen });

  const branches = branchRes?.data ?? [];

  // Form state
  const [phone,    setPhone]    = useState(initialPhone);
  const [name,     setName]     = useState(initialName);
  const [branchId, setBranchId] = useState(initialBranchId);

  // Validation errors
  const [phoneErr,  setPhoneErr]  = useState('');
  const [nameErr,   setNameErr]   = useState('');
  const [branchErr, setBranchErr] = useState('');

  // Result state
  const [view,          setView]         = useState<View>('form');
  const [sentMedium,    setSentMedium]   = useState('');
  const [errorMessage,  setErrorMessage] = useState('');

  const phoneRef = useRef<HTMLInputElement>(null);

  // Reset everything when modal opens (not when it closes — avoids flash)
  useEffect(() => {
    if (!isOpen) return;
    setPhone(initialPhone);
    setName(initialName);
    setBranchId(initialBranchId);
    setPhoneErr('');
    setNameErr('');
    setBranchErr('');
    setView('form');
    setSentMedium('');
    setErrorMessage('');
    const t = setTimeout(() => phoneRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  // ── Submit ───────────────────────────────────────────────────────────────

  async function handleSend() {
    let ok = true;
    const pErr = validatePhone(phone);
    if (pErr) { setPhoneErr(pErr); ok = false; }
    if (!name.trim()) { setNameErr('Customer name is required'); ok = false; }
    if (!branchId) { setBranchErr('Please select a branch'); ok = false; }
    if (!ok) return;

    try {
      const res = await sendLink({
        phone:        normalizePhone(phone),
        customerName: name.trim(),
        branchId,
      }).unwrap();

      if (res.sent) {
        setSentMedium(res.medium ?? '');
        setView('success');
      } else {
        setErrorMessage('The link could not be sent. Please try again.');
        setView('error');
      }
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { message?: string } };
      if (e?.status === 400) {
        // Branch-specific error — surface inline so user can pick a different branch
        setBranchErr(
          e?.data?.message ?? 'This branch is currently unavailable. Please choose another.',
        );
        setBranchId('');
        // stay on form view — no need to flip to error page
      } else {
        setErrorMessage('Something went wrong. Please check your connection and try again.');
        setView('error');
      }
    }
  }

  function handleReset() {
    setView('form');
    setErrorMessage('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Send WhatsApp Form Link"
      onKeyDown={handleKeyDown}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.panel}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <WhatsAppIcon size={17} className={styles.waIcon} />
            Send Form via WhatsApp
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>

          {/* ── FORM VIEW ─────────────────────────────────────────────── */}
          {view === 'form' && (
            <>
              <p className={styles.hint}>
                Enter the customer's details to send them the booking form on WhatsApp.
              </p>

              {/* Phone */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="wa-phone">
                  Mobile Number <span className={styles.req}>*</span>
                </label>
                <div className={`${styles.phoneRow} ${phoneErr ? styles.phoneRowErr : ''}`}>
                  <span className={styles.dialCode}>+91</span>
                  <input
                    ref={phoneRef}
                    id="wa-phone"
                    type="tel"
                    inputMode="numeric"
                    className={styles.phoneInput}
                    placeholder="10-digit number"
                    value={phone}
                    maxLength={10}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setPhoneErr('');
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleSend(); }}
                    aria-invalid={!!phoneErr}
                    aria-describedby={phoneErr ? 'wa-phone-err' : undefined}
                  />
                </div>
                {phoneErr && <span id="wa-phone-err" role="alert" className={styles.fieldErr}>{phoneErr}</span>}
              </div>

              {/* Name */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="wa-name">
                  Customer Name <span className={styles.req}>*</span>
                </label>
                <input
                  id="wa-name"
                  type="text"
                  className={`${styles.input} ${nameErr ? styles.inputErr : ''}`}
                  placeholder="e.g. Ravi Kumar"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameErr(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleSend(); }}
                  aria-invalid={!!nameErr}
                  aria-describedby={nameErr ? 'wa-name-err' : undefined}
                />
                {nameErr && <span id="wa-name-err" role="alert" className={styles.fieldErr}>{nameErr}</span>}
              </div>

              {/* Branch */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="wa-branch">
                  Branch <span className={styles.req}>*</span>
                </label>

                {branchesLoading && (
                  <div className={styles.branchStatus}>
                    <span className={styles.branchSpinner} aria-hidden />
                    <span>Loading branches…</span>
                  </div>
                )}

                {!branchesLoading && branchesError && (
                  <div className={styles.branchStatus}>
                    <AlertCircle size={13} className={styles.branchErrIcon} />
                    <span>Could not load branches.</span>
                    <button
                      type="button"
                      className={styles.retryInline}
                      onClick={() => void retryBranches()}
                    >
                      <RefreshCw size={12} /> Retry
                    </button>
                  </div>
                )}

                {!branchesLoading && !branchesError && (
                  <select
                    id="wa-branch"
                    className={`${styles.select} ${branchErr ? styles.inputErr : ''}`}
                    value={branchId}
                    onChange={(e) => { setBranchId(e.target.value); setBranchErr(''); }}
                    disabled={branches.length === 0}
                    aria-invalid={!!branchErr}
                    aria-describedby={branchErr ? 'wa-branch-err' : undefined}
                  >
                    <option value="">
                      {branches.length === 0 ? 'No branches available' : 'Select a branch'}
                    </option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}{b.district ? ` — ${b.district}` : ''}
                      </option>
                    ))}
                  </select>
                )}

                {branchErr && (
                  <span id="wa-branch-err" role="alert" className={styles.fieldErr}>{branchErr}</span>
                )}
              </div>

              <button
                className={styles.sendBtn}
                onClick={() => void handleSend()}
                disabled={sending || branchesLoading || branchesError}
              >
                {sending
                  ? <span className={styles.spinner} aria-hidden />
                  : <Send size={14} />}
                {sending ? 'Sending…' : 'Send Link'}
              </button>
            </>
          )}

          {/* ── SUCCESS VIEW ──────────────────────────────────────────── */}
          {view === 'success' && (
            <div className={styles.resultWrap}>
              <div className={styles.successCircle}>
                <CheckCircle2 size={36} />
              </div>
              <h3 className={styles.resultTitle}>Link Sent!</h3>
              <p className={styles.resultDesc}>
                The booking form was sent to <strong>{name.trim()}</strong> (+91&nbsp;{phone}).
              </p>
              {sentMedium && (
                <span className={styles.mediumChip}>via {sentMedium}</span>
              )}
              <button className={styles.doneBtn} onClick={onClose}>Done</button>
              <button className={styles.againBtn} onClick={handleReset}>
                Send to another customer
              </button>
            </div>
          )}

          {/* ── ERROR VIEW ────────────────────────────────────────────── */}
          {view === 'error' && (
            <div className={styles.resultWrap}>
              <div className={styles.errorCircle}>
                <AlertCircle size={32} />
              </div>
              <h3 className={styles.resultTitle}>Couldn't send</h3>
              <p className={styles.resultDesc}>{errorMessage}</p>
              <button className={styles.retryBtn} onClick={handleReset}>
                Try again
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
