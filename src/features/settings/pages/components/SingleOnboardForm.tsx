import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useGetCarBrandsQuery } from '@/features/settings/services/carBrandsApi';
import { useGetCarModelsQuery } from '@/features/settings/services/carModelsApi';
import {
  useGetVariantsQuery,
  useGetGlassTypesQuery,
  useGetDescriptionsQuery,
} from '@/services/catalogApi';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import styles from './SingleOnboardForm.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

type FieldMode = 'select' | 'manual';

interface FormValues {
  brandMode: FieldMode;     brandId: string;      brandManual: string;
  modelMode: FieldMode;     modelId: string;      modelManual: string;
  bodyTypeValue: string;
  ccValue: string;
  variantMode: FieldMode;   variantId: string;    variantManual: string;
  periodValue: string;
  glassTypeMode: FieldMode; glassTypeId: string;  glassTypeManual: string;
  descMode: FieldMode;      descSelected: string; descManual: string;
  priceAIS: string; priceSG: string;  pricePK: string;
  priceBenson: string; priceFY: string; priceOthers: string;
}

type FormErrors = Partial<Record<
  'brand' | 'model' | 'bodyType' | 'cc' | 'variant' | 'period' |
  'glassType' | 'priceAIS' | 'priceSG' | 'pricePK' | 'priceBenson' |
  'priceFY' | 'priceOthers' | 'prices',
  string
>>;

const INITIAL: FormValues = {
  brandMode: 'select', brandId: '', brandManual: '',
  modelMode: 'select', modelId: '', modelManual: '',
  bodyTypeValue: '', ccValue: '',
  variantMode: 'select', variantId: '', variantManual: '',
  periodValue: '',
  glassTypeMode: 'select', glassTypeId: '', glassTypeManual: '',
  descMode: 'select', descSelected: '', descManual: '',
  priceAIS: '', priceSG: '', pricePK: '', priceBenson: '', priceFY: '', priceOthers: '',
};

// ── Validation ────────────────────────────────────────────────────────────────

type PriceKey = 'priceAIS' | 'priceSG' | 'pricePK' | 'priceBenson' | 'priceFY' | 'priceOthers';

const PRICE_FIELDS: Array<{ key: PriceKey; label: string }> = [
  { key: 'priceAIS',    label: 'AIS' },
  { key: 'priceSG',     label: 'Saint-Gobain' },
  { key: 'pricePK',     label: 'PK' },
  { key: 'priceBenson', label: 'Benson' },
  { key: 'priceFY',     label: 'FY' },
  { key: 'priceOthers', label: 'Others' },
];

function validate(form: FormValues): FormErrors {
  const e: FormErrors = {};

  if (form.brandMode === 'select' ? !form.brandId : !form.brandManual.trim())
    e.brand = 'Car brand is required';
  if (form.modelMode === 'select' ? !form.modelId : !form.modelManual.trim())
    e.model = 'Model is required';
  if (!form.bodyTypeValue.trim()) e.bodyType = 'Body type is required';
  if (!form.ccValue.trim()) {
    e.cc = 'CC is required';
  } else if (isNaN(Number(form.ccValue)) || Number(form.ccValue) < 0) {
    e.cc = 'Must be a non-negative number';
  }
  if (form.variantMode === 'select' ? !form.variantId : !form.variantManual.trim())
    e.variant = 'Variant is required';
  if (!form.periodValue.trim()) e.period = 'Period / generation is required';
  if (form.glassTypeMode === 'select' ? !form.glassTypeId : !form.glassTypeManual.trim())
    e.glassType = 'Glass type is required';

  let anyPriceErr = false;
  for (const { key, label } of PRICE_FIELDS) {
    const raw = form[key].trim();
    if (!raw) continue;
    const n = Number(raw);
    if (isNaN(n)) { (e as Record<string, string>)[key] = `${label}: must be a number`; anyPriceErr = true; }
    else if (n < 0) { (e as Record<string, string>)[key] = `${label}: cannot be negative`; anyPriceErr = true; }
  }
  if (!anyPriceErr && !PRICE_FIELDS.some(({ key }) => form[key].trim()))
    e.prices = 'At least one brand price is required';

  return e;
}

