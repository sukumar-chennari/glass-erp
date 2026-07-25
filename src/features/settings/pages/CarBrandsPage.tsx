import { useState, useMemo, useRef } from 'react';
import { Plus, Pencil, Trash2, Tag, AlertCircle, Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { DataTable }   from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { Button }      from '@/components/ui/Button';
import { Input }       from '@/components/ui/Input';
import { Select }      from '@/components/ui/Select';
import { Modal }            from '@/components/ui/Modal';
import { useToast }          from '@/components/ui/Toast';
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
  image?:        string;
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
export function CarBrandsPage() {
  const { t } = useTranslation(['settings', 'common']);
  const toast = useToast();

  // ── Filter state ──────────────────────────────────────────────────────
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: brands = [], isLoading, isError, refetch } = useGetCarBrandsQuery(
    statusFilter ? { status: statusFilter as CarBrandStatus } : undefined,
  );
  const [createBrand, { isLoading: creating }] = useCreateCarBrandMutation();
  const [updateBrand, { isLoading: updating }] = useUpdateCarBrandMutation();
  const [deleteBrand, { isLoading: deleting }] = useDeleteCarBrandMutation();

  // ── Modal state ──────────────────────────────────────────────────────
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<CarBrand | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CarBrand | null>(null);
  const [form,         setForm]         = useState<BrandForm>(EMPTY_FORM);
  const [errors,       setErrors]       = useState<FormErrors>({});
  const [urlInput,     setUrlInput]     = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Dropdown options ──────────────────────────────────────────────────
  const STATUS_OPTS = useMemo<SelectOption[]>(() => [
    { value: 'ACTIVE',   label: t('carBrands.statusLabels.active')   },
    { value: 'INACTIVE', label: t('carBrands.statusLabels.inactive') },
  ], [t]);

  const FILTER_OPTS = useMemo<SelectOption[]>(() => [
    { value: '',         label: t('carBrands.allStatuses')            },
    { value: 'ACTIVE',   label: t('carBrands.statusLabels.active')   },
    { value: 'INACTIVE', label: t('carBrands.statusLabels.inactive') },
  ], [t]);

  const STATUS_MAP = useMemo(() => ({
    ACTIVE:   { label: t('carBrands.statusLabels.active'),   variant: 'success' as const },
    INACTIVE: { label: t('carBrands.statusLabels.inactive'), variant: 'neutral' as const },
  }), [t]);

  // ── Filtered list ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return brands;
    const q = search.trim().toLowerCase();
    return brands.filter(
      (b) => b.name.toLowerCase().includes(q) || b.compare_name.toLowerCase().includes(q),
    );
  }, [brands, search]);

  // ── Table columns with actions ────────────────────────────────────────
  const columns = useMemo<TableColumn<CarBrand>[]>(() => [
    {
      key:    'name',
      header: t('carBrands.columns.brandName'),
      render: (b) => (
        <div className={styles.brandCell}>
          <div className={styles.brandThumbWrap}>
            {b.image && (
              <img
                src={b.image}
                alt={b.name}
                className={styles.brandThumb}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
          </div>
          <span className={styles.brandName}>{b.name}</span>
        </div>
      ),
    },
    {
      key:    'compare_name',
      header: t('carBrands.columns.companyName'),
      render: (b) => <span className={styles.compareName}>{b.compare_name}</span>,
    },
    {
      key:    'status',
      header: t('carBrands.columns.status'),
      render: (b) => <StatusBadge status={b.status} statusMap={STATUS_MAP} size="sm" />,
    },
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
  ], [t, STATUS_MAP]);

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
    if (!form.name.trim())         errs.name         = t('carBrands.modal.brandNameRequired');
    if (!form.compare_name.trim()) errs.compare_name = t('carBrands.modal.companyNameRequired');
    if (!form.image.trim()) {
      errs.image = t('carBrands.modal.imageRequired');
    } else {
      try { new URL(form.image.trim()); }
      catch { errs.image = t('carBrands.modal.imageInvalidUrl'); }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setUrlInput('');
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(brand: CarBrand) {
    setEditTarget(brand);
    setForm({
      name:         brand.name,
      compare_name: brand.compare_name,
      image:        brand.image ?? '',
      status:       brand.status,
    });
    setUrlInput(brand.image ?? '');
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

  async function handleSave() {
    if (!validate()) return;

    const payload = {
      name:         form.name.trim(),
      compare_name: form.compare_name.trim().toLowerCase(),
      image:        form.image.trim(),
      status:       form.status as CarBrandStatus,
    };

    if (editTarget) {
      const result = await updateBrand({ id: editTarget.id, ...payload });
      if ('data' in result) {
        toast.success(t('carBrands.toast.updated', { name: payload.name }));
        closeModal();
      } else {
        const err = result.error as { status?: number };
        if (err?.status === 404) {
          toast.error(t('carBrands.toast.notFound'));
          closeModal();
          void refetch();
        } else {
          const msg = extractApiError(result.error) ?? t('carBrands.toast.updateFailed');
          toast.error(msg);
        }
      }
    } else {
      const result = await createBrand(payload);
      if ('data' in result) {
        toast.success(t('carBrands.toast.added', { name: payload.name }));
        closeModal();
      } else {
        const msg = extractApiError(result.error) ?? t('carBrands.toast.addFailed');
        toast.error(msg);
      }
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { name, id } = deleteTarget;
    setDeleteTarget(null);
    const result = await deleteBrand(id);
    if ('error' in result) {
      const err = result.error as { status?: number };
      if (err?.status === 404) {
        toast.error(t('carBrands.toast.notFound'));
        void refetch();
      } else {
        toast.error(t('carBrands.toast.deleteFailed'));
      }
      return;
    }
    toast.success(t('carBrands.toast.deleted', { name }));
  }

  const brandCount = filtered.length;

  return (
    <PageShell
      heading={t('carBrands.heading')}
      description={t('carBrands.description')}
      actions={
        <Button leftIcon={<Plus size={15} />} onClick={openAdd}>
          {t('carBrands.actions.add')}
        </Button>
      }
    >
      <SectionCard>
        {/* ── Toolbar ───────────────────────────────────────────────── */}
        <div className={styles.toolbar}>
          <Input
            placeholder={t('carBrands.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <Select
            options={FILTER_OPTS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label={t('carBrands.allStatuses')}
          />
          <span className={styles.count}>
            {isLoading ? '' : t(`carBrands.count`, { count: brandCount })}
          </span>
        </div>

        {isLoading && <TableSkeleton rows={6} cols={3} />}

        {isError && !isLoading && (
          <div className={styles.emptyState}>
            <AlertCircle size={32} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>{t('carBrands.loadError')}</p>
            <Button variant="secondary" size="sm" onClick={() => void refetch()}>
              {t('carBrands.actions.retry')}
            </Button>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className={styles.emptyState}>
            <Tag size={32} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>{t('carBrands.emptyNoResults')}</p>
            <p className={styles.emptyDesc}>
              {search || statusFilter
                ? t('carBrands.emptyFilterHint')
                : t('carBrands.emptyNoData')}
            </p>
            {!search && !statusFilter && (
              <Button leftIcon={<Plus size={14} />} size="sm" onClick={openAdd}>
                {t('carBrands.actions.add')}
              </Button>
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
        title={editTarget ? t('carBrands.modal.editTitle', { name: editTarget.name }) : t('carBrands.modal.addTitle')}
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={closeModal}>{t('common:actions.cancel')}</Button>
            <Button onClick={handleSave} loading={creating || updating}>
              {editTarget ? t('carBrands.modal.save') : t('carBrands.modal.add')}
            </Button>
          </div>
        }
      >
        <div className={styles.form}>
          <Input
            label={t('carBrands.modal.brandName')}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder={t('carBrands.modal.brandNamePlaceholder')}
            error={errors.name}
            required
            fullWidth
            autoFocus
          />
          <Input
            label={t('carBrands.modal.companyName')}
            value={form.compare_name}
            onChange={(e) => set('compare_name', e.target.value.toLowerCase())}
            placeholder={t('carBrands.modal.companyNamePlaceholder')}
            hint={t('carBrands.modal.companyNameHint')}
            error={errors.compare_name}
            required
            fullWidth
          />
          {/* ── Image ─────────────────────────────────────── */}
          <div className={styles.imageSection}>
            {form.image && (
              <div className={styles.imagePreviewWrap}>
                <img
                  src={form.image}
                  alt="Brand preview"
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
              {t('carBrands.modal.uploadFromDevice')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <div className={styles.imageDivider}>{t('carBrands.modal.orPasteUrl')}</div>
            <Input
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://…"
              error={errors.image}
              fullWidth
            />
          </div>
          <Select
            label={t('carBrands.modal.status')}
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
        title={t('carBrands.modal.deleteTitle')}
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>{t('common:actions.cancel')}</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>{t('common:actions.delete')}</Button>
          </div>
        }
      >
        <p className={styles.deleteMsg}>
          {t('carBrands.modal.deleteMessage', { name: deleteTarget?.name ?? '' })}
        </p>
      </Modal>
    </PageShell>
  );
}
