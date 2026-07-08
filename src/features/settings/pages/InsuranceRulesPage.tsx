import { useState, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';
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
import styles from './InsuranceRulesPage.module.css';

// ── Dropdown options ────────────────────────────────────────────────
const BOARD_OPTIONS: SelectOption[] = [
  { value: 'Yellow', label: 'Yellow Board' },
  { value: 'White',  label: 'White Board'  },
];

const CC_OPTIONS: SelectOption[] = [
  { value: 'Above 1500cc', label: 'Above 1500cc' },
  { value: 'Below 1500cc', label: 'Below 1500cc' },
];

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
  const toast = useToast();
  const { data: rules = [], isLoading, isError } = useGetInsuranceRulesQuery();
  const [createRule,  { isLoading: creating }]  = useCreateInsuranceRuleMutation();
  const [updateRule,  { isLoading: updating }]  = useUpdateInsuranceRuleMutation();
  const [deleteRule,  { isLoading: deleting }]  = useDeleteInsuranceRuleMutation();

  // ── Drawer state ──────────────────────────────────────────────────
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [drawerMode,  setDrawerMode]  = useState<'add' | 'edit'>('add');
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [form,        setForm]        = useState<RuleForm>(EMPTY_FORM);
  const [formErrors,  setFormErrors]  = useState<FormErrors>({});

  // ── Delete state ──────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<InsuranceRule | null>(null);

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

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  function setField<K extends keyof RuleForm>(key: K, val: RuleForm[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    if (key in formErrors) setFormErrors((e) => { const n = { ...e }; delete n[key as keyof FormErrors]; return n; });
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    const charges = Number(form.extraCharges);
    if (!form.extraCharges.trim() || isNaN(charges) || charges < 0) {
      errs.extraCharges = 'Enter a valid amount (0 or more)';
    }
    const dep = Number(form.depreciation);
    if (!form.depreciation.trim() || isNaN(dep) || dep < 0 || dep > 100) {
      errs.depreciation = 'Enter a percentage between 0 and 100';
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
        toast.success('Insurance rule added.');
      } else if (editingId) {
        await updateRule({ id: editingId, ...payload }).unwrap();
        toast.success('Insurance rule updated.');
      }
      closeDrawer();
    } catch {
      toast.error('Failed to save rule. Please try again.');
    }
  }, [form, drawerMode, editingId, createRule, updateRule, toast, closeDrawer]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteRule(deleteTarget.id).unwrap();
      toast.success(`Rule for ${deleteTarget.boardType} / ${deleteTarget.ccCondition} deleted.`);
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete rule. Please try again.');
    }
  }, [deleteTarget, deleteRule, toast]);

  // ── Table columns ─────────────────────────────────────────────────
  const columns = useMemo<TableColumn<InsuranceRule>[]>(() => [
    {
      key:    'boardType',
      header: 'Board Type',
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
      header: 'CC Condition',
      render: (r) => <span className={styles.mono}>{r.ccCondition}</span>,
    },
    {
      key:    'extraCharges',
      header: 'Extra Charges',
      align:  'right',
      render: (r) => <span className={styles.num}>{formatINR(r.extraCharges)}</span>,
    },
    {
      key:    'depreciation',
      header: 'Depreciation',
      align:  'right',
      render: (r) => <span className={styles.num}>{r.depreciation}%</span>,
    },
    {
      key:    'isActive',
      header: 'Active',
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
  ], [openEdit]);

  const isSaving = creating || updating;

  return (
    <>
      <PageShell
        heading="Insurance Rules"
        description="Configure extra charges and depreciation rates by board type and engine size."
        actions={<Button leftIcon={<Plus size={15} />} onClick={openAdd}>Add Rule</Button>}
      >
      <SectionCard>
        {isLoading && <div className={styles.state}>Loading rules…</div>}
        {isError   && <div className={styles.state}>Failed to load rules.</div>}
        {!isLoading && !isError && rules.length === 0 && (
          <div className={styles.emptyState}>
            <Shield className={styles.emptyIcon} size={40} strokeWidth={1.2} />
            <p className={styles.emptyTitle}>No insurance rules yet</p>
            <p className={styles.emptyDesc}>
              Add rules to define extra charges and depreciation per board type and CC range.
            </p>
            <Button leftIcon={<Plus size={15} />} onClick={openAdd}>Add First Rule</Button>
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
        title={drawerMode === 'add' ? 'Add Insurance Rule' : 'Edit Insurance Rule'}
        footer={
          <>
            <Button variant="ghost" onClick={closeDrawer}>Cancel</Button>
            <Button onClick={handleSave} loading={isSaving}>Save Rule</Button>
          </>
        }
      >
        <Select
          label="Board Type"
          options={BOARD_OPTIONS}
          value={form.boardType}
          onChange={(e) => setField('boardType', e.target.value as BoardType)}
        />
        <Select
          label="CC Condition"
          options={CC_OPTIONS}
          value={form.ccCondition}
          onChange={(e) => setField('ccCondition', e.target.value as CCCondition)}
        />
        <Input
          label="Extra Charges (₹)"
          type="number"
          min={0}
          value={form.extraCharges}
          onChange={(e) => setField('extraCharges', e.target.value)}
          error={formErrors.extraCharges}
          placeholder="e.g. 1500"
          hint="Flat amount added on top of base claim"
          fullWidth
        />
        <Input
          label="Depreciation (%)"
          type="number"
          min={0}
          max={100}
          value={form.depreciation}
          onChange={(e) => setField('depreciation', e.target.value)}
          error={formErrors.depreciation}
          placeholder="e.g. 15"
          hint="Applied to the depreciated value of the glass"
          fullWidth
        />

        {/* Active toggle */}
        <div className={styles.toggleRow}>
          <div className={styles.toggleLabel}>
            <span className={styles.toggleTitle}>Active</span>
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
        title="Delete Insurance Rule?"
        maxWidth="420px"
        footer={
          <div className={styles.deleteFooter}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteConfirm} loading={deleting}>
              Delete Rule
            </Button>
          </div>
        }
      >
        {deleteTarget && (
          <p className={styles.deleteMsg}>
            Are you sure you want to delete the rule for{' '}
            <strong>{deleteTarget.boardType} Board</strong> /{' '}
            <strong>{deleteTarget.ccCondition}</strong>?
            This action cannot be undone.
          </p>
        )}
      </Modal>
    </>
  );
}
