import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Shield, AlertCircle } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { DataTable }   from '@/components/ui/DataTable';
import { Badge }       from '@/components/ui/Badge';
import { Button }      from '@/components/ui/Button';
import { Input }       from '@/components/ui/Input';
import { Select }      from '@/components/ui/Select';
import { Modal }       from '@/components/ui/Modal';
import { Drawer }      from '@/components/ui/Drawer';
import { useToast }    from '@/components/ui/Toast';
import {
  useGetInsuranceRulesQuery,
  useCreateInsuranceRuleMutation,
  useUpdateInsuranceRuleMutation,
  useDeleteInsuranceRuleMutation,
} from '@/features/settings/services/insuranceRulesApi';
import type { InsuranceRule, InsuranceRulePayload, BoardType, CCCondition } from '@/types/models/insuranceRule';
import type { TableColumn, SelectOption } from '@/types/ui';
import { formatINR } from '@/services/mockUtils';
import { AlertBanner }  from '@/components/ui/AlertBanner';
import { TableSkeleton } from '@/components/ui/Skeleton';
import styles from './InsuranceRulesPage.module.css';

// ── Form state ──────────────────────────────────────────────────────
interface RuleForm {
  boardType:    BoardType;
  ccCondition:  CCCondition;
  extraCharges: string;
  depreciation: string;
  isActive:     boolean;
}

interface FormErrors {
  extraCharges?: string;
  depreciation?: string;
}

const EMPTY_FORM: RuleForm = {
  boardType:    'Yellow',
  ccCondition:  'Above 1500cc',
  extraCharges: '',
  depreciation: '',
  isActive:     true,
};

function ruleToForm(r: InsuranceRule): RuleForm {
  return {
    boardType:    r.boardType,
    ccCondition:  r.ccCondition,
    extraCharges: String(r.extraCharges),
    depreciation: String(r.depreciation),
    isActive:     r.isActive,
  };
}

