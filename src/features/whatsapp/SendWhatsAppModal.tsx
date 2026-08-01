import { useState, useEffect, useRef } from 'react';
import { X, Send, Copy, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { useSendWhatsAppLinkMutation } from './whatsappApi';
import { useToast } from '@/components/ui/Toast';
import styles from './SendWhatsAppModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  initialName?: string;
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
}

function validatePhone(raw: string): string | null {
  const n = normalizePhone(raw);
  if (!n) return 'Phone number is required';
  if (n.length !== 10) return 'Enter a valid 10-digit mobile number';
  if (!/^[6-9]/.test(n)) return 'Enter a valid Indian mobile number (starts with 6–9)';
  return null;
}

type ModalView = 'form' | 'success' | 'fallback' | 'error';

export function SendWhatsAppModal({ isOpen, onClose, initialPhone = '', initialName = '' }: Props) {
  const toast = useToast();
  const [sendLink, { isLoading }] = useSendWhatsAppLinkMutation();

  const [phone, setPhone]       = useState(initialPhone);
  const [name, setName]         = useState(initialName);
  const [phoneErr, setPhoneErr] = useState('');
  const [nameErr, setNameErr]   = useState('');
  const [view, setView]         = useState<ModalView>('form');
  const [fallbackLink, setFallback] = useState('');
  const [copied, setCopied]     = useState(false);
  const phoneRef                = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPhone(initialPhone);
    setName(initialName);
    setPhoneErr('');
    setNameErr('');
    setView('form');
    setFallback('');
    setCopied(false);
    const t = setTimeout(() => phoneRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  async function handleSend() {
    let ok = true;
    const pErr = validatePhone(phone);
    if (pErr) { setPhoneErr(pErr); ok = false; }
    if (!name.trim()) { setNameErr('Customer name is required'); ok = false; }
    if (!ok) return;

    try {
      const res = await sendLink({
        phone: normalizePhone(phone),
        customerName: name.trim(),
      }).unwrap();

      if (res.fallbackLink) {
        setFallback(res.fallbackLink);
        setView('fallback');
      } else {
        setView('success');
      }
    } catch {
      setView('error');
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fallbackLink);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

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

          {view === 'form' && (
            <>
              <p className={styles.hint}>
                Enter a customer's details to send them the online booking form via WhatsApp.
              </p>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="wa-phone">Mobile Number</label>
                <div className={styles.phoneRow}>
                  <span className={styles.dialCode}>+91</span>
                  <input
                    ref={phoneRef}
                    id="wa-phone"
                    type="tel"
                    inputMode="numeric"
                    className={`${styles.phoneInput} ${phoneErr ? styles.inputErr : ''}`}
                    placeholder="10-digit number"
                    value={phone}
                    maxLength={10}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setPhoneErr(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleSend(); }}
                    aria-invalid={!!phoneErr}
                    aria-describedby={phoneErr ? 'wa-phone-err' : undefined}
                  />
                </div>
                {phoneErr && <span id="wa-phone-err" role="alert" className={styles.fieldErr}>{phoneErr}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="wa-name">Customer Name</label>
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

              <button
                className={styles.sendBtn}
                onClick={() => void handleSend()}
                disabled={isLoading}
              >
                {isLoading
                  ? <span className={styles.spinner} aria-hidden />
                  : <Send size={14} />}
                {isLoading ? 'Sending…' : 'Send Link'}
              </button>
            </>
          )}

          {view === 'success' && (
            <div className={styles.resultWrap}>
              <div className={styles.successCircle}>
                <CheckCircle2 size={36} />
              </div>
              <h3 className={styles.resultTitle}>Link Sent!</h3>
              <p className={styles.resultDesc}>
                The booking form was sent to <strong>{name}</strong> on WhatsApp (+91&nbsp;{phone}).
              </p>
              <button className={styles.doneBtn} onClick={onClose}>Done</button>
              <button className={styles.againBtn} onClick={() => setView('form')}>
                Send to another customer
              </button>
            </div>
          )}

          {view === 'fallback' && (
            <div className={styles.resultWrap}>
              <div className={styles.fallbackCircle}>
                <AlertCircle size={32} />
              </div>
              <h3 className={styles.resultTitle}>Use this link</h3>
              <p className={styles.resultDesc}>
                Couldn't deliver directly. Share this link with {name}:
              </p>
              <div className={styles.linkBox}>
                <span className={styles.linkText}>{fallbackLink}</span>
              </div>
              <div className={styles.fallbackActions}>
                <button className={styles.copyBtn} onClick={() => void handleCopy()}>
                  <Copy size={13} />
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
                <a href={fallbackLink} target="_blank" rel="noreferrer" className={styles.openBtn}>
                  <ExternalLink size={13} />
                  Open
                </a>
              </div>
              <button className={styles.againBtn} onClick={() => setView('form')}>
                Try another customer
              </button>
            </div>
          )}

          {view === 'error' && (
            <div className={styles.resultWrap}>
              <div className={styles.errorCircle}>
                <AlertCircle size={32} />
              </div>
              <h3 className={styles.resultTitle}>Couldn't send</h3>
              <p className={styles.resultDesc}>
                Something went wrong while sending the link. Please try again.
              </p>
              <button className={styles.retryBtn} onClick={() => setView('form')}>
                Try again
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
