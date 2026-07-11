import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Layers, AlertCircle } from 'lucide-react';
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
  useGetCarModelsQuery,
  useCreateCarModelMutation,
  useUpdateCarModelMutation,
  useDeleteCarModelMutation,
} from '@/features/settings/services/carModelsApi';
import { useGetCarBrandsQuery } from '@/features/settings/services/carBrandsApi';
import type { CarModel, CarModelStatus } from '@/types/models/carModel';
import type { CarBrand } from '@/types/models/carBrand';
import type { TableColumn, SelectOption } from '@/types/ui';
import styles from './CarModelsPage.module.css';

// ── Constants ──────────────────────────────────────────────────────────
const STATUS_OPTS: SelectOption[] = [
  { value: 'ACTIVE',   label: 'Active'   },
  { value: 'INACTIVE', label: 'Inactive' },
];

const STATUS_FILTER_OPTS: SelectOption[] = [
  { value: '',         label: 'All statuses' },
  { value: 'ACTIVE',   label: 'Active'       },
  { value: 'INACTIVE', label: 'Inactive'     },
];

const STATUS_MAP: Record<CarModelStatus, { label: string; variant: 'success' | 'neutral' }> = {
  ACTIVE:   { label: 'Active',   variant: 'success' },
  INACTIVE: { label: 'Inactive', variant: 'neutral' },
};

// ── Form types ─────────────────────────────────────────────────────────
interface ModelForm {
  brand_id:     string;
  name:         string;
  compare_name: string;
  image:        string;
  status:       string;
}

interface FormErrors {
  brand_id?:     string;
  name?:         string;
  compare_name?: string;
}

const EMPTY_FORM: ModelForm = {
  brand_id:     '',
  name:         '',
  compare_name: '',
  image:        '',
  status:       'ACTIVE',
};

function toCompareName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function brandName(brands: CarBrand[], brand_id: string): string {
  return brands.find((b) => b.id === brand_id)?.name ?? '—';
}

