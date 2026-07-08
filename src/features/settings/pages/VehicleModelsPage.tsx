import { useState, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2, Car } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { DataTable }   from '@/components/ui/DataTable';
import { Button }      from '@/components/ui/Button';
import { Input }       from '@/components/ui/Input';
import { Select }      from '@/components/ui/Select';
import { Modal }       from '@/components/ui/Modal';
import { Drawer }      from '@/components/ui/Drawer';
import { useToast }    from '@/components/ui/Toast';
import {
  useGetVehicleModelsQuery,
  useCreateVehicleModelMutation,
  useUpdateVehicleModelMutation,
  useDeleteVehicleModelMutation,
} from '@/features/settings/services/vehicleModelsApi';
import type { VehicleModel, VehicleModelPayload } from '@/types/models/vehicleModel';
import { BRANDS, BRAND_MODEL_MAP } from '@/types/models/vehicleModel';
import type { TableColumn, SelectOption } from '@/types/ui';
import { formatINR } from '@/services/mockUtils';
import styles from './VehicleModelsPage.module.css';

// ── Dropdown options ────────────────────────────────────────────────
const BRAND_OPTIONS: SelectOption[] = [
  { value: '', label: 'Select brand', disabled: true },
  ...BRANDS.map((b) => ({ value: b, label: b })),
];

// ── Form state ──────────────────────────────────────────────────────
interface ModelForm {
  brand:       string;
  model:       string;
  marketPrice: string;
}

interface FormErrors {
  brand?:       string;
  model?:       string;
  marketPrice?: string;
}

const EMPTY_FORM: ModelForm = { brand: '', model: '', marketPrice: '' };

function vehicleToForm(v: VehicleModel): ModelForm {
  return { brand: v.brand, model: v.model, marketPrice: String(v.marketPrice) };
}

