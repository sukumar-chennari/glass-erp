import { useState, useMemo } from 'react';
import { Pencil, Users, AlertCircle } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { DataTable }     from '@/components/ui/DataTable';
import { StatusBadge }   from '@/components/ui/Badge';
import { Button }        from '@/components/ui/Button';
import { Input }         from '@/components/ui/Input';
import { Select }        from '@/components/ui/Select';
import { Modal }         from '@/components/ui/Modal';
import { useToast }      from '@/components/ui/Toast';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useAuth, useHasPermission } from '@/context/AuthContext';
import { useGetUsersQuery, useUpdateStaffMutation } from '@/features/settings/services/usersApi';
import type { AppUser, UserStatus } from '@/types/models/appUser';
import type { TableColumn, SelectOption } from '@/types/ui';
import styles from './StaffPage.module.css';

// ── Constants ──────────────────────────────────────────────────────────────────

const ACTIVE_OPTS: SelectOption[] = [
  { value: 'true',  label: 'Active'   },
  { value: 'false', label: 'Inactive' },
];

const STATUS_MAP: Record<UserStatus, { label: string; variant: 'success' | 'neutral' | 'warning' }> = {
  Active:          { label: 'Active',   variant: 'success' },
  Inactive:        { label: 'Inactive', variant: 'neutral' },
  'Pending Setup': { label: 'Pending',  variant: 'warning' },
};

function displayRole(role: string): string {
  switch (role) {
    case 'FRONTOFFICE':
    case 'operator':   return 'Front Office';
    case 'TECHNICIAN':
    case 'technician': return 'Technician';
    default:           return role;
  }
}

// ── Table columns ──────────────────────────────────────────────────────────────

const BASE_COLUMNS: TableColumn<AppUser>[] = [
  {
    key:    'name',
    header: 'Name',
    render: (u) => <span className={styles.staffName}>{u.name}</span>,
  },
  {
    key:    'phone',
    header: 'Phone',
    render: (u) => <span className={styles.staffPhone}>{u.phone || '—'}</span>,
  },
  {
    key:    'role',
    header: 'Role',
    render: (u) => (
      <span className={`${styles.roleBadge} ${
        (u.role === 'technician' || (u.role as string) === 'TECHNICIAN')
          ? styles.roleTech
          : styles.roleFront
      }`}>
        {displayRole(u.role as string)}
      </span>
    ),
  },
  {
    key:    'status',
    header: 'Status',
    render: (u) => <StatusBadge status={u.status} statusMap={STATUS_MAP} size="sm" />,
  },
];

// ── Form types ─────────────────────────────────────────────────────────────────

interface EditForm {
  name:     string;
  isActive: string; // 'true' | 'false' — string for Select value
}

interface EditFormErrors {
  name?: string;
}

const EMPTY_EDIT_FORM: EditForm = { name: '', isActive: 'true' };

// ── Component ──────────────────────────────────────────────────────────────────

