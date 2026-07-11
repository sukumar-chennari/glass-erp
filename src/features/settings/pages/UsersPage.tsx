import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, ArrowLeft, Search } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useGetUsersQuery, useCreateUserMutation } from '@/features/settings/services/usersApi';
import { useResendInviteMutation } from '@/services/auth/authApi';
import type { AppUser, AppRole, UserStatus, InvitationStatus, UserCreatePayload } from '@/types/models/appUser';
import type { TableColumn, SelectOption } from '@/types/ui';
import { ROUTES } from '@/constants/routes';
import styles from './UsersPage.module.css';

// ── Constants ──────────────────────────────────────────────────────────
const ROLE_LABEL: Record<AppRole, string> = {
  super_admin:    'Super Admin',
  branch_manager: 'Branch Manager',
  operator:       'Operator',
  technician:     'Technician',
};

const ROLE_VARIANT: Record<AppRole, 'primary' | 'info' | 'success' | 'warning'> = {
  super_admin:    'primary',
  branch_manager: 'info',
  operator:       'success',
  technician:     'warning',
};

// Only roles with a confirmed backend mapping (FRONTEND_TO_BACKEND_ROLE) are offered.
// branch_manager and operator are excluded until backend confirms their equivalents.
const ROLE_OPTIONS: SelectOption[] = [
  { value: 'technician', label: 'Technician' },
];

const ROLE_FILTER_OPTIONS: SelectOption[] = [
  { value: '',               label: 'All Roles'      },
  { value: 'super_admin',    label: 'Super Admin'    },
  { value: 'branch_manager', label: 'Branch Manager' },
  { value: 'operator',       label: 'Operator'       },
  { value: 'technician',     label: 'Technician'     },
];

const BRANCH_OPTIONS: SelectOption[] = [
  { value: 'br-001', label: 'Banjara Hills'  },
  { value: 'br-002', label: 'Secunderabad'   },
  { value: 'br-003', label: 'Madhapur'       },
  { value: 'br-004', label: 'Kompally'       },
  { value: 'br-005', label: 'Mehdipatnam'    },
];

const BRANCH_FILTER_OPTIONS: SelectOption[] = [
  { value: '', label: 'All Branches' },
  ...BRANCH_OPTIONS,
];

const USER_STATUS_MAP: Record<UserStatus, { label: string; variant: 'success' | 'neutral' | 'warning' }> = {
  'Active':        { label: 'Active',        variant: 'success' },
  'Inactive':      { label: 'Inactive',      variant: 'neutral' },
  'Pending Setup': { label: 'Pending Setup', variant: 'warning' },
};

const INVITE_STATUS_LABEL: Record<InvitationStatus, string> = {
  pending:  'Invite pending',
  sent:     'Setup link sent',
  accepted: 'Invite accepted',
  expired:  'Invite expired',
};