// ── Component ───────────────────────────────────────────────────────
export function VehicleModelsPage() {
  const toast = useToast();
  const { data: models = [], isLoading, isError } = useGetVehicleModelsQuery();
  const [createModel, { isLoading: creating }] = useCreateVehicleModelMutation();
  const [updateModel, { isLoading: updating }] = useUpdateVehicleModelMutation();
  const [deleteModel, { isLoading: deleting }] = useDeleteVehicleModelMutation();

  // ── Drawer state ──────────────────────────────────────────────────
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [drawerMode,  setDrawerMode]  = useState<'add' | 'edit'>('add');
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [form,        setForm]        = useState<ModelForm>(EMPTY_FORM);
  const [formErrors,  setFormErrors]  = useState<FormErrors>({});

  // ── Delete state ──────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<VehicleModel | null>(null);

  // ── Model options (dependent on brand) ───────────────────────────
  const modelOptions = useMemo<SelectOption[]>(() => {
    if (!form.brand) return [{ value: '', label: 'Select model', disabled: true }];
    const list = BRAND_MODEL_MAP[form.brand] ?? [];
    return [
      { value: '', label: 'Select model', disabled: true },
      ...list.map((m) => ({ value: m, label: m })),
    ];
  }, [form.brand]);

  // ── Handlers ──────────────────────────────────────────────────────
  const openAdd = useCallback(() => {
    setDrawerMode('add');
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setDrawerOpen(true);
  }, []);

  const openEdit = useCallback((vehicle: VehicleModel) => {
    setDrawerMode('edit');
    setEditingId(vehicle.id);
    setForm(vehicleToForm(vehicle));
    setFormErrors({});
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  function setField<K extends keyof ModelForm>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    if (key in formErrors) setFormErrors((e) => { const n = { ...e }; delete n[key as keyof FormErrors]; return n; });
  }

  // When brand changes, reset model
  function handleBrandChange(brand: string) {
    setForm((f) => ({ ...f, brand, model: '' }));
    setFormErrors((e) => ({ ...e, brand: undefined, model: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.brand)  errs.brand = 'Please select a brand';
    if (!form.model)  errs.model = 'Please select a model';
    const price = Number(form.marketPrice);
    if (!form.marketPrice.trim() || isNaN(price) || price <= 0) {
      errs.marketPrice = 'Enter a valid market price (greater than 0)';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    const payload: VehicleModelPayload = {
      brand:       form.brand,
      model:       form.model,
      marketPrice: Number(form.marketPrice),
    };
    try {
      if (drawerMode === 'add') {
        await createModel(payload).unwrap();
        toast.success(`${form.brand} ${form.model} added.`);
      } else if (editingId) {
        await updateModel({ id: editingId, ...payload }).unwrap();
        toast.success(`${form.brand} ${form.model} updated.`);
      }
      closeDrawer();
    } catch {
      toast.error('Failed to save model. Please try again.');
    }
  }, [form, drawerMode, editingId, createModel, updateModel, toast, closeDrawer]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteModel(deleteTarget.id).unwrap();
      toast.success(`${deleteTarget.brand} ${deleteTarget.model} removed.`);
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete model. Please try again.');
    }
  }, [deleteTarget, deleteModel, toast]);

  // ── Table columns ─────────────────────────────────────────────────
  const columns = useMemo<TableColumn<VehicleModel>[]>(() => [
    {
      key:    'brand',
      header: 'Brand',
      render: (v) => <span className={styles.brand}>{v.brand}</span>,
    },
    {
      key:    'model',
      header: 'Model',
      render: (v) => <span className={styles.model}>{v.model}</span>,
    },
    {
      key:    'marketPrice',
      header: 'Market Price',
      align:  'right',
      render: (v) => <span className={styles.price}>{formatINR(v.marketPrice)}</span>,
    },
    {
      key:    'id',
      header: '',
      width:  '90px',
      render: (v) => (
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => openEdit(v)}
            title="Edit"
            aria-label={`Edit ${v.brand} ${v.model}`}
          >
            <Pencil size={14} />
          </button>
          <button
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            onClick={() => setDeleteTarget(v)}
            title="Delete"
            aria-label={`Delete ${v.brand} ${v.model}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ], [openEdit]);

  const isSaving = creating || updating;

  return (
    <>
      <PageShell
        heading="Vehicle Models"
        description="Maintain the list of vehicle brands, models, and their market prices for claim assessments."
        actions={<Button leftIcon={<Plus size={15} />} onClick={openAdd}>Add Model</Button>}
      >
      <SectionCard>
        {isLoading && <div className={styles.state}>Loading vehicle models…</div>}
        {isError   && <div className={styles.state}>Failed to load vehicle models.</div>}
        {!isLoading && !isError && models.length === 0 && (
          <div className={styles.emptyState}>
            <Car className={styles.emptyIcon} size={40} strokeWidth={1.2} />
            <p className={styles.emptyTitle}>No vehicle models yet</p>
            <p className={styles.emptyDesc}>
              Add vehicle models with market prices to support insurance claim valuations.
            </p>
            <Button leftIcon={<Plus size={15} />} onClick={openAdd}>Add First Model</Button>
          </div>
        )}
        {!isLoading && !isError && models.length > 0 && (
          <DataTable columns={columns} data={models} />
        )}
      </SectionCard>
      </PageShell>

      {/* ── Add / Edit Drawer ──────────────────────────────────────── */}
      <Drawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title={drawerMode === 'add' ? 'Add Vehicle Model' : 'Edit Vehicle Model'}
        footer={
          <>
            <Button variant="ghost" onClick={closeDrawer}>Cancel</Button>
            <Button onClick={handleSave} loading={isSaving}>Save Model</Button>
          </>
        }
      >
        <Select
          label="Brand"
          options={BRAND_OPTIONS}
          value={form.brand}
          onChange={(e) => handleBrandChange(e.target.value)}
          error={formErrors.brand}
        />
        <Select
          label="Model"
          options={modelOptions}
          value={form.model}
          onChange={(e) => setField('model', e.target.value)}
          error={formErrors.model}
          disabled={!form.brand}
        />
        <Input
          label="Market Price (₹)"
          type="number"
          min={1}
          value={form.marketPrice}
          onChange={(e) => setField('marketPrice', e.target.value)}
          error={formErrors.marketPrice}
          placeholder="e.g. 850000"
          hint="Ex-showroom market price used for claim valuation"
          fullWidth
        />
      </Drawer>

      {/* ── Delete confirmation ────────────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Vehicle Model?"
        maxWidth="420px"
        footer={
          <div className={styles.deleteFooter}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} loading={deleting}>
              Delete Model
            </Button>
          </div>
        }
      >
        {deleteTarget && (
          <p className={styles.deleteMsg}>
            Are you sure you want to remove{' '}
            <strong>{deleteTarget.brand} {deleteTarget.model}</strong> from the vehicle list?
            This action cannot be undone.
          </p>
        )}
      </Modal>
    </>
  );
}
