import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import type { TableColumn, SelectOption } from '@/types/ui';
import { ROUTES } from '@/constants/routes';
import styles from './BranchesPage.module.css';

// ── Types ──────────────────────────────────────────────────────────────
type BranchStatus = 'Active' | 'Inactive';

interface Branch {
  id:      string;
  name:    string;
  city:    string;
  address: string;
  phone:   string;
  manager: string;
  staff:   number;
  status:  BranchStatus;
}

const BRANCH_STATUS_MAP: Record<BranchStatus, { label: string; variant: 'success' | 'neutral' }> = {
  Active:   { label: 'Active',   variant: 'success' },
  Inactive: { label: 'Inactive', variant: 'neutral' },
};

const MANAGER_OPTIONS: SelectOption[] = [
  { value: 'u-002', label: 'Ramesh Kumar' },
  { value: 'u-008', label: 'Anand Kumar' },
  { value: 'none',  label: '— Not assigned —' },
];

// ── Mock Data ──────────────────────────────────────────────────────────
const INITIAL_BRANCHES: Branch[] = [
  {
    id: 'br-001', name: 'Main Branch', city: 'Hyderabad',
    address: '42 Banjara Hills, Hyderabad, TS 500034',
    phone: '9876543200', manager: 'Ramesh Kumar', staff: 6, status: 'Active',
  },
  {
    id: 'br-002', name: 'East Branch', city: 'Hyderabad',
    address: '18 LB Nagar, Hyderabad, TS 500074',
    phone: '9876543210', manager: 'Sundeep Reddy', staff: 4, status: 'Active',
  },
  {
    id: 'br-003', name: 'Secunderabad Branch', city: 'Secunderabad',
    address: '7 MG Road, Secunderabad, TS 500003',
    phone: '9876543220', manager: 'Anand Kumar', staff: 3, status: 'Active',
  },
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
      </div>
    ),
  },
  { key: 'city',    header: 'City' },
  { key: 'phone',   header: 'Phone' },
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
  name:      string;
  city:      string;
  address:   string;
  phone:     string;
  managerId: string;
}

const EMPTY_FORM: BranchForm = {
  name: '', city: '', address: '', phone: '', managerId: 'none',
};

// ── Component ──────────────────────────────────────────────────────────
export function BranchesPage() {
  const toast = useToast();
  const [branches,  setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [modalOpen, setModal]    = useState(false);
  const [form,      setForm]     = useState<BranchForm>(EMPTY_FORM);
  const [saving,    setSaving]   = useState(false);

  function set(key: keyof BranchForm, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.city.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    const managerName = MANAGER_OPTIONS.find((m) => m.value === form.managerId)?.label ?? '—';

    setBranches((prev) => [
      ...prev,
      {
        id:      `br-${Date.now()}`,
        name:    form.name.trim(),
        city:    form.city.trim(),
        address: form.address.trim(),
        phone:   form.phone.trim(),
        manager: managerName === '— Not assigned —' ? '—' : managerName,
        staff:   0,
        status:  'Active',
      },
    ]);

    toast.success(`Branch "${form.name}" created.`);
    setModal(false);
    setForm(EMPTY_FORM);
    setSaving(false);
  }

  const canSave = !!form.name.trim() && !!form.city.trim();

  return (
    <PageShell
      heading="Branches"
      description="Manage branch locations, assign managers and view staff."
      actions={
        <Button leftIcon={<Building2 size={16} />} onClick={() => setModal(true)}>
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
          <span className={styles.count}>{branches.length} branches</span>
        </div>
        <DataTable columns={COLUMNS} data={branches} />
      </SectionCard>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModal(false)}
        title="Add Branch"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={handleAdd} loading={saving} disabled={!canSave}>
              Create Branch
            </Button>
          </div>
        }
      >
        <div className={styles.form}>
          <div className={styles.twoCol}>
            <Input
              label="Branch Name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. West Branch"
              required
              autoFocus
            />
            <Input
              label="City"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder="e.g. Hyderabad"
              required
            />
          </div>
          <Input
            label="Full Address"
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="Street, Area, City, PIN"
            fullWidth
          />
          <div className={styles.twoCol}>
            <Input
              label="Contact Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile"
            />
            <Select
              label="Branch Manager"
              options={MANAGER_OPTIONS}
              value={form.managerId}
              onChange={(e) => set('managerId', e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
