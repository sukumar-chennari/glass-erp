import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Tag, AlertCircle } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { DataTable }   from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { Button }      from '@/components/ui/Button';
import { Input }       from '@/components/ui/Input';
import { Select }      from '@/components/ui/Select';
import { Modal }       from '@/components/ui/Modal';
import { useToast }    from '@/components/ui/Toast';
import { TableSkeleton } from '@/components/ui/Skeleton';
import {
  useGetCarBrandsQuery,
  useCreateCarBrandMutation,
  useUpdateCarBrandMutation,
  useDeleteCarBrandMutation,
} from '@/features/settings/services/carBrandsApi';
import type { CarBrand, CarBrandStatus } from '@/types/models/carBrand';
import type { TableColumn, SelectOption } from '@/types/ui';
import styles from './CarBrandsPage.module.css';

// ── Constants ──────────────────────────────────────────────────────────
const STATUS_OPTS: SelectOption[] = [
  { value: 'ACTIVE',   label: 'Active'   },
  { value: 'INACTIVE', label: 'Inactive' },
];

const FILTER_OPTS: SelectOption[] = [
  { value: '',         label: 'All statuses' },
  { value: 'ACTIVE',   label: 'Active'       },
  { value: 'INACTIVE', label: 'Inactive'     },
];

const STATUS_MAP: Record<CarBrandStatus, { label: string; variant: 'success' | 'neutral' }> = {
  ACTIVE:   { label: 'Active',   variant: 'success' },
  INACTIVE: { label: 'Inactive', variant: 'neutral' },
};

// ── Table columns ──────────────────────────────────────────────────────
const COLUMNS: TableColumn<CarBrand>[] = [
  {
    key:    'name',
    header: 'Brand Name',
    render: (b) => <span className={styles.brandName}>{b.name}</span>,
  },
  {
    key:    'compare_name',
    header: 'Compare Name',
    render: (b) => <span className={styles.compareName}>{b.compare_name}</span>,
  },
  {
    key:    'status',
    header: 'Status',
    render: (b) => <StatusBadge status={b.status} statusMap={STATUS_MAP} size="sm" />,
  },
];

// ── Form types ─────────────────────────────────────────────────────────
interface BrandForm {
  name:         string;
  compare_name: string;
  image:        string;
  status:       string;
}

interface FormErrors {
  name?:         string;
  compare_name?: string;
}

const EMPTY_FORM: BrandForm = {
  name:         '',
  compare_name: '',
  image:        '',
  status:       'ACTIVE',
};

function toCompareName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

