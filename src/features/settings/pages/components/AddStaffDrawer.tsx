import { useState, useRef, useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { useGetBranchesQuery } from '@/features/settings/services/branchesApi';
import { useCreateStaffBySuperAdminMutation } from '@/features/settings/services/usersApi';
import type { BackendStaffRole } from '@/types/models/appUser';
import styles from './AddStaffDrawer.module.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: BackendStaffRole; label: string }[] = [
  { value: 'FRONTOFFICE', label: 'Front Office' },
  { value: 'TECHNICIAN',  label: 'Technician'   },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[\s\-+().]/g, '');
  if (/^91\d{10}$/.test(digits)) return digits.slice(2);
  if (/^0\d{10}$/.test(digits))  return digits.slice(1);
  return digits;
}

function validatePhone(raw: string): string | null {
  if (!raw.trim()) return 'Phone number is required';
  const digits = normalizePhone(raw);
  if (!/^\d{10,15}$/.test(digits)) return 'Enter a valid phone number (10–15 digits)';
  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormState {
  name:     string;
  phone:    string;
  role:     BackendStaffRole;
  branchId: string;
}

interface FormErrors {
  name?:     string;
  phone?:    string;
  branchId?: string;
}

interface SuccessInfo {
  name:       string;
  role:       BackendStaffRole;
  branchName: string;
}

type View = 'form' | 'success' | 'error';

const EMPTY: FormState = { name: '', phone: '', role: 'FRONTOFFICE', branchId: '' };

// ── Component ─────────────────────────────────────────────────────────────────

export interface AddStaffDrawerProps {
  isOpen:  boolean;
  onClose: () => void;
}

export function AddStaffDrawer({ isOpen, onClose }: AddStaffDrawerProps) {
  const [createStaff, { isLoading: submitting }] = useCreateStaffBySuperAdminMutation();
  const { data: branchRes, isLoading: branchesLoading } = useGetBranchesQuery('ACTIVE', { skip: !isOpen });

  const branches = branchRes?.data ?? [];

  const [form,      setForm]      = useState<FormState>(EMPTY);
  const [errors,    setErrors]    = useState<FormErrors>({});
  const [view,      setView]      = useState<View>('form');
  const [success,   setSuccess]   = useState<SuccessInfo | null>(null);
  const [serverErr, setServerErr] = useState('');

  const submitGuard = useRef(false);
  const nameRef     = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY);
    setErrors({});
    setView('form');
    setSuccess(null);
    setServerErr('');
    const t = setTimeout(() => nameRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [isOpen]);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  }

  function validateForm(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim())                errs.name = 'Name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) errs.phone = phoneErr;
    if (!form.branchId) errs.branchId = 'Please select a branch';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (submitGuard.current || submitting) return;
    if (!validateForm()) return;
    submitGuard.current = true;

    const branchName = branches.find(b => b.id === form.branchId)?.name ?? '';
    const phone = normalizePhone(form.phone);

    try {
      await createStaff({
        name:     form.name.trim(),
        phone,
        role:     form.role,
        branchId: form.branchId,
      }).unwrap();

      setSuccess({ name: form.name.trim(), role: form.role, branchName });
      setView('success');
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { message?: string } };
      if (e?.status === 409) {
        setErrors(prev => ({
          ...prev,
          phone: 'This phone number is already registered at this branch',
        }));
      } else if (e?.status === 404) {
        setServerErr('Branch not found — it may have been deactivated. Please select a different branch.');
        setView('error');
      } else if (e?.status === 403 || e?.status === 401) {
        setServerErr('Your session does not have permission to perform this action.');
        setView('error');
      } else {
        setServerErr(
          e?.data?.message ?? 'Something went wrong. Check your connection and try again.',
        );
        setView('error');
      }
    } finally {
      submitGuard.current = false;
    }
  }

  function handleReset() {
    setForm(EMPTY);
    setErrors({});
    setView('form');
    setSuccess(null);
    setServerErr('');
    setTimeout(() => nameRef.current?.focus(), 80);
  }

  // ── Footer ────────────────────────────────────────────────────────────────────

  const footer = view === 'form' ? (
    <div className={styles.footerRow}>
      <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
      <Button onClick={() => void handleSubmit()} disabled={submitting} loading={submitting}>
        {submitting ? 'Adding…' : 'Add Staff Member'}
      </Button>
    </div>
  ) : view === 'success' ? (
    <div className={styles.footerRow}>
      <Button variant="ghost" onClick={handleReset}>Add Another</Button>
      <Button onClick={onClose}>Done</Button>
    </div>
  ) : (
    <div className={styles.footerRow}>
      <Button variant="ghost" onClick={onClose}>Close</Button>
      <Button onClick={() => setView('form')}>Try Again</Button>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Add Staff Member" footer={footer}>

      {/* ── FORM VIEW ─────────────────────────────────────────────────── */}
      {view === 'form' && (
        <div className={styles.body}>

          {/* Name */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="as-name">
              Full Name <span className={styles.req}>*</span>
            </label>
            <input
              ref={nameRef}
              id="as-name"
              type="text"
              className={`${styles.input} ${errors.name ? styles.inputErr : ''}`}
              placeholder="e.g. Ravi Kumar"
              value={form.name}
              maxLength={100}
              onChange={e => setField('name', e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void handleSubmit(); }}
              autoComplete="off"
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <span role="alert" className={styles.fieldErr}>{errors.name}</span>
            )}
          </div>

          {/* Phone */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="as-phone">
              Phone Number <span className={styles.req}>*</span>
            </label>
            <input
              id="as-phone"
              type="tel"
              className={`${styles.input} ${errors.phone ? styles.inputErr : ''}`}
              placeholder="10-digit mobile number"
              value={form.phone}
              maxLength={15}
              onChange={e => setField('phone', e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void handleSubmit(); }}
              autoComplete="off"
              aria-invalid={!!errors.phone}
            />
            {errors.phone ? (
              <span role="alert" className={styles.fieldErr}>{errors.phone}</span>
            ) : (
              <span className={styles.hint}>Accepts +91, 0-prefixed, or plain 10-digit numbers</span>
            )}
          </div>

          {/* Role */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="as-role">
              Role <span className={styles.req}>*</span>
            </label>
            <div className={styles.selectWrap}>
              <select
                id="as-role"
                className={styles.select}
                value={form.role}
                onChange={e => setField('role', e.target.value as BackendStaffRole)}
              >
                {ROLE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Branch */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="as-branch">
              Branch <span className={styles.req}>*</span>
            </label>
            <div className={`${styles.selectWrap} ${errors.branchId ? styles.selectWrapErr : ''}`}>
              {branchesLoading ? (
                <select className={styles.select} disabled>
                  <option>Loading branches…</option>
                </select>
              ) : (
                <select
                  id="as-branch"
                  className={styles.select}
                  value={form.branchId}
                  onChange={e => setField('branchId', e.target.value)}
                  aria-invalid={!!errors.branchId}
                >
                  <option value="">Select a branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
            </div>
            {errors.branchId && (
              <span role="alert" className={styles.fieldErr}>{errors.branchId}</span>
            )}
          </div>

        </div>
      )}

      {/* ── SUCCESS VIEW ──────────────────────────────────────────────── */}
      {view === 'success' && success && (
        <div className={styles.resultWrap}>
          <div className={styles.successCircle}>
            <CheckCircle2 size={36} />
          </div>
          <h3 className={styles.resultTitle}>Staff Member Added</h3>
          <p className={styles.resultDesc}>
            {success.name} has been onboarded and can log in using their phone number.
          </p>
          <div className={styles.accountCard}>
            <div className={styles.accountRow}>
              <span className={styles.accountKey}>Name</span>
              <span className={styles.accountVal}>{success.name}</span>
            </div>
            <div className={styles.accountRow}>
              <span className={styles.accountKey}>Role</span>
              <span className={styles.accountVal}>
                {success.role === 'FRONTOFFICE' ? 'Front Office' : 'Technician'}
              </span>
            </div>
            <div className={styles.accountRow}>
              <span className={styles.accountKey}>Branch</span>
              <span className={styles.accountVal}>{success.branchName}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR VIEW ────────────────────────────────────────────────── */}
      {view === 'error' && (
        <div className={styles.resultWrap}>
          <div className={styles.errorCircle}>
            <AlertCircle size={32} />
          </div>
          <h3 className={styles.resultTitle}>Request Failed</h3>
          <p className={styles.resultDesc}>{serverErr}</p>
        </div>
      )}

    </Drawer>
  );
}
