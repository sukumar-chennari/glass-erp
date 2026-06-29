import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import type { TableColumn, SelectOption } from '@/types/ui';
import { ROUTES } from '@/constants/routes';
import styles from './UsersPage.module.css';

// ── Types ──────────────────────────────────────────────────────────────
type AppRole   = 'super_admin' | 'branch_manager' | 'operator' | 'technician';
type UserStatus = 'Active' | 'Inactive';

interface AppUser {
  id:     string;
  name:   string;
  email:  string;
  phone:  string;
  role:   AppRole;
  branch: string | null;
  status: UserStatus;
}

// ── Constants ──────────────────────────────────────────────────────────
const ROLE_LABEL: Record<AppRole, string> = {
  super_admin:    'Super Admin',
  branch_manager: 'Branch Manager',
  operator:       'Operator',
  technician:     'Technician',
};

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'branch_manager', label: 'Branch Manager' },
  { value: 'operator',       label: 'Operator' },
  { value: 'technician',     label: 'Technician' },
];

const BRANCH_OPTIONS: SelectOption[] = [
  { value: 'br-001', label: 'Main Branch — Hyderabad' },
  { value: 'br-002', label: 'East Branch — Hyderabad' },
  { value: 'br-003', label: 'Secunderabad Branch' },
];

const USER_STATUS_MAP: Record<UserStatus, { label: string; variant: 'success' | 'neutral' }> = {
  Active:   { label: 'Active',   variant: 'success' },
  Inactive: { label: 'Inactive', variant: 'neutral' },
};

// ── Mock Data ──────────────────────────────────────────────────────────
const INITIAL_USERS: AppUser[] = [
  { id: 'u-001', name: 'Narayana Rao',  email: 'narayana.rao@windxglass.in',  phone: '9876543200', role: 'super_admin',    branch: null,                    status: 'Active' },
  { id: 'u-002', name: 'Ramesh Kumar',  email: 'ramesh.kumar@windxglass.in',  phone: '9876543201', role: 'branch_manager', branch: 'Main Branch',            status: 'Active' },
  { id: 'u-003', name: 'Priya Sharma',  email: 'priya.sharma@windxglass.in',  phone: '9876543202', role: 'operator',       branch: 'Main Branch',            status: 'Active' },
  { id: 'u-004', name: 'Arun Mehta',    email: 'arun.mehta@windxglass.in',    phone: '9876543203', role: 'technician',     branch: 'Main Branch',            status: 'Active' },
  { id: 'u-005', name: 'Kiran Desai',   email: 'kiran.desai@windxglass.in',   phone: '9876543204', role: 'technician',     branch: 'Main Branch',            status: 'Active' },
  { id: 'u-006', name: 'Deepak Rao',    email: 'deepak.rao@windxglass.in',    phone: '9876543205', role: 'technician',     branch: 'East Branch',            status: 'Active' },
  { id: 'u-007', name: 'Sunita Verma',  email: 'sunita.verma@windxglass.in',  phone: '9876543206', role: 'operator',       branch: 'East Branch',            status: 'Inactive' },
  { id: 'u-008', name: 'Anand Kumar',   email: 'anand.kumar@windxglass.in',   phone: '9876543207', role: 'branch_manager', branch: 'Secunderabad Branch',    status: 'Active' },
];

// ── Table columns ──────────────────────────────────────────────────────
const COLUMNS: TableColumn<AppUser>[] = [
  {
    key: 'name',
    header: 'Name / Email',
    render: (u) => (
      <div>
        <div className={styles.cellPrimary}>{u.name}</div>
        <div className={styles.cellMuted}>{u.email}</div>
      </div>
    ),
  },
  { key: 'phone', header: 'Mobile' },
  {
    key: 'role',
    header: 'Role',
    render: (u) => (
      <Badge
        label={ROLE_LABEL[u.role]}
        variant={u.role === 'super_admin' ? 'primary' : 'info'}
        size="sm"
      />
    ),
  },
  {
    key: 'branch',
    header: 'Branch',
    render: (u) => (
      <span className={u.branch ? undefined : styles.cellMuted}>
        {u.branch ?? '—'}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (u) => <StatusBadge status={u.status} statusMap={USER_STATUS_MAP} size="sm" />,
  },
];

// ── Form state ─────────────────────────────────────────────────────────
interface UserForm {
  name:   string;
  email:  string;
  phone:  string;
  role:   string;
  branch: string;
}

const EMPTY_FORM: UserForm = {
  name:   '',
  email:  '',
  phone:  '',
  role:   'operator',
  branch: 'br-001',
};

// ── Component ──────────────────────────────────────────────────────────
export function UsersPage() {
  const toast = useToast();
  const [users,      setUsers]   = useState<AppUser[]>(INITIAL_USERS);
  const [modalOpen,  setModal]   = useState(false);
  const [form,       setForm]    = useState<UserForm>(EMPTY_FORM);
  const [saving,     setSaving]  = useState(false);

  function set(key: keyof UserForm, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.email.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));

    const branchLabel = BRANCH_OPTIONS.find((b) => b.value === form.branch)?.label ?? null;
    const [branchName] = (branchLabel ?? '').split(' — ');

    setUsers((prev) => [
      ...prev,
      {
        id:     `u-${Date.now()}`,
        name:   form.name.trim(),
        email:  form.email.trim().toLowerCase(),
        phone:  form.phone.trim(),
        role:   form.role as AppRole,
        branch: branchName || null,
        status: 'Active',
      },
    ]);

    toast.success(`${form.name} added. A welcome email will be sent.`);
    setModal(false);
    setForm(EMPTY_FORM);
    setSaving(false);
  }

  const canSave = !!form.name.trim() && !!form.email.trim();

  return (
    <PageShell
      heading="Users"
      description="Manage staff accounts, roles and branch access."
      actions={
        <Button leftIcon={<UserPlus size={16} />} onClick={() => setModal(true)}>
          Add User
        </Button>
      }
    >
      <Link to={ROUTES.SETTINGS} className={styles.back}>
        <ArrowLeft size={13} />
        Back to Settings
      </Link>

      <SectionCard>
        <div className={styles.tableHeader}>
          <span className={styles.count}>{users.length} users</span>
        </div>
        <DataTable columns={COLUMNS} data={users} />
      </SectionCard>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModal(false)}
        title="Add User"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={handleAdd} loading={saving} disabled={!canSave}>
              Add User
            </Button>
          </div>
        }
      >
        <div className={styles.form}>
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            fullWidth
            required
            autoFocus
          />
          <Input
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            fullWidth
            required
          />
          <Input
            label="Mobile Number"
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit mobile"
            fullWidth
          />
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(e) => set('role', e.target.value)}
          />
          <Select
            label="Branch"
            options={BRANCH_OPTIONS}
            value={form.branch}
            onChange={(e) => set('branch', e.target.value)}
          />
          <p className={styles.hint}>
            A welcome email with login credentials will be sent to the user.
          </p>
        </div>
      </Modal>
    </PageShell>
  );
}