// ── Sub-components ────────────────────────────────────────────────────────────

// Segmented pill — sits inline with the field label
function ModePill({
  mode, onToggle,
}: { mode: FieldMode; onToggle: () => void }) {
  return (
    <div className={styles.modePill} role="group" aria-label="Input mode">
      <button
        type="button"
        className={`${styles.modePillBtn} ${mode === 'select' ? styles.modePillActive : ''}`}
        onClick={() => mode !== 'select' && onToggle()}
        aria-pressed={mode === 'select'}
      >
        Existing
      </button>
      <button
        type="button"
        className={`${styles.modePillBtn} ${mode === 'manual' ? styles.modePillActive : ''}`}
        onClick={() => mode !== 'manual' && onToggle()}
        aria-pressed={mode === 'manual'}
      >
        New
      </button>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? <span className={styles.fieldError}>{msg}</span> : null;
}

function AutoFillBadge({ show, text = 'Auto-filled' }: { show: boolean; text?: string }) {
  return show ? <span className={styles.autoFill}>✦ {text}</span> : null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SingleOnboardForm() {
  const toast = useToast();
  const [form, setForm] = useState<FormValues>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const effectiveBrandId   = form.brandMode   === 'select' ? form.brandId    : '';
  const effectiveModelId   = form.modelMode   === 'select' ? form.modelId    : '';
  const effectiveVariantId = form.variantMode === 'select' ? form.variantId  : '';
  const effectiveGlassId   = form.glassTypeMode === 'select' ? form.glassTypeId : '';

  const { data: brands,     isLoading: brandsLoading,   isError: brandsErr   } =
    useGetCarBrandsQuery({ status: 'ACTIVE' });
  const { data: models,     isLoading: modelsLoading,   isError: modelsErr   } =
    useGetCarModelsQuery({ brandId: effectiveBrandId, status: 'ACTIVE' }, { skip: !effectiveBrandId });
  const { data: variants,   isLoading: variantsLoading, isError: variantsErr } =
    useGetVariantsQuery({ modelId: effectiveModelId }, { skip: !effectiveModelId });
  const { data: glassTypes, isLoading: glassLoading,    isError: glassErr    } =
    useGetGlassTypesQuery({ variantId: effectiveVariantId }, { skip: !effectiveVariantId });
  const { data: descriptions, isLoading: descLoading } =
    useGetDescriptionsQuery(
      { variantId: effectiveVariantId, glassPartTypeId: effectiveGlassId },
      { skip: !effectiveVariantId || !effectiveGlassId },
    );

  useEffect(() => {
    if (submitted) setErrors(validate(form));
  }, [form, submitted]);

  function patch(partial: Partial<FormValues>) {
    setForm(prev => ({ ...prev, ...partial }));
  }

  // ── Cascade reset fragments ──
  const RESET_GLASS:   Partial<FormValues> = { descSelected: '', descManual: '' };
  const RESET_VARIANT: Partial<FormValues> = { glassTypeId: '', glassTypeManual: '', ...RESET_GLASS };
  const RESET_MODEL:   Partial<FormValues> = { variantId: '', variantManual: '', periodValue: '', ...RESET_VARIANT };
  const RESET_BRAND:   Partial<FormValues> = { modelId: '', modelManual: '', bodyTypeValue: '', ccValue: '', ...RESET_MODEL };

  // ── Brand ──
  function handleBrandSelect(id: string) {
    patch({ brandId: id, ...RESET_BRAND, modelId: '', modelManual: '' });
  }
  function toggleBrandMode() {
    const toManual = form.brandMode === 'select';
    patch({
      brandMode: toManual ? 'manual' : 'select', brandId: '', brandManual: '',
      ...(toManual
        ? { modelMode: 'manual', variantMode: 'manual', glassTypeMode: 'manual' }
        : { modelMode: 'select', variantMode: 'select', glassTypeMode: 'select' }),
      ...RESET_BRAND,
    });
  }

  // ── Model ──
  function handleModelSelect(id: string) {
    const m = models?.find(x => x.id === id);
    patch({
      modelId: id,
      bodyTypeValue: m?.bodyType[0] ?? '',
      ccValue: m?.cc != null ? String(m.cc) : '',
      ...RESET_MODEL,
    });
  }
  function toggleModelMode() {
    const toManual = form.modelMode === 'select';
    patch({
      modelMode: toManual ? 'manual' : 'select', modelId: '', modelManual: '',
      bodyTypeValue: '', ccValue: '',
      ...(toManual
        ? { variantMode: 'manual', glassTypeMode: 'manual' }
        : { variantMode: 'select', glassTypeMode: 'select' }),
      ...RESET_MODEL,
    });
  }

  // ── Variant ──
  function handleVariantSelect(id: string) {
    const v = variants?.find(x => x.id === id);
    patch({ variantId: id, periodValue: v?.period ?? '', ...RESET_VARIANT });
  }
  function toggleVariantMode() {
    const toManual = form.variantMode === 'select';
    patch({
      variantMode: toManual ? 'manual' : 'select', variantId: '', variantManual: '', periodValue: '',
      ...(toManual ? { glassTypeMode: 'manual' } : { glassTypeMode: 'select' }),
      ...RESET_VARIANT,
    });
  }

  // ── Glass type ──
  function handleGlassTypeSelect(id: string) {
    patch({ glassTypeId: id, ...RESET_GLASS });
  }
  function toggleGlassTypeMode() {
    patch({
      glassTypeMode: form.glassTypeMode === 'select' ? 'manual' : 'select',
      glassTypeId: '', glassTypeManual: '', ...RESET_GLASS,
    });
  }

  // ── Submit ──
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    toast.info('Form validated. Single entry submission API is not yet configured — connect the backend endpoint to enable saving.');
  }
  function handleReset() { setForm(INITIAL); setErrors({}); setSubmitted(false); }

  // ── Derived ──
  const selectedModel  = models?.find(m => m.id === form.modelId);
  const modelBodyTypes = selectedModel?.bodyType ?? [];
  const showBodySelect = form.modelMode === 'select' && !!form.modelId && modelBodyTypes.length > 0;
  const descHasOpts    = (descriptions?.length ?? 0) > 0;
  const showDescSelect = form.descMode === 'select' && descHasOpts;

  // ── Shared select placeholder helper ──
  function selectPlaceholder(opts: { loading?: boolean; error?: boolean; upstream?: string; defaultLabel: string }) {
    if (opts.upstream) return opts.upstream;
    if (opts.loading)  return 'Loading…';
    if (opts.error)    return 'Failed to load — try "New"';
    return opts.defaultLabel;
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>

      {/* ══ Section 1: Vehicle Details ══════════════════════════════════════ */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>01</span>
          <span className={styles.sectionLabel}>Vehicle Details</span>
        </div>

        <div className={styles.grid2}>

          {/* Brand */}
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Car Brand <span className={styles.req}>*</span></label>
              <ModePill mode={form.brandMode} onToggle={toggleBrandMode} />
            </div>
            {form.brandMode === 'select' ? (
              <select
                className={`${styles.control} ${errors.brand ? styles.hasErr : ''}`}
                value={form.brandId} onChange={e => handleBrandSelect(e.target.value)}
                disabled={brandsLoading}
              >
                <option value="">{selectPlaceholder({ loading: brandsLoading, error: brandsErr, defaultLabel: 'Select brand' })}</option>
                {brands?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            ) : (
              <input className={`${styles.control} ${errors.brand ? styles.hasErr : ''}`}
                type="text" placeholder="e.g. Maruti Suzuki"
                value={form.brandManual} onChange={e => patch({ brandManual: e.target.value })} maxLength={80} />
            )}
            <FieldError msg={errors.brand} />
          </div>

          {/* Model */}
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Model <span className={styles.req}>*</span></label>
              <ModePill mode={form.modelMode} onToggle={toggleModelMode} />
            </div>
            {form.modelMode === 'select' ? (
              <select
                className={`${styles.control} ${errors.model ? styles.hasErr : ''}`}
                value={form.modelId} onChange={e => handleModelSelect(e.target.value)}
                disabled={!effectiveBrandId || modelsLoading}
              >
                <option value="">{selectPlaceholder({
                  upstream: !effectiveBrandId ? 'Select brand first' : undefined,
                  loading: modelsLoading, error: modelsErr, defaultLabel: 'Select model',
                })}</option>
                {models?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            ) : (
              <input className={`${styles.control} ${errors.model ? styles.hasErr : ''}`}
                type="text" placeholder="e.g. Swift"
                value={form.modelManual} onChange={e => patch({ modelManual: e.target.value })} maxLength={80} />
            )}
            <FieldError msg={errors.model} />
          </div>

          {/* Body Type */}
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Body Type <span className={styles.req}>*</span></label>
              <AutoFillBadge show={showBodySelect} text="from model" />
            </div>
            {showBodySelect ? (
              <select className={`${styles.control} ${errors.bodyType ? styles.hasErr : ''}`}
                value={form.bodyTypeValue} onChange={e => patch({ bodyTypeValue: e.target.value })}>
                <option value="">Select body type</option>
                {modelBodyTypes.map(bt => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            ) : (
              <input className={`${styles.control} ${errors.bodyType ? styles.hasErr : ''}`}
                type="text" placeholder="e.g. LMV"
                value={form.bodyTypeValue} onChange={e => patch({ bodyTypeValue: e.target.value })} maxLength={40} />
            )}
            <FieldError msg={errors.bodyType} />
          </div>

          {/* CC */}
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>CC <span className={styles.req}>*</span></label>
              <AutoFillBadge show={form.modelMode === 'select' && selectedModel?.cc != null} text="from model" />
            </div>
            <input className={`${styles.control} ${errors.cc ? styles.hasErr : ''}`}
              type="number" min="0" step="1" placeholder="e.g. 1197"
              value={form.ccValue} onChange={e => patch({ ccValue: e.target.value })} />
            <FieldError msg={errors.cc} />
          </div>

          {/* Variant */}
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Variant / Type <span className={styles.req}>*</span></label>
              <ModePill mode={form.variantMode} onToggle={toggleVariantMode} />
            </div>
            {form.variantMode === 'select' ? (
              <select
                className={`${styles.control} ${errors.variant ? styles.hasErr : ''}`}
                value={form.variantId} onChange={e => handleVariantSelect(e.target.value)}
                disabled={!effectiveModelId || variantsLoading}
              >
                <option value="">{selectPlaceholder({
                  upstream: !effectiveModelId ? 'Select model first' : undefined,
                  loading: variantsLoading, error: variantsErr, defaultLabel: 'Select variant',
                })}</option>
                {variants?.map(v => <option key={v.id} value={v.id}>{v.variantName}</option>)}
              </select>
            ) : (
              <input className={`${styles.control} ${errors.variant ? styles.hasErr : ''}`}
                type="text" placeholder="e.g. VXI MT"
                value={form.variantManual} onChange={e => patch({ variantManual: e.target.value })} maxLength={100} />
            )}
            <FieldError msg={errors.variant} />
          </div>

          {/* Period */}
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Period / Generation <span className={styles.req}>*</span></label>
              <AutoFillBadge show={form.variantMode === 'select' && !!form.variantId} text="from variant" />
            </div>
            <input className={`${styles.control} ${errors.period ? styles.hasErr : ''}`}
              type="text" placeholder="e.g. 2018–2022"
              value={form.periodValue} onChange={e => patch({ periodValue: e.target.value })} maxLength={40} />
            <FieldError msg={errors.period} />
          </div>

        </div>
      </div>

      {/* ══ Section 2: Glass Details ═════════════════════════════════════════ */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>02</span>
          <span className={styles.sectionLabel}>Glass Details</span>
        </div>

        <div className={styles.grid2}>

          {/* Glass Type */}
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>Glass Type <span className={styles.req}>*</span></label>
              <ModePill mode={form.glassTypeMode} onToggle={toggleGlassTypeMode} />
            </div>
            {form.glassTypeMode === 'select' ? (
              <select
                className={`${styles.control} ${errors.glassType ? styles.hasErr : ''}`}
                value={form.glassTypeId} onChange={e => handleGlassTypeSelect(e.target.value)}
                disabled={!effectiveVariantId || glassLoading}
              >
                <option value="">{selectPlaceholder({
                  upstream: !effectiveVariantId ? 'Select variant first' : undefined,
                  loading: glassLoading, error: glassErr, defaultLabel: 'Select glass type',
                })}</option>
                {glassTypes?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            ) : (
              <input className={`${styles.control} ${errors.glassType ? styles.hasErr : ''}`}
                type="text" placeholder="e.g. Front Windshield"
                value={form.glassTypeManual} onChange={e => patch({ glassTypeManual: e.target.value })} maxLength={100} />
            )}
            <FieldError msg={errors.glassType} />
          </div>

          {/* Description */}
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label}>
                Description
                {descLoading && <span className={styles.loadingTag}>loading…</span>}
              </label>
              {descHasOpts && (
                <ModePill mode={form.descMode} onToggle={() =>
                  patch({ descMode: form.descMode === 'select' ? 'manual' : 'select', descSelected: '', descManual: '' })
                } />
              )}
            </div>
            {showDescSelect ? (
              <select className={styles.control} value={form.descSelected}
                onChange={e => patch({ descSelected: e.target.value })}>
                <option value="">None / not applicable</option>
                {descriptions?.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            ) : (
              <input className={styles.control}
                type="text"
                placeholder={effectiveGlassId && !descHasOpts && !descLoading
                  ? 'No existing descriptions — type here'
                  : 'Optional part code or description'}
                value={form.descMode === 'select' ? form.descSelected : form.descManual}
                onChange={e =>
                  form.descMode === 'select'
                    ? patch({ descSelected: e.target.value })
                    : patch({ descManual: e.target.value })
                }
                maxLength={200}
              />
            )}
          </div>

        </div>
      </div>

      {/* ══ Section 3: Brand-wise Pricing ═══════════════════════════════════ */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionNum}>03</span>
          <span className={styles.sectionLabel}>Brand-wise Pricing</span>
          <span className={styles.sectionSub}>Leave any brand blank to omit it from this entry</span>
        </div>

        {errors.prices && (
          <div className={styles.pricesAlert}>
            <AlertCircle size={12} /><span>{errors.prices}</span>
          </div>
        )}

        <div className={styles.priceGrid}>
          {PRICE_FIELDS.map(({ key, label }) => {
            const errMsg = (errors as Record<string, string | undefined>)[key];
            return (
              <div key={key} className={`${styles.priceTile} ${errMsg ? styles.priceTileErr : ''}`}>
                <div className={styles.priceTileLabel}>{label}</div>
                <div className={styles.priceTileInput}>
                  <span className={styles.priceCurr}>₹</span>
                  <input
                    className={styles.priceInput}
                    type="number" min="0" step="0.01" placeholder="—"
                    value={form[key]}
                    onChange={e => patch({ [key]: e.target.value } as Partial<FormValues>)}
                  />
                </div>
                {errMsg && <span className={styles.priceTileErr}>{errMsg}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ API note ══════════════════════════════════════════════════════════ */}
      <div className={styles.apiNote}>
        <AlertCircle size={14} className={styles.apiNoteIcon} />
        <span>
          Single entry save API is not yet configured. The form validates correctly — connect the
          backend <code className={styles.apiNoteCode}>POST /catalog/entries</code> endpoint to
          enable persistence.
        </span>
      </div>

      {/* ══ Actions ═══════════════════════════════════════════════════════════ */}
      <div className={styles.actions}>
        <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
          Reset form
        </Button>
        <Button type="submit" size="md">
          <CheckCircle2 size={14} />
          Validate &amp; Submit
        </Button>
      </div>

    </form>
  );
}
