import { useState, useMemo, useRef } from 'react';
import { Plus, Pencil, Trash2, Layers, AlertCircle, Upload, X } from 'lucide-react';
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
  image?:        string;
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

function getBrandName(brands: CarBrand[], brand_id: string): string {
  return brands.find((b) => b.id === brand_id)?.name ?? '—';
}

function extractApiError(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return null;
  const msg = (data as { message?: unknown }).message;
  if (!msg) return null;
  if (Array.isArray(msg)) return msg.join('; ');
  return typeof msg === 'string' ? msg : null;
}

// ── Component ──────────────────────────────────────────────────────────
export function CarModelsPage() {
  const toast = useToast();

  // ── Filter state (declared before query) ─────────────────────────────
  const [search,       setSearch]       = useState('');
  const [brandFilter,  setBrandFilter]  = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Server-side query args — undefined means no filter (avoids trailing ?)
  const queryArg = useMemo(() => {
    const args: { brandId?: string; status?: CarModelStatus } = {};
    if (brandFilter)  args.brandId = brandFilter;
    if (statusFilter) args.status  = statusFilter as CarModelStatus;
    return Object.keys(args).length > 0 ? args : undefined;
  }, [brandFilter, statusFilter]);

  const { data: models = [], isLoading: modelsLoading, isError, refetch } = useGetCarModelsQuery(queryArg);
  const { data: brands = [], isLoading: brandsLoading } = useGetCarBrandsQuery();

  const [createModel, { isLoading: creating }] = useCreateCarModelMutation();
  const [updateModel, { isLoading: updating }] = useUpdateCarModelMutation();
  const [deleteModel, { isLoading: deleting }] = useDeleteCarModelMutation();

  const isLoading = modelsLoading || brandsLoading;

  // ── Modal state ──────────────────────────────────────────────────────
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<CarModel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CarModel | null>(null);
  const [form,         setForm]         = useState<ModelForm>(EMPTY_FORM);
  const [errors,       setErrors]       = useState<FormErrors>({});
  // urlInput decouples the visible text field from form.image so a
  // file-upload data URI never appears as raw text in the input.
  const [urlInput,     setUrlInput]     = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Brand options for selects ─────────────────────────────────────────
  const brandOpts: SelectOption[] = useMemo(() => (
    brands.map((b) => ({ value: b.id, label: b.name }))
  ), [brands]);

  const brandFilterOpts: SelectOption[] = useMemo(() => [
    { value: '', label: 'All brands' },
    ...brands.map((b) => ({ value: b.id, label: b.name })),
  ], [brands]);

  // ── Client-side text search over server results ───────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return models;
    const q = search.trim().toLowerCase();
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.compare_name.toLowerCase().includes(q) ||
        getBrandName(brands, m.brand_id).toLowerCase().includes(q),
    );
  }, [models, brands, search]);

  // ── Table columns ─────────────────────────────────────────────────────
  const columns = useMemo<TableColumn<CarModel>[]>(() => [
    {
      key:    'brand_id',
      header: 'Brand',
      render: (m) => <span className={styles.brandCell}>{getBrandName(brands, m.brand_id)}</span>,
    },
    {
      key:    'name',
      header: 'Model Name',
      render: (m) => <span className={styles.modelName}>{m.name}</span>,
    },
    {
      key:    'compare_name',
      header: 'Company Name',
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

  function validate(isEdit: boolean): boolean {
    const errs: FormErrors = {};
    if (!form.brand_id)            errs.brand_id     = 'Brand is required';
    if (!form.name.trim())         errs.name         = 'Model name is required';
    if (!form.compare_name.trim()) errs.compare_name = 'Company name is required';
    if (!isEdit && !form.image)    errs.image        = 'Image is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Modal open/close ──────────────────────────────────────────────────
  function openAdd() {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, brand_id: brandFilter || '' });
    setUrlInput('');
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
    setUrlInput(model.image ?? '');
    setErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setUrlInput('');
    setErrors({});
  }

  // ── Image helpers ─────────────────────────────────────────────────────
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      set('image', ev.target?.result as string);
      setUrlInput('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleUrlChange(val: string) {
    setUrlInput(val);
    set('image', val);
  }

  // ── Save ──────────────────────────────────────────────────────────────
  async function handleSave() {
    const isEdit = editTarget !== null;
    if (!validate(isEdit)) return;

    const payload = {
      brand_id:     form.brand_id,
      name:         form.name.trim(),
      compare_name: form.compare_name.trim().toLowerCase(),
      image:        form.image || null,
      status:       form.status as CarModelStatus,
    };

    if (isEdit) {
      const result = await updateModel({ id: editTarget!.id, ...payload });
      if ('data' in result) {
        toast.success(`Model "${payload.name}" updated.`);
        closeModal();
      } else {
        const err = result.error as { status?: number };
        if (err?.status === 404) {
          toast.error('This car model no longer exists.');
          closeModal();
          void refetch();
        } else {
          const msg = extractApiError(result.error) ?? 'Failed to update model. Please try again.';
          toast.error(msg);
        }
      }
    } else {
      const result = await createModel(payload);
      if ('data' in result) {
        toast.success(`Model "${payload.name}" added.`);
        closeModal();
      } else {
        const err = result.error as { status?: number };
        if (err?.status === 400) {
          const msg = extractApiError(result.error) ?? 'Invalid request. Check the selected brand.';
          toast.error(msg);
        } else {
          const msg = extractApiError(result.error) ?? 'Failed to add model. Please try again.';
          toast.error(msg);
        }
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
      const err = result.error as { status?: number };
      if (err?.status === 404) {
        toast.error('This car model no longer exists.');
        void refetch();
      } else {
        toast.error('Failed to delete model. Please try again.');
      }
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
            label="Company Name"
            value={form.compare_name}
            onChange={(e) => set('compare_name', e.target.value.toLowerCase())}
            placeholder="e.g. swift"
            hint="Lowercase, used for search matching. Auto-filled from name."
            error={errors.compare_name}
            required
            fullWidth
          />
          {/* ── Image ─────────────────────────────────────────── */}
          <div className={styles.imageSection}>
            <label className={styles.imageLabel}>
              Image{!editTarget && <span className={styles.required}>*</span>}
            </label>
            {form.image && (
              <div className={styles.imagePreviewWrap}>
                <img
                  src={form.image}
                  alt="Model preview"
                  className={styles.imageThumb}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <button
                  type="button"
                  className={styles.clearImageBtn}
                  onClick={() => { set('image', ''); setUrlInput(''); }}
                  aria-label="Remove image"
                >
                  <X size={11} />
                </button>
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Upload size={14} />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload from device
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <div className={styles.imageDivider}>or paste a URL</div>
            <Input
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://…"
              error={errors.image}
              fullWidth
            />
          </div>
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