// ── Component ──────────────────────────────────────────────────────────
export function CarModelsPage() {
  const toast = useToast();

  const { data: models = [], isLoading: modelsLoading, isError, refetch } = useGetCarModelsQuery();
  const { data: brands = [], isLoading: brandsLoading } = useGetCarBrandsQuery();

  const [createModel, { isLoading: creating }] = useCreateCarModelMutation();
  const [updateModel, { isLoading: updating }] = useUpdateCarModelMutation();
  const [deleteModel, { isLoading: deleting }] = useDeleteCarModelMutation();

  const isLoading = modelsLoading || brandsLoading;

  // ── Filter state ─────────────────────────────────────────────────────
  const [search,       setSearch]       = useState('');
  const [brandFilter,  setBrandFilter]  = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ── Modal state ──────────────────────────────────────────────────────
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<CarModel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CarModel | null>(null);
  const [form,         setForm]         = useState<ModelForm>(EMPTY_FORM);
  const [errors,       setErrors]       = useState<FormErrors>({});

  // ── Brand options for selects ─────────────────────────────────────────
  const brandOpts: SelectOption[] = useMemo(() => [
    ...brands.map((b) => ({ value: b.id, label: b.name })),
  ], [brands]);

  const brandFilterOpts: SelectOption[] = useMemo(() => [
    { value: '', label: 'All brands' },
    ...brands.map((b) => ({ value: b.id, label: b.name })),
  ], [brands]);

  // ── Filtered list (client-side until API supports search/filter) ──────
  const filtered = useMemo(() => {
    let list = models;
    if (brandFilter)   list = list.filter((m) => m.brand_id === brandFilter);
    if (statusFilter)  list = list.filter((m) => m.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.compare_name.toLowerCase().includes(q) ||
          brandName(brands, m.brand_id).toLowerCase().includes(q),
      );
    }
    return list;
  }, [models, brands, search, brandFilter, statusFilter]);

  // ── Table columns ─────────────────────────────────────────────────────
  const columns = useMemo<TableColumn<CarModel>[]>(() => [
    {
      key:    'brand_id',
      header: 'Brand',
      render: (m) => <span className={styles.brandCell}>{brandName(brands, m.brand_id)}</span>,
    },
    {
      key:    'name',
      header: 'Model Name',
      render: (m) => <span className={styles.modelName}>{m.name}</span>,
    },
    {
      key:    'compare_name',
      header: 'Compare Name',
      render: (m) => <span className={styles.compareName}>{m.compare_name}</span>,
    },
    {
      key:    'status',
      header: 'Status',
      render: (m) => <StatusBadge status={m.status} statusMap={STATUS_MAP} size="sm" />,
    },
    {
      key:    'id' as const,
      header: '',
      render: (m) => (
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => openEdit(m)}
            title={`Edit ${m.name}`}
            aria-label={`Edit ${m.name}`}
          >
            <Pencil size={14} />
          </button>
          <button
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            onClick={() => setDeleteTarget(m)}
            title={`Delete ${m.name}`}
            aria-label={`Delete ${m.name}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [brands]);

  // ── Form helpers ──────────────────────────────────────────────────────
  function set(key: keyof ModelForm, val: string) {
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
    if (!form.brand_id)            errs.brand_id     = 'Brand is required';
    if (!form.name.trim())         errs.name         = 'Model name is required';
    if (!form.compare_name.trim()) errs.compare_name = 'Compare name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Modal open/close ──────────────────────────────────────────────────
  function openAdd() {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, brand_id: brandFilter || '' });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(model: CarModel) {
    setEditTarget(model);
    setForm({
      brand_id:     model.brand_id,
      name:         model.name,
      compare_name: model.compare_name,
      image:        model.image ?? '',
      status:       model.status,
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

  // ── Save ──────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!validate()) return;

    const payload = {
      brand_id:     form.brand_id,
      name:         form.name.trim(),
      compare_name: form.compare_name.trim().toLowerCase(),
      image:        form.image.trim() || null,
      status:       form.status as CarModelStatus,
    };

    if (editTarget) {
      const result = await updateModel({ id: editTarget.id, ...payload });
      if ('data' in result) {
        toast.success(`Model "${payload.name}" updated.`);
        closeModal();
      } else {
        toast.error('Failed to update model. Please try again.');
      }
    } else {
      const result = await createModel(payload);
      if ('data' in result) {
        toast.success(`Model "${payload.name}" added.`);
        closeModal();
      } else {
        toast.error('Failed to add model. Please try again.');
      }
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    const { name, id } = deleteTarget;
    setDeleteTarget(null);
    const result = await deleteModel(id);
    if ('error' in result) {
      toast.error('Failed to delete model. Please try again.');
      return;
    }
    toast.success(`Model "${name}" deleted.`);
  }

  return (
    <PageShell
      heading="Car Models"
      description="Manage vehicle models available across job cards and insurance workflows."
      actions={
        <Button leftIcon={<Plus size={15} />} onClick={openAdd}>
          Add Model
        </Button>
      }
    >


      <SectionCard>
        {/* ── Toolbar ───────────────────────────────────────────────── */}
        <div className={styles.toolbar}>
          <Input
            placeholder="Search models…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <Select
            options={brandFilterOpts}
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            aria-label="Filter by brand"
          />
          <Select
            options={STATUS_FILTER_OPTS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          />
          <span className={styles.count}>
            {isLoading ? '' : `${filtered.length} model${filtered.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* ── States ────────────────────────────────────────────────── */}
        {isLoading && <TableSkeleton rows={6} cols={4} />}

        {isError && !isLoading && (
          <div className={styles.emptyState}>
            <AlertCircle size={32} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>Failed to load models</p>
            <Button variant="secondary" size="sm" onClick={() => void refetch()}>Retry</Button>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className={styles.emptyState}>
            <Layers size={32} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>No models found</p>
            <p className={styles.emptyDesc}>
              {search || brandFilter || statusFilter
                ? 'Try adjusting your search or filters.'
                : 'Add your first car model to get started.'}
            </p>
            {!search && !brandFilter && !statusFilter && (
              <Button leftIcon={<Plus size={14} />} size="sm" onClick={openAdd}>Add Model</Button>
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
        title={editTarget ? `Edit Model — ${editTarget.name}` : 'Add Car Model'}
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave} loading={creating || updating}>
              {editTarget ? 'Save Changes' : 'Add Model'}
            </Button>
          </div>
        }
      >
        <div className={styles.form}>
          <Select
            label="Brand"
            options={[{ value: '', label: 'Select a brand…' }, ...brandOpts]}
            value={form.brand_id}
            onChange={(e) => set('brand_id', e.target.value)}
            error={errors.brand_id}
          />
          <Input
            label="Model Name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Swift"
            error={errors.name}
            required
            fullWidth
            autoFocus
          />
          <Input
            label="Compare Name"
            value={form.compare_name}
            onChange={(e) => set('compare_name', e.target.value.toLowerCase())}
            placeholder="e.g. swift"
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
        title="Delete Model"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
          </div>
        }
      >
        <p className={styles.deleteMsg}>
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
          This cannot be undone.
        </p>
      </Modal>
    </PageShell>
  );
}