// ── Component ───────────────────────────────────────────────────────
export function InsuranceRulesPage() {
  const { t } = useTranslation(['settings', 'common']);
  const toast = useToast();
  const { data: rules = [], isLoading, isError, refetch } = useGetInsuranceRulesQuery();
  const [createRule,  { isLoading: creating }]  = useCreateInsuranceRuleMutation();
  const [updateRule,  { isLoading: updating }]  = useUpdateInsuranceRuleMutation();
  const [deleteRule,  { isLoading: deleting }]  = useDeleteInsuranceRuleMutation();

  // ── Dropdown options ─────────────────────────────────────────────
  const BOARD_OPTIONS = useMemo<SelectOption[]>(() => [
    { value: 'Yellow', label: t('insuranceRules.boardOptions.yellow') },
    { value: 'White',  label: t('insuranceRules.boardOptions.white')  },
  ], [t]);

  const CC_OPTIONS = useMemo<SelectOption[]>(() => [
    { value: 'Above 1500cc', label: t('insuranceRules.ccOptions.above') },
    { value: 'Below 1500cc', label: t('insuranceRules.ccOptions.below') },
  ], [t]);

  // ── Drawer state ──────────────────────────────────────────────────
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [drawerMode,  setDrawerMode]  = useState<'add' | 'edit'>('add');
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [form,        setForm]        = useState<RuleForm>(EMPTY_FORM);
  const [formErrors,  setFormErrors]  = useState<FormErrors>({});

  // ── Delete state ──────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<InsuranceRule | null>(null);
  const [apiError,     setApiError]     = useState('');

  // ── Handlers ──────────────────────────────────────────────────────
  const openAdd = useCallback(() => {
    setDrawerMode('add');
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setDrawerOpen(true);
  }, []);

  const openEdit = useCallback((rule: InsuranceRule) => {
    setDrawerMode('edit');
    setEditingId(rule.id);
    setForm(ruleToForm(rule));
    setFormErrors({});
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => { setDrawerOpen(false); setApiError(''); }, []);

  function setField<K extends keyof RuleForm>(key: K, val: RuleForm[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    if (key in formErrors) setFormErrors((e) => { const n = { ...e }; delete n[key as keyof FormErrors]; return n; });
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    const charges = Number(form.extraCharges);
    if (!form.extraCharges.trim() || isNaN(charges) || charges < 0) {
      errs.extraCharges = t('insuranceRules.drawer.extraChargesInvalid');
    }
    const dep = Number(form.depreciation);
    if (!form.depreciation.trim() || isNaN(dep) || dep < 0 || dep > 100) {
      errs.depreciation = t('insuranceRules.drawer.depreciationInvalid');
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    const payload: InsuranceRulePayload = {
      boardType:    form.boardType,
      ccCondition:  form.ccCondition,
      extraCharges: Number(form.extraCharges),
      depreciation: Number(form.depreciation),
      isActive:     form.isActive,
    };
    try {
      if (drawerMode === 'add') {
        await createRule(payload).unwrap();
        toast.success(t('insuranceRules.toast.added'));
      } else if (editingId) {
        await updateRule({ id: editingId, ...payload }).unwrap();
        toast.success(t('insuranceRules.toast.updated'));
      }
      closeDrawer();
    } catch {
      setApiError(drawerMode === 'add' ? t('insuranceRules.toast.addFailed') : t('insuranceRules.toast.updateFailed'));
    }
  }, [form, drawerMode, editingId, createRule, updateRule, toast, closeDrawer, t]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteRule(deleteTarget.id).unwrap();
      toast.success(t('insuranceRules.toast.deleted'));
      setDeleteTarget(null);
    } catch {
      toast.error(t('insuranceRules.toast.deleteFailed'));
    }
  }, [deleteTarget, deleteRule, toast, t]);

  // ── Table columns ─────────────────────────────────────────────────
  const columns = useMemo<TableColumn<InsuranceRule>[]>(() => [
    {
      key:    'boardType',
      header: t('insuranceRules.columns.boardType'),
      render: (r) => (
        <Badge
          label={`${r.boardType} Board`}
          variant={r.boardType === 'Yellow' ? 'warning' : 'neutral'}
          size="sm"
        />
      ),
    },
    {
      key:    'ccCondition',
      header: t('insuranceRules.columns.ccCondition'),
      render: (r) => <span className={styles.mono}>{r.ccCondition}</span>,
    },
    {
      key:    'extraCharges',
      header: t('insuranceRules.columns.extraCharges'),
      align:  'right',
      render: (r) => <span className={styles.num}>{formatINR(r.extraCharges)}</span>,
    },
    {
      key:    'depreciation',
      header: t('insuranceRules.columns.depreciation'),
      align:  'right',
      render: (r) => <span className={styles.num}>{r.depreciation}%</span>,
    },
    {
      key:    'isActive',
      header: t('insuranceRules.columns.status'),
      render: (r) => (
        <Badge
          label={r.isActive ? 'Active' : 'Inactive'}
          variant={r.isActive ? 'success' : 'neutral'}
          size="sm"
        />
      ),
    },
    {
      key:    'id',
      header: '',
      width:  '90px',
      render: (r) => (
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={() => openEdit(r)}
            title="Edit"
            aria-label={`Edit rule ${r.boardType} ${r.ccCondition}`}
          >
            <Pencil size={14} />
          </button>
          <button
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            onClick={() => setDeleteTarget(r)}
            title="Delete"
            aria-label={`Delete rule ${r.boardType} ${r.ccCondition}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ], [openEdit, t]);

  const isSaving = creating || updating;

  return (
    <>
      <PageShell
        heading={t('insuranceRules.heading')}
        description={t('insuranceRules.description')}
        actions={<Button leftIcon={<Plus size={15} />} onClick={openAdd}>{t('insuranceRules.actions.add')}</Button>}
      >
      <SectionCard>
        {isLoading && <TableSkeleton rows={4} cols={5} />}
        {isError && (
          <div className={styles.emptyState}>
            <AlertCircle className={styles.emptyIcon} size={36} strokeWidth={1.4} />
            <p className={styles.emptyTitle}>{t('insuranceRules.loadError')}</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>{t('insuranceRules.actions.retry')}</Button>
          </div>
        )}
        {!isLoading && !isError && rules.length === 0 && (
          <div className={styles.emptyState}>
            <Shield className={styles.emptyIcon} size={40} strokeWidth={1.2} />
            <p className={styles.emptyTitle}>{t('insuranceRules.emptyNoData')}</p>
            <Button leftIcon={<Plus size={15} />} onClick={openAdd}>{t('insuranceRules.actions.add')}</Button>
          </div>
        )}
        {!isLoading && !isError && rules.length > 0 && (
          <DataTable columns={columns} data={rules} />
        )}
      </SectionCard>
      </PageShell>

      {/* ── Add / Edit Drawer ──────────────────────────────────────── */}
      <Drawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title={drawerMode === 'add' ? t('insuranceRules.drawer.addTitle') : t('insuranceRules.drawer.editTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={closeDrawer}>{t('common:actions.cancel')}</Button>
            <Button onClick={handleSave} loading={isSaving}>
              {drawerMode === 'add' ? t('insuranceRules.drawer.add') : t('insuranceRules.drawer.save')}
            </Button>
          </>
        }
      >
        {apiError && (
          <AlertBanner message={apiError} onDismiss={() => setApiError('')} />
        )}
        <Select
          label={t('insuranceRules.drawer.boardType')}
          options={BOARD_OPTIONS}
          value={form.boardType}
          onChange={(e) => setField('boardType', e.target.value as BoardType)}
        />
        <Select
          label={t('insuranceRules.drawer.ccCondition')}
          options={CC_OPTIONS}
          value={form.ccCondition}
          onChange={(e) => setField('ccCondition', e.target.value as CCCondition)}
        />
        <Input
          label={t('insuranceRules.drawer.extraCharges')}
          type="number"
          min={0}
          value={form.extraCharges}
          onChange={(e) => setField('extraCharges', e.target.value)}
          error={formErrors.extraCharges}
          placeholder="e.g. 1500"
          hint={t('insuranceRules.drawer.extraChargesHint')}
          fullWidth
        />
        <Input
          label={t('insuranceRules.drawer.depreciation')}
          type="number"
          min={0}
          max={100}
          value={form.depreciation}
          onChange={(e) => setField('depreciation', e.target.value)}
          error={formErrors.depreciation}
          placeholder="e.g. 15"
          hint={t('insuranceRules.drawer.depreciationHint')}
          fullWidth
        />

        {/* Active toggle */}
        <div className={styles.toggleRow}>
          <div className={styles.toggleLabel}>
            <span className={styles.toggleTitle}>{t('insuranceRules.drawer.activeStatus')}</span>
            <span className={styles.toggleHint}>Rule will be applied to matching claims</span>
          </div>
          <label className={styles.toggle} htmlFor="ir-isActive">
            <input
              id="ir-isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField('isActive', e.target.checked)}
            />
            <span className={styles.slider} />
          </label>
        </div>
      </Drawer>

      {/* ── Delete confirmation ────────────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('insuranceRules.deleteModal.title')}
        maxWidth="420px"
        footer={
          <div className={styles.deleteFooter}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>{t('common:actions.cancel')}</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} loading={deleting}>
              {t('common:actions.delete')}
            </Button>
          </div>
        }
      >
        {deleteTarget && (
          <p className={styles.deleteMsg}>
            {t('insuranceRules.deleteModal.message')}
          </p>
        )}
      </Modal>
    </>
  );
}