// ── Component ──────────────────────────────────────────────────────────
export function CarBrandsPage() {
  const toast = useToast();

  const { data: brands = [], isLoading, isError, refetch } = useGetCarBrandsQuery();
  const [createBrand, { isLoading: creating }] = useCreateCarBrandMutation();
  const [updateBrand, { isLoading: updating }] = useUpdateCarBrandMutation();
  const [deleteBrand, { isLoading: deleting }] = useDeleteCarBrandMutation();

  // ── Filter state ─────────────────────────────────────────────────────
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ── Modal state ──────────────────────────────────────────────────────
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<CarBrand | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CarBrand | null>(null);
  const [form,         setForm]         = useState<BrandForm>(EMPTY_FORM);
  const [errors,       setErrors]       = useState<FormErrors>({});

  // ── Filtered list (client-side until API supports search/filter) ──────
  const filtered = useMemo(() => {
    let list = brands;
    if (statusFilter) list = list.filter((b) => b.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) => b.name.toLowerCase().includes(q) || b.compare_name.toLowerCase().includes(q),
      );
    }
    return list;
  }, [brands, search, statusFilter]);

  // ── Table columns with actions ────────────────────────────────────────
  const columns = useMemo<TableColumn<CarBrand>[]>(() => [
    ...COLUMNS,
    {
      key:    'id' as const,
      header: '',
      render: (b) => (
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => openEdit(b)}
            title={`Edit ${b.name}`}
            aria-label={`Edit ${b.name}`}
          >
            <Pencil size={14} />
          </button>
          <button
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            onClick={() => setDeleteTarget(b)}
            title={`Delete ${b.name}`}
            aria-label={`Delete ${b.name}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  // ── Form helpers ──────────────────────────────────────────────────────
  function set(key: keyof BrandForm, val: string) {
    setForm((f) => {
      const next = { ...f, [key]: val };
      if (key === 'name' && !f.compare_name) {
        next.compare_name = toCompareName(val);
      }
      return next;
    });
    if (errors[key as keyof FormErrors]) {
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim())         errs.name         = 'Brand name is required';
    if (!form.compare_name.trim()) errs.compare_name = 'Compare name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Add modal ─────────────────────────────────────────────────────────
  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  }

  // ── Edit modal ────────────────────────────────────────────────────────
  function openEdit(brand: CarBrand) {
    setEditTarget(brand);
    setForm({
      name:         brand.name,
      compare_name: brand.compare_name,
      image:        brand.image ?? '',
      status:       brand.status,
    });
    setErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setErrors({});
  }

  // ── Save (add or edit) ────────────────────────────────────────────────
  async function handleSave() {
    if (!validate()) return;

    const payload = {
      name:         form.name.trim(),
      compare_name: form.compare_name.trim().toLowerCase(),
      image:        form.image.trim() || null,
      status:       form.status as CarBrandStatus,
    };

    if (editTarget) {
      const result = await updateBrand({ id: editTarget.id, ...payload });
      if ('data' in result) {
        toast.success(`Brand "${payload.name}" updated.`);
        closeModal();
      } else {
        toast.error('Failed to update brand. Please try again.');
      }
    } else {
      const result = await createBrand(payload);
      if ('data' in result) {
        toast.success(`Brand "${payload.name}" added.`);
        closeModal();
      } else {
        toast.error('Failed to add brand. Please try again.');
      }
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    const { name, id } = deleteTarget;
    setDeleteTarget(null);
    const result = await deleteBrand(id);
    if ('error' in result) {
      toast.error('Failed to delete brand. Please try again.');
      return;
    }
    toast.success(`Brand "${name}" deleted.`);
  }

  return (
    <PageShell
      heading="Car Brands"
      description="Manage vehicle brands available across job cards and insurance workflows."
      actions={
        <Button leftIcon={<Plus size={15} />} onClick={openAdd}>
          Add Brand
        </Button>
      }
    >


      <SectionCard>
        {/* ── Toolbar ───────────────────────────────────────────────── */}
        <div className={styles.toolbar}>
          <Input
            placeholder="Search brands…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <Select
            options={FILTER_OPTS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          />
          <span className={styles.count}>
            {isLoading ? '' : `${filtered.length} brand${filtered.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* ── States ────────────────────────────────────────────────── */}
        {isLoading && <TableSkeleton rows={6} cols={3} />}

        {isError && !isLoading && (
          <div className={styles.emptyState}>
            <AlertCircle size={32} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>Failed to load brands</p>
            <Button variant="secondary" size="sm" onClick={() => void refetch()}>Retry</Button>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className={styles.emptyState}>
            <Tag size={32} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>No brands found</p>
            <p className={styles.emptyDesc}>
              {search || statusFilter ? 'Try adjusting your search or filter.' : 'Add your first car brand to get started.'}
            </p>
            {!search && !statusFilter && (
              <Button leftIcon={<Plus size={14} />} size="sm" onClick={openAdd}>Add Brand</Button>
            )}
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <DataTable columns={columns} data={filtered} />
        )}
      </SectionCard>

      {/* ── Add / Edit Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editTarget ? `Edit Brand — ${editTarget.name}` : 'Add Car Brand'}
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave} loading={creating || updating}>
              {editTarget ? 'Save Changes' : 'Add Brand'}
            </Button>
          </div>
        }
      >
        <div className={styles.form}>
          <Input
            label="Brand Name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Maruti Suzuki"
            error={errors.name}
            required
            fullWidth
            autoFocus
          />
          <Input
            label="Compare Name"
            value={form.compare_name}
            onChange={(e) => set('compare_name', e.target.value.toLowerCase())}
            placeholder="e.g. maruti suzuki"
            hint="Lowercase, used for search matching. Auto-filled from name."
            error={errors.compare_name}
            required
            fullWidth
          />
          <Input
            label="Image URL"
            value={form.image}
            onChange={(e) => set('image', e.target.value)}
            placeholder="https://… (optional)"
            fullWidth
          />
          <Select
            label="Status"
            options={STATUS_OPTS}
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
          />
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ─────────────────────────────────── */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Brand"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
          </div>
        }
      >
        <p className={styles.deleteMsg}>
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
          Any models under this brand will lose their brand association.
        </p>
      </Modal>
    </PageShell>
  );
}