// ── Static table columns (no component state needed) ───────────────────
const BASE_COLUMNS: TableColumn<AppUser>[] = [
  {
    key: 'name',
    header: 'Name / Email',
    render: (u) => (
      <div>
        <div className={styles.cellPrimary}>{u.name}</div>
        <div className={styles.cellMuted}>{u.email}</div>
        {u.lastLoginAt && (
          <div className={styles.cellMuted}>
            Last login: {new Date(u.lastLoginAt).toLocaleDateString('en-IN')}
          </div>
        )}
      </div>
    ),
  },
  { key: 'phone', header: 'Mobile' },
  {
    key: 'role',
    header: 'Role',
    render: (u) => (
      <Badge label={ROLE_LABEL[u.role]} variant={ROLE_VARIANT[u.role]} size="sm" />
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
    render: (u) => (
      <div>
        <StatusBadge status={u.status} statusMap={USER_STATUS_MAP} size="sm" />
        {u.status === 'Pending Setup' && (
          <div className={styles.inviteInfo}>
            {INVITE_STATUS_LABEL[u.invitationStatus]}
            {u.invitationSentAt && ` · ${new Date(u.invitationSentAt).toLocaleDateString('en-IN')}`}
          </div>
        )}
      </div>
    ),
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
  role:   'technician',
  branch: 'br-001',
};

interface FormErrors {
  name?:  string;
  email?: string;
  phone?: string;
}

// ── Component ──────────────────────────────────────────────────────────
export function UsersPage() {
  const toast = useToast();
  const { data: staffRes, isLoading, isError } = useGetUsersQuery();
  const users = staffRes?.data ?? [];
  const [createUser,    { isLoading: saving    }] = useCreateUserMutation();
  const [resendInvite,  { isLoading: resending }] = useResendInviteMutation();

  const [modalOpen,    setModal]        = useState(false);
  const [form,         setForm]         = useState<UserForm>(EMPTY_FORM);
  const [formErrors,   setFormErrors]   = useState<FormErrors>({});
  const [roleFilter,   setRoleFilter]   = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [search,       setSearch]       = useState('');

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter)   list = list.filter((u) => u.role === roleFilter);
    if (branchFilter) {
      const branchLabel = BRANCH_OPTIONS.find((b) => b.value === branchFilter)?.label ?? '';
      list = list.filter((u) => u.branch === branchLabel);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q)  ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q),
      );
    }
    return list;
  }, [users, roleFilter, branchFilter, search]);

  const handleResendInvite = useCallback(async (userId: string, userName: string) => {
    const result = await resendInvite({ userId });
    if ('data' in result) {
      toast.success(`Invite resent to ${userName}. A new setup link has been emailed.`);
    }
  }, [resendInvite, toast]);

  // Dynamic last column captures handleResendInvite and resending state
  const columns = useMemo<TableColumn<AppUser>[]>(() => [
    ...BASE_COLUMNS,
    {
      key: 'id',
      header: '',
      render: (u) => (
        u.status === 'Pending Setup' ? (
          <button
            className={styles.resendBtn}
            onClick={() => void handleResendInvite(u.id, u.name)}
            disabled={resending}
            title="Resend setup email"
          >
            Resend Invite
          </button>
        ) : null
      ),
    },
  ], [handleResendInvite, resending]);

  function setField(key: keyof UserForm, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    if (formErrors[key as keyof FormErrors]) {
      setFormErrors((e) => ({ ...e, [key]: undefined }));
    }
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim())  errs.name  = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';
    if (form.phone && !/^\d{10}$/.test(form.phone)) errs.phone = 'Enter a valid 10-digit mobile number';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function openModal() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setFormErrors({});
  }

  async function handleAdd() {
    if (!validate()) return;
    const payload: UserCreatePayload = {
      name:     form.name.trim(),
      email:    form.email.trim().toLowerCase(),
      phone:    form.phone.trim(),
      role:     form.role as AppRole,
      branchId: form.branch || null,
    };
    const result = await createUser(payload);
    if ('data' in result) {
      toast.success(`${form.name.trim()} added. A welcome email with login setup link will be sent.`);
      closeModal();
    }
  }

  const activeCount  = users.filter((u) => u.status === 'Active').length;
  const pendingCount = users.filter((u) => u.status === 'Pending Setup').length;

  return (
    <PageShell
      heading="Users"
      description="Manage staff accounts, roles and branch access."
      actions={
        <Button leftIcon={<UserPlus size={16} />} onClick={openModal}>
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
          <div className={styles.countGroup}>
            <span className={styles.count}>{users.length} total</span>
            <span className={styles.countSep}>·</span>
            <span className={styles.count}>{activeCount} active</span>
            {pendingCount > 0 && (
              <>
                <span className={styles.countSep}>·</span>
                <span className={`${styles.count} ${styles.countPending}`}>{pendingCount} pending setup</span>
              </>
            )}
          </div>

          <div className={styles.filters}>
            <div className={styles.searchWrap}>
              <Search size={13} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search name, email, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className={styles.filterSelect}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by role"
            >
              {ROLE_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              aria-label="Filter by branch"
            >
              {BRANCH_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading && <div className={styles.emptyState}>Loading users…</div>}
        {isError   && <div className={styles.emptyState}>Failed to load users.</div>}
        {!isLoading && !isError && (
          <>
            {filtered.length === 0 ? (
              <div className={styles.emptyState}>No users match the current filters.</div>
            ) : (
              <>
                {(roleFilter || branchFilter || search) && (
                  <div className={styles.filterBanner}>
                    Showing {filtered.length} of {users.length} users
                  </div>
                )}
                <DataTable columns={columns} data={filtered} />
              </>
            )}
          </>
        )}
      </SectionCard>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Add User"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleAdd} loading={saving}>
              Add User
            </Button>
          </div>
        }
      >
        <div className={styles.form}>
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            error={formErrors.name}
            fullWidth
            required
            autoFocus
          />
          <Input
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            error={formErrors.email}
            fullWidth
            required
          />
          <Input
            label="Mobile Number"
            type="tel"
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit mobile"
            error={formErrors.phone}
            fullWidth
          />
          <Select
            label="Role"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(e) => setField('role', e.target.value)}
          />
          <p className={styles.roleNote}>
            Only <strong>Technician</strong> is available — other roles are pending backend role alignment.
          </p>
          <Select
            label="Branch"
            options={BRANCH_OPTIONS}
            value={form.branch}
            onChange={(e) => setField('branch', e.target.value)}
          />
          <p className={styles.hint}>
            The account is created with <strong>Pending Setup</strong> status.
            A welcome email with a one-time login setup link will be sent — the admin never sets the password directly.
          </p>
        </div>
      </Modal>
    </PageShell>
  );
}
