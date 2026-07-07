import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft, MapPin, ExternalLink } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useGetBranchesQuery, useCreateBranchMutation } from '@/features/settings/services/branchesApi';
import type { Branch, BranchCreatePayload, BranchStatus } from '@/types/models/branch';
import type { TableColumn, SelectOption } from '@/types/ui';
import { ROUTES } from '@/constants/routes';
import styles from './BranchesPage.module.css';

const BRANCH_STATUS_MAP: Record<BranchStatus, { label: string; variant: 'success' | 'neutral' }> = {
  Active:   { label: 'Active',   variant: 'success' },
  Inactive: { label: 'Inactive', variant: 'neutral' },
};

const MANAGER_OPTIONS: SelectOption[] = [
  { value: 'none',  label: '— Not assigned —' },
  { value: 'u-002', label: 'Ramesh Kumar'      },
  { value: 'u-008', label: 'Anand Kumar'       },
  { value: 'u-009', label: 'Sundeep Reddy'     },
  { value: 'u-010', label: 'Vijaya Lakshmi'    },
  { value: 'u-011', label: 'Karthik Reddy'     },
];

// ── Table Columns ──────────────────────────────────────────────────────
const COLUMNS: TableColumn<Branch>[] = [
  {
    key: 'name',
    header: 'Branch',
    render: (b) => (
      <div>
        <div className={styles.cellPrimary}>{b.name}</div>
        <div className={styles.cellMuted}>{b.address}</div>
        {b.mapsUrl && (
          <a
            href={b.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapsLink}
            onClick={(e) => e.stopPropagation()}
          >
            <MapPin size={10} /> View on Maps
          </a>
        )}
      </div>
    ),
  },
  {
    key: 'openTime',
    header: 'Hours',
    render: (b) => (
      <span className={styles.hours}>{b.openTime} – {b.closeTime}</span>
    ),
  },
  { key: 'phone',   header: 'Phone'   },
  { key: 'manager', header: 'Manager' },
  {
    key: 'staff',
    header: 'Staff',
    align: 'center' as const,
    render: (b) => <span>{b.staff}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    render: (b) => <StatusBadge status={b.status} statusMap={BRANCH_STATUS_MAP} size="sm" />,
  },
];

// ── Form ───────────────────────────────────────────────────────────────
interface BranchForm {
  name:         string;
  address:      string;
  phone:        string;
  mapsUrl:      string;
  openTime:     string;
  closeTime:    string;
  serviceAreas: string;
  pincodes:     string;
  managerId:    string;
}

const EMPTY_FORM: BranchForm = {
  name:         '',
  address:      '',
  phone:        '',
  mapsUrl:      '',
  openTime:     '09:00',
  closeTime:    '20:00',
  serviceAreas: '',
  pincodes:     '',
  managerId:    'none',
};

interface FormErrors {
  name?:    string;
  address?: string;
  phone?:   string;
}

// ── Component ──────────────────────────────────────────────────────────
export function BranchesPage() {
  const toast = useToast();
  const { data: branches = [], isLoading, isError } = useGetBranchesQuery();
  const [createBranch, { isLoading: saving }] = useCreateBranchMutation();

  const [modalOpen, setModal]  = useState(false);
  const [form,      setForm]   = useState<BranchForm>(EMPTY_FORM);
  const [errors,    setErrors] = useState<FormErrors>({});

  const totalStaff = useMemo(() => branches.reduce((a, b) => a + b.staff, 0), [branches]);

  function set(key: keyof BranchForm, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key as keyof FormErrors]) {
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim())    errs.name    = 'Branch name is required';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/[-\s]/g, ''))) {
      errs.phone = 'Enter a valid 10-digit phone number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function openModal() {
    setForm(EMPTY_FORM);
    setErrors({});
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setErrors({});
  }

  async function handleAdd() {
    if (!validate()) return;
    const payload: BranchCreatePayload = {
      name:         form.name.trim(),
      address:      form.address.trim(),
      phone:        form.phone.trim(),
      mapsUrl:      form.mapsUrl.trim(),
      openTime:     form.openTime,
      closeTime:    form.closeTime,
      serviceAreas: form.serviceAreas.trim(),
      pincodes:     form.pincodes.trim(),
      managerId:    form.managerId,
    };
    const result = await createBranch(payload);
    if ('data' in result) {
      toast.success(`Branch "${form.name.trim()}" created.`);
      closeModal();
    }
  }

  return (
    <PageShell
      heading="Branches"
      description="Manage branch locations, assign managers and configure service areas."
      actions={
        <Button leftIcon={<Building2 size={16} />} onClick={openModal}>
          Add Branch
        </Button>
      }
    >
      <Link to={ROUTES.SETTINGS} className={styles.back}>
        <ArrowLeft size={13} />
        Back to Settings
      </Link>

      <SectionCard>
        <div className={styles.tableHeader}>
          <span className={styles.count}>{branches.length} branches · {totalStaff} staff</span>
        </div>
        {isLoading && <div className={styles.emptyState}>Loading branches…</div>}
        {isError   && <div className={styles.emptyState}>Failed to load branches.</div>}
        {!isLoading && !isError && <DataTable columns={COLUMNS} data={branches} />}
      </SectionCard>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Add Branch"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleAdd} loading={saving}>
              Create Branch
            </Button>
          </div>
        }
      >
        <div className={styles.form}>
          <Input
            label="Branch Name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. WindX West Branch"
            error={errors.name}
            required
            fullWidth
            autoFocus
          />

          <div className={styles.field}>
            <label className={styles.label}>
              Full Address <span className={styles.req}>*</span>
            </label>
            <textarea
              className={`${styles.textarea} ${errors.address ? styles.textareaError : ''}`}
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Street, Area, City, PIN"
              rows={2}
            />
            {errors.address && <span className={styles.errMsg}>{errors.address}</span>}
          </div>

          <div className={styles.twoCol}>
            <Input
              label="Contact Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value.replace(/[^\d\s-]/g, '').slice(0, 12))}
              placeholder="040-XXXXXXXX"
              error={errors.phone}
            />
            <Input
              label="Google Maps Link"
              type="url"
              value={form.mapsUrl}
              onChange={(e) => set('mapsUrl', e.target.value)}
              placeholder="https://maps.google.com/…"
              rightIcon={<ExternalLink size={13} />}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Working Hours</label>
            <div className={styles.hoursRow}>
              <input
                type="time"
                className={styles.timeInput}
                value={form.openTime}
                onChange={(e) => set('openTime', e.target.value)}
              />
              <span className={styles.hoursSep}>to</span>
              <input
                type="time"
                className={styles.timeInput}
                value={form.closeTime}
                onChange={(e) => set('closeTime', e.target.value)}
              />
            </div>
          </div>

          <Select
            label="Branch Manager"
            options={MANAGER_OPTIONS}
            value={form.managerId}
            onChange={(e) => set('managerId', e.target.value)}
          />

          <Input
            label="Service Areas"
            value={form.serviceAreas}
            onChange={(e) => set('serviceAreas', e.target.value)}
            placeholder="e.g. Kondapur, Gachibowli, Nanakramguda"
            hint="Comma-separated list of areas served by this branch"
            fullWidth
          />

          <Input
            label="Serviceable Pincodes"
            value={form.pincodes}
            onChange={(e) => set('pincodes', e.target.value)}
            placeholder="e.g. 500032, 500081, 500084"
            hint="Comma-separated pincodes"
            fullWidth
          />
        </div>
      </Modal>
    </PageShell>
  );
}