export function StaffPage() {
  const toast    = useToast();
  const { session } = useAuth();
  const canWrite = useHasPermission('staff:write');

  const { data, isLoading, isError, refetch } = useGetUsersQuery();
  const [updateStaff, { isLoading: updating }] = useUpdateStaffMutation();

  const staff = data?.data ?? [];

  // ── Search ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');

  // ── Edit modal ────────────────────────────────────────────────────────
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget,    setEditTarget]    = useState<AppUser | null>(null);
  const [editForm,      setEditForm]      = useState<EditForm>(EMPTY_EDIT_FORM);
  const [editErrors,    setEditErrors]    = useState<EditFormErrors>({});

  // ── Filtered list ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return staff;
    const q = search.trim().toLowerCase();
    return staff.filter(
      (u) => u.name.toLowerCase().includes(q) || (u.phone ?? '').toLowerCase().includes(q),
    );
  }, [staff, search]);

  // ── Table columns (actions column added when canWrite) ─────────────────
  const columns = useMemo<TableColumn<AppUser>[]>(() => {
    if (!canWrite) return BASE_COLUMNS;
    return [
      ...BASE_COLUMNS,
      {
        key:    'id' as const,
        header: '',
        render: (u) => (
          <div className={styles.actions}>
            <button
              className={styles.actionBtn}
              onClick={() => openEdit(u)}
              title={`Edit ${u.name}`}
              aria-label={`Edit ${u.name}`}
            >
              <Pencil size={14} />
            </button>
          </div>
        ),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canWrite]);

  // ── Helpers ───────────────────────────────────────────────────────────
  function openEdit(u: AppUser) {
    setEditTarget(u);
    setEditForm({ name: u.name, isActive: String(u.isActive) });
    setEditErrors({});
    setEditModalOpen(true);
  }

  function closeEditModal() {
    setEditModalOpen(false);
    setEditTarget(null);
    setEditForm(EMPTY_EDIT_FORM);
    setEditErrors({});
  }

  function setEditField(key: keyof EditForm, val: string) {
    setEditForm((f) => ({ ...f, [key]: val }));
    if (key === 'name' && editErrors.name) setEditErrors((e) => ({ ...e, name: undefined }));
  }

  async function handleUpdate() {
    if (!editTarget) return;
    const errs: EditFormErrors = {};
    if (!editForm.name.trim()) errs.name = 'Name is required';
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const result = await updateStaff({
      id:       editTarget.id,
      name:     editForm.name.trim(),
      isActive: editForm.isActive === 'true',
    });
    if ('error' in result) {
      const err = result.error as { status?: unknown };
      if (err.status === 404) {
        toast.error('This staff member no longer exists.');
        closeEditModal();
        void refetch();
      } else {
        toast.error('Failed to update. Please try again.');
      }
      return;
    }
    toast.success(`${editForm.name.trim()} updated.`);
    closeEditModal();
  }

  const branchLabel = session?.branch?.name ?? null;

  return (
    <PageShell
      heading="Staff"
      description={`Manage front office and technician staff${branchLabel ? ` at ${branchLabel}` : ''}.`}
    >
      <SectionCard>
        {/* ── Toolbar ───────────────────────────────────────────────── */}
        <div className={styles.toolbar}>
          <Input
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.count}>
            {isLoading ? '' : `${filtered.length} member${filtered.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* ── States ────────────────────────────────────────────────── */}
        {isLoading && <TableSkeleton rows={5} cols={4} />}

        {isError && !isLoading && (
          <div className={styles.emptyState}>
            <AlertCircle size={32} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>Failed to load staff</p>
            <Button variant="secondary" size="sm" onClick={() => void refetch()}>Retry</Button>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className={styles.emptyState}>
            <Users size={32} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>No staff members found</p>
            <p className={styles.emptyDesc}>
              {search
                ? 'Try adjusting your search.'
                : 'Staff members will appear here once they have been onboarded.'}
            </p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <DataTable columns={columns} data={filtered} />
        )}
      </SectionCard>

      {/* ── Edit Staff Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={editModalOpen}
        onClose={closeEditModal}
        title="Edit Staff Member"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={closeEditModal}>Cancel</Button>
            <Button onClick={handleUpdate} loading={updating}>Save Changes</Button>
          </div>
        }
      >
        <div className={styles.form}>
          {editTarget?.phone && (
            <p className={styles.editContext}>
              Phone: <strong>{editTarget.phone}</strong>
            </p>
          )}
          <Input
            label="Full Name"
            value={editForm.name}
            onChange={(e) => setEditField('name', e.target.value)}
            error={editErrors.name}
            required
            fullWidth
            autoFocus
          />
          <Select
            label="Status"
            options={ACTIVE_OPTS}
            value={editForm.isActive}
            onChange={(e) => setEditField('isActive', e.target.value)}
          />
        </div>
      </Modal>
    </PageShell>
  );
}
