import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
import type { AppUser, AppRole, UserStatus, UserCreatePayload } from '@/types/models/appUser';
import type { TableColumn, SelectOption } from '@/types/ui';
import { ROUTES } from '@/constants/routes';
import styles from './UsersPage.module.css';

// ── Constants ──────────────────────────────────────────────────────────
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

const BRANCH_OPTIONS: SelectOption[] = [
  { value: 'br-001', label: 'Banjara Hills'  },
  { value: 'br-002', label: 'Secunderabad'   },
  { value: 'br-003', label: 'Madhapur'       },
  { value: 'br-004', label: 'Kompally'       },
  { value: 'br-005', label: 'Mehdipatnam'    },
];

const USER_STATUS_MAP: Record<UserStatus, { label: string; variant: 'success' | 'neutral' | 'warning' }> = {
  'Active':        { label: 'Active',        variant: 'success' },
  'Inactive':      { label: 'Inactive',      variant: 'neutral' },
  'Pending Setup': { label: 'Pending Setup', variant: 'warning' },
};

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
  const { t } = useTranslation(['settings', 'common']);
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

  // ── Filter options ─────────────────────────────────────────────────
  const ROLE_FILTER_OPTIONS = useMemo<SelectOption[]>(() => [
    { value: '',               label: t('users.allRoles')                 },
    { value: 'super_admin',    label: t('users.roleLabels.super_admin')   },
    { value: 'branch_manager', label: t('users.roleLabels.branch_manager')},
    { value: 'operator',       label: t('users.roleLabels.operator')      },
    { value: 'technician',     label: t('users.roleLabels.technician')    },
  ], [t]);

  const BRANCH_FILTER_OPTIONS = useMemo<SelectOption[]>(() => [
    { value: '', label: t('users.allBranches') },
    ...BRANCH_OPTIONS,
  ], [t]);

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
      toast.success(t('users.toast.resent', { name: userName }));
    }
  }, [resendInvite, toast, t]);

  // ── Base columns (uses t for headers and role/invite labels) ───────
  const BASE_COLUMNS = useMemo<TableColumn<AppUser>[]>(() => [
    {
      key: 'name',
      header: t('users.columns.nameEmail'),
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
      header: t('users.columns.role'),
      render: (u) => (
        <Badge label={t(`users.roleLabels.${u.role}`)} variant={ROLE_VARIANT[u.role]} size="sm" />
      ),
    },
    {
      key: 'branch',
      header: t('users.columns.branch'),
      render: (u) => (
        <span className={u.branch ? undefined : styles.cellMuted}>
          {u.branch ?? '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('users.columns.status'),
      render: (u) => (
        <div>
          <StatusBadge status={u.status} statusMap={USER_STATUS_MAP} size="sm" />
          {u.status === 'Pending Setup' && (
            <div className={styles.inviteInfo}>
              {t(`users.inviteStatus.${u.invitationStatus}`)}
              {u.invitationSentAt && ` · ${new Date(u.invitationSentAt).toLocaleDateString('en-IN')}`}
            </div>
          )}
        </div>
      ),
    },
  ], [t]);

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
            {t('users.actions.resendInvite')}
          </button>
        ) : null
      ),
    },
  ], [BASE_COLUMNS, handleResendInvite, resending, t]);

  function setField(key: keyof UserForm, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    if (formErrors[key as keyof FormErrors]) {
      setFormErrors((e) => ({ ...e, [key]: undefined }));
    }
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim())  errs.name  = t('users.modal.nameRequired');
    if (!form.email.trim()) errs.email = t('users.modal.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t('users.modal.emailInvalid');
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
      toast.success(t('users.toast.invited', { email: payload.email }));
      closeModal();
    }
  }

  const activeCount  = users.filter((u) => u.status === 'Active').length;
  const pendingCount = users.filter((u) => u.status === 'Pending Setup').length;

  return (
    <PageShell
      heading={t('users.heading')}
      description={t('users.description')}
      actions={
        <Button leftIcon={<UserPlus size={16} />} onClick={openModal}>
          {t('users.actions.invite')}
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
                placeholder={t('users.searchPlaceholder')}
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
              <div className={styles.emptyState}>{t('users.emptyNoResults')}</div>
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
        title={t('users.modal.title')}
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={closeModal}>{t('common:actions.cancel')}</Button>
            <Button onClick={handleAdd} loading={saving}>
              {saving ? t('users.modal.submitting') : t('users.modal.submit')}
            </Button>
          </div>
        }
      >
        <div className={styles.form}>
          <Input
            label={t('users.modal.name')}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            error={formErrors.name}
            fullWidth
            required
            autoFocus
          />
          <Input
            label={t('users.modal.email')}
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
            label={t('users.modal.role')}
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(e) => setField('role', e.target.value)}
          />
          <p className={styles.roleNote}>
            Only <strong>Technician</strong> is available — other roles are pending backend role alignment.
          </p>
          <Select
            label={t('users.modal.branch')}
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
