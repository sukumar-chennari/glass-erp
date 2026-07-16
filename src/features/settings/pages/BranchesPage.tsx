import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft, LocateFixed, Loader2, Pencil } from 'lucide-react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useHasPermission } from '@/context/AuthContext';
import { useGetBranchesQuery, useCreateBranchMutation, useUpdateBranchMutation, useDeactivateBranchMutation } from '@/features/settings/services/branchesApi';
import type { BranchListItem, BranchListStatus, BranchCreatePayload, BranchPatchPayload } from '@/types/models/branch';
import type { TableColumn, SelectOption } from '@/types/ui';
import { ROUTES } from '@/constants/routes';
import styles from './BranchesPage.module.css';

// ── Form ───────────────────────────────────────────────────────────────
// All fields are `string` in form state; BranchCreatePayload casting happens in handleAdd.
interface BranchForm {
  name:                   string;
  code:                   string;
  state:                  string;
  district:               string;
  address:                string;
  pincode:                string;
  latitude:               string;
  longitude:              string;
  contactNumber:          string;
  alternateContactNumber: string;
  email:                  string;
  openingTime:            string;
  closingTime:            string;
  status:                 string;
  adminName:              string;
  adminEmail:             string;
  adminPassword:          string;
  adminPhone:             string;
}

const EMPTY_FORM: BranchForm = {
  name:                   '',
  code:                   '',
  state:                  '',
  district:               '',
  address:                '',
  pincode:                '',
  latitude:               '',
  longitude:              '',
  contactNumber:          '',
  alternateContactNumber: '',
  email:                  '',
  openingTime:            '09:00',
  closingTime:            '19:00',
  status:                 'ACTIVE',
  adminName:              '',
  adminEmail:             '',
  adminPassword:          '',
  adminPhone:             '',
};

interface FormErrors {
  name?:                   string;
  code?:                   string;
  state?:                  string;
  district?:               string;
  address?:                string;
  pincode?:                string;
  latitude?:               string;
  longitude?:              string;
  contactNumber?:          string;
  alternateContactNumber?: string;
  email?:                  string;
  adminName?:              string;
  adminEmail?:             string;
  adminPassword?:          string;
  adminPhone?:             string;
}

const EMAIL_RE   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_10   = /^\d{10}$/;
const PHONE_LONG = /^\d{10,13}$/;  // admin phone: with or without country code

// ── Component ──────────────────────────────────────────────────────────
export function BranchesPage() {
  const { t } = useTranslation(['settings', 'common']);
  const toast     = useToast();
  const canWrite  = useHasPermission('branches:write');

  const [statusFilter, setStatusFilter] = useState<BranchListStatus | ''>('');

  const { data: branchRes, isLoading, isError, error } = useGetBranchesQuery(
    statusFilter || undefined,
  );
  const branches = branchRes?.data ?? [];
  const [createBranch,     { isLoading: saving }]       = useCreateBranchMutation();
  const [updateBranch,     { isLoading: updating }]     = useUpdateBranchMutation();
  const [deactivateBranch, { isLoading: deactivating }] = useDeactivateBranchMutation();

  // ── Status maps & filter options ─────────────────────────────────────
  const BRANCH_STATUS_MAP = useMemo<Record<BranchListStatus, { label: string; variant: 'success' | 'warning' | 'neutral' }>>(() => ({
    ACTIVE:    { label: t('branches.statusLabels.active'),    variant: 'success' },
    INACTIVE:  { label: t('branches.statusLabels.inactive'),  variant: 'neutral' },
    SUSPENDED: { label: t('branches.statusLabels.suspended'), variant: 'warning' },
  }), [t]);

  // Used in the create form status select (SUSPENDED not allowed at create time)
  const STATUS_OPTIONS = useMemo<SelectOption[]>(() => [
    { value: 'ACTIVE',   label: t('branches.statusLabels.active')   },
    { value: 'INACTIVE', label: t('branches.statusLabels.inactive')  },
  ], [t]);

  // Edit form may set any status including SUSPENDED
  const EDIT_STATUS_OPTIONS = useMemo<SelectOption[]>(() => [
    { value: 'ACTIVE',    label: t('branches.statusLabels.active')    },
    { value: 'INACTIVE',  label: t('branches.statusLabels.inactive')  },
    { value: 'SUSPENDED', label: t('branches.statusLabels.suspended') },
  ], [t]);

  const FILTER_OPTIONS = useMemo<SelectOption[]>(() => [
    { value: '',          label: t('branches.allStatuses')            },
    { value: 'ACTIVE',    label: t('branches.statusLabels.active')    },
    { value: 'INACTIVE',  label: t('branches.statusLabels.inactive')  },
    { value: 'SUSPENDED', label: t('branches.statusLabels.suspended') },
  ], [t]);

  // ── Create modal state ───────────────────────────────────────────────
  const [modalOpen,   setModal]     = useState(false);
  const [form,        setForm]      = useState<BranchForm>(EMPTY_FORM);
  const [errors,      setErrors]    = useState<FormErrors>({});
  const [geoLoading,  setGeoLoad]   = useState(false);
  const [geoError,    setGeoError]  = useState<string | null>(null);

  // ── Edit modal state ─────────────────────────────────────────────────
  const [editingBranch, setEditingBranch] = useState<BranchListItem | null>(null);
  const [editForm,      setEditForm]      = useState<BranchForm>(EMPTY_FORM);
  const [editErrors,    setEditErrors]    = useState<FormErrors>({});
  const [editGeoLoad,   setEditGeoLoad]   = useState(false);
  const [editGeoError,  setEditGeoError]  = useState<string | null>(null);

  // ── Deactivate confirmation state ─────────────────────────────────────
  const [confirmBranch, setConfirmBranch] = useState<BranchListItem | null>(null);

  const isUnauthorized = isError &&
    (error as FetchBaseQueryError | undefined)?.status === 401;

  // ── Table columns ────────────────────────────────────────────────────
  // Uses real backend field names: contactNumber, openingTime, closingTime.
  // Edit action column is added dynamically inside the component via useMemo.
  const BASE_COLUMNS = useMemo<TableColumn<BranchListItem>[]>(() => [
    {
      key: 'name',
      header: t('branches.columns.branch'),
      render: (b) => (
        <div>
          <div className={styles.cellPrimary}>{b.name}</div>
          <div className={styles.cellMuted}>{b.address}</div>
          <div className={styles.cellMuted}>{b.district}, {b.state}</div>
        </div>
      ),
    },
    {
      key: 'openingTime',
      header: t('branches.columns.hours'),
      render: (b) => (
        <span className={styles.hours}>{b.openingTime} – {b.closingTime}</span>
      ),
    },
    { key: 'contactNumber', header: t('branches.columns.phone') },
    { key: 'email',         header: t('branches.columns.email') },
    {
      key: 'status',
      header: t('branches.columns.status'),
      render: (b) => <StatusBadge status={b.status} statusMap={BRANCH_STATUS_MAP} size="sm" />,
    },
  ], [t, BRANCH_STATUS_MAP]);

  // ── Dynamic columns (action handlers captured by closure) ────────────
  const columns = useMemo<TableColumn<BranchListItem>[]>(() => [
    ...BASE_COLUMNS,
    ...(canWrite ? [{
      key:    'id' as const,
      header: '',
      render: (b: BranchListItem) => (
        <div className={styles.rowActions}>
          <button
            className={styles.editBtn}
            onClick={() => openEdit(b)}
            title={`Edit ${b.name}`}
            aria-label={`Edit ${b.name}`}
          >
            <Pencil size={13} />
            Edit
          </button>
          {b.status !== 'INACTIVE' && (
            <button
              className={styles.deactivateBtn}
              onClick={() => setConfirmBranch(b)}
              title={`Deactivate ${b.name}`}
              aria-label={`Deactivate ${b.name}`}
            >
              Deactivate
            </button>
          )}
        </div>
      ),
    }] : []),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canWrite, BASE_COLUMNS]);

  // ── Create form helpers ──────────────────────────────────────────────
  function set(key: keyof BranchForm, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key as keyof FormErrors]) {
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
  }

  // ── Edit form helpers ────────────────────────────────────────────────
  function setEdit(key: keyof BranchForm, val: string) {
    setEditForm((f) => ({ ...f, [key]: val }));
    if (editErrors[key as keyof FormErrors]) {
      setEditErrors((e) => ({ ...e, [key]: undefined }));
    }
  }

  function openEdit(branch: BranchListItem) {
    setEditForm({
      name:                   branch.name,
      code:                   branch.code,
      state:                  branch.state,
      district:               branch.district,
      address:                branch.address,
      pincode:                branch.pincode,
      latitude:               String(branch.latitude),
      longitude:              String(branch.longitude),
      contactNumber:          branch.contactNumber,
      alternateContactNumber: branch.alternateContactNumber,
      email:                  branch.email,
      openingTime:            branch.openingTime,
      closingTime:            branch.closingTime,
      status:                 branch.status,
      adminName:              '',
      adminEmail:             '',
      adminPassword:          '',
      adminPhone:             '',
    });
    setEditErrors({});
    setEditGeoError(null);
    setEditingBranch(branch);
  }

  function closeEdit() {
    setEditingBranch(null);
    setEditErrors({});
    setEditGeoError(null);
  }

  function detectEditLocation() {
    if (!navigator.geolocation) {
      setEditGeoError('Geolocation is not supported by your browser. Enter coordinates manually.');
      return;
    }
    setEditGeoLoad(true);
    setEditGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setEdit('latitude',  pos.coords.latitude.toFixed(6));
        setEdit('longitude', pos.coords.longitude.toFixed(6));
        setEditGeoLoad(false);
      },
      (err) => {
        setEditGeoLoad(false);
        if (err.code === err.PERMISSION_DENIED) {
          setEditGeoError('Location access denied. Allow location in browser settings, or enter manually.');
        } else {
          setEditGeoError('Could not detect location. Enter coordinates manually.');
        }
      },
      { timeout: 10000, maximumAge: 0 },
    );
  }

  function validateEdit(): boolean {
    const errs: FormErrors = {};

    if (!editForm.name.trim())     errs.name     = 'Branch name is required';
    if (!editForm.state.trim())    errs.state    = 'State is required';
    if (!editForm.district.trim()) errs.district = 'District is required';
    if (!editForm.address.trim())  errs.address  = 'Address is required';

    if (!editForm.pincode.trim())           errs.pincode  = 'Pincode is required';
    else if (!/^\d{6}$/.test(editForm.pincode.trim()))
                                            errs.pincode  = 'Enter a valid 6-digit pincode';

    const lat = parseFloat(editForm.latitude);
    if (!editForm.latitude.trim())          errs.latitude  = 'Latitude is required';
    else if (isNaN(lat) || lat < -90 || lat > 90)
                                            errs.latitude  = 'Enter a value between −90 and 90';

    const lng = parseFloat(editForm.longitude);
    if (!editForm.longitude.trim())         errs.longitude = 'Longitude is required';
    else if (isNaN(lng) || lng < -180 || lng > 180)
                                            errs.longitude = 'Enter a value between −180 and 180';

    if (!editForm.contactNumber.trim())     errs.contactNumber = 'Contact number is required';
    else if (!PHONE_10.test(editForm.contactNumber.replace(/\s/g, '')))
                                            errs.contactNumber = 'Enter a valid 10-digit number';

    if (!editForm.alternateContactNumber.trim())
                                            errs.alternateContactNumber = 'Alternate number is required';
    else if (!PHONE_10.test(editForm.alternateContactNumber.replace(/\s/g, '')))
                                            errs.alternateContactNumber = 'Enter a valid 10-digit number';

    if (!editForm.email.trim())             errs.email = 'Branch email is required';
    else if (!EMAIL_RE.test(editForm.email.trim()))
                                            errs.email = 'Enter a valid email address';

    setEditErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!editingBranch || !validateEdit()) return;

    const payload: BranchPatchPayload = {
      id:                     editingBranch.id,
      name:                   editForm.name.trim(),
      state:                  editForm.state.trim(),
      district:               editForm.district.trim(),
      address:                editForm.address.trim(),
      pincode:                editForm.pincode.trim(),
      latitude:               parseFloat(editForm.latitude),
      longitude:              parseFloat(editForm.longitude),
      contactNumber:          editForm.contactNumber.trim(),
      alternateContactNumber: editForm.alternateContactNumber.trim(),
      email:                  editForm.email.trim().toLowerCase(),
      openingTime:            editForm.openingTime,
      closingTime:            editForm.closingTime,
      status:                 editForm.status as BranchPatchPayload['status'],
    };

    const result = await updateBranch(payload);

    if ('data' in result) {
      toast.success(t('branches.toast.updated', { name: payload.name }));
      closeEdit();
      return;
    }

    if ('error' in result) {
      const err = result.error as FetchBaseQueryError;
      if (typeof err.status === 'number') {
        const msg = (err.data as { message?: string } | null)?.message;
        if (err.status === 404) {
          toast.error('Branch not found. It may have been deleted.');
        } else {
          toast.error(msg ?? 'Failed to update branch. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection and try again.');
      }
    }
  }

  async function handleDeactivate() {
    if (!confirmBranch) return;
    const { id } = confirmBranch;
    setConfirmBranch(null);

    const result = await deactivateBranch(id);

    if ('error' in result) {
      const err = result.error as FetchBaseQueryError;
      if ((err as { status?: number }).status === 404) {
        toast.error('Branch not found. It may have already been removed.');
      } else {
        toast.error('Failed to deactivate branch. Please try again.');
      }
      return;
    }

    toast.success(t('branches.toast.deactivated'));
  }

  function validate(): boolean {
    const errs: FormErrors = {};

    if (!form.name.trim())     errs.name     = 'Branch name is required';

    if (!form.code.trim())     errs.code     = 'Branch code is required';
    else if (!/^[a-z0-9-]+$/.test(form.code.trim()))
                               errs.code     = 'Lowercase letters, digits, and hyphens only';

    if (!form.state.trim())    errs.state    = 'State is required';
    if (!form.district.trim()) errs.district = 'District is required';
    if (!form.address.trim())  errs.address  = 'Address is required';

    if (!form.pincode.trim())          errs.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(form.pincode.trim()))
                                       errs.pincode = 'Enter a valid 6-digit pincode';

    const lat = parseFloat(form.latitude);
    if (!form.latitude.trim())         errs.latitude = 'Latitude is required';
    else if (isNaN(lat) || lat < -90 || lat > 90)
                                       errs.latitude = 'Enter a value between −90 and 90';

    const lng = parseFloat(form.longitude);
    if (!form.longitude.trim())        errs.longitude = 'Longitude is required';
    else if (isNaN(lng) || lng < -180 || lng > 180)
                                       errs.longitude = 'Enter a value between −180 and 180';

    if (!form.contactNumber.trim())    errs.contactNumber = 'Contact number is required';
    else if (!PHONE_10.test(form.contactNumber.replace(/\s/g, '')))
                                       errs.contactNumber = 'Enter a valid 10-digit number';

    if (!form.alternateContactNumber.trim())
                                       errs.alternateContactNumber = 'Alternate number is required';
    else if (!PHONE_10.test(form.alternateContactNumber.replace(/\s/g, '')))
                                       errs.alternateContactNumber = 'Enter a valid 10-digit number';

    if (!form.email.trim())            errs.email = 'Branch email is required';
    else if (!EMAIL_RE.test(form.email.trim()))
                                       errs.email = 'Enter a valid email address';

    if (!form.adminName.trim())        errs.adminName = 'Admin name is required';

    if (!form.adminEmail.trim())       errs.adminEmail = 'Admin email is required';
    else if (!EMAIL_RE.test(form.adminEmail.trim()))
                                       errs.adminEmail = 'Enter a valid email address';

    if (!form.adminPassword)           errs.adminPassword = 'Temporary password is required';
    else if (form.adminPassword.length < 8)
                                       errs.adminPassword = 'Password must be at least 8 characters';

    if (!form.adminPhone.trim())       errs.adminPhone = 'Admin phone is required';
    else if (!PHONE_LONG.test(form.adminPhone.replace(/\s/g, '')))
                                       errs.adminPhone = 'Enter 10–13 digits (e.g. 919876543210)';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser. Enter coordinates manually.');
      return;
    }
    setGeoLoad(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('latitude',  pos.coords.latitude.toFixed(6));
        set('longitude', pos.coords.longitude.toFixed(6));
        setGeoLoad(false);
      },
      (err) => {
        setGeoLoad(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location access denied. Allow location in your browser settings, or enter manually.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoError('Location unavailable. Enter coordinates manually.');
        } else {
          setGeoError('Could not detect location. Enter coordinates manually.');
        }
      },
      { timeout: 10000, maximumAge: 0 },
    );
  }

  function openModal() {
    setForm(EMPTY_FORM);
    setErrors({});
    setGeoError(null);
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setErrors({});
    setGeoError(null);
  }

  async function handleAdd() {
    if (!validate()) return;

    const payload: BranchCreatePayload = {
      name:                   form.name.trim(),
      code:                   form.code.trim(),
      state:                  form.state.trim(),
      district:               form.district.trim(),
      address:                form.address.trim(),
      pincode:                form.pincode.trim(),
      latitude:               parseFloat(form.latitude),
      longitude:              parseFloat(form.longitude),
      contactNumber:          form.contactNumber.trim(),
      alternateContactNumber: form.alternateContactNumber.trim(),
      email:                  form.email.trim(),
      openingTime:            form.openingTime,
      closingTime:            form.closingTime,
      status:                 form.status as BranchCreatePayload['status'],
      adminName:              form.adminName.trim(),
      adminEmail:             form.adminEmail.trim(),
      adminPassword:          form.adminPassword,
      adminPhone:             form.adminPhone.trim(),
    };

    const result = await createBranch(payload);

    if ('data' in result) {
      toast.success(t('branches.toast.added', { name: payload.name }));
      closeModal();
      return;
    }

    if ('error' in result) {
      const err = result.error as FetchBaseQueryError;
      if (typeof err.status === 'number') {
        const msg = (err.data as { message?: string } | null)?.message;
        if (err.status === 409) {
          toast.error(msg ?? 'Branch code already in use or this admin is already assigned to a branch.');
        } else {
          toast.error(msg ?? 'Failed to create branch. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection and try again.');
      }
    }
  }

  return (
    <PageShell
      heading={t('branches.heading')}
      description={t('branches.description')}
      actions={
        canWrite ? (
          <Button leftIcon={<Building2 size={16} />} onClick={openModal}>
            {t('branches.actions.add')}
          </Button>
        ) : null
      }
    >
      <Link to={ROUTES.SETTINGS} className={styles.back}>
        <ArrowLeft size={13} />
        Back to Settings
      </Link>

      <SectionCard>
        <div className={styles.tableHeader}>
          <span className={styles.count}>
            {isLoading ? 'Loading…' : `${branches.length} branch${branches.length !== 1 ? 'es' : ''}`}
          </span>
          <Select
            options={FILTER_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BranchListStatus | '')}
            aria-label="Filter by status"
          />
        </div>
        {isLoading && <div className={styles.emptyState}>Loading branches…</div>}
        {isUnauthorized && (
          <div className={styles.emptyState}>
            Session expired or insufficient permissions. Please log in again.
          </div>
        )}
        {isError && !isUnauthorized && (
          <div className={styles.emptyState}>{t('branches.loadError')}</div>
        )}
        {!isLoading && !isError && branches.length === 0 && (
          <div className={styles.emptyState}>
            {statusFilter ? `No ${statusFilter.toLowerCase()} branches found.` : t('branches.emptyNoResults')}
          </div>
        )}
        {!isLoading && !isError && branches.length > 0 && (
          <DataTable columns={columns} data={branches} />
        )}
      </SectionCard>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={t('branches.modal.addTitle')}
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={closeModal}>{t('common:actions.cancel')}</Button>
            <Button onClick={handleAdd} loading={saving}>{t('branches.modal.add')}</Button>
          </div>
        }
      >
        <div className={styles.form}>

          {/* ── Branch details ────────────────────────────────────── */}
          <Input
            label={t('branches.modal.name')}
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Glass Pro – Hyderabad Hitech City"
            error={errors.name}
            required
            fullWidth
            autoFocus
          />

          <Input
            label="Branch Code"
            value={form.code}
            onChange={(e) => set('code', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="e.g. glass-pro-hyd-hitech"
            hint="Unique identifier. Lowercase letters, digits, and hyphens only."
            error={errors.code}
            required
            fullWidth
          />

          {/* ── Location ─────────────────────────────────────────── */}
          <div className={styles.twoCol}>
            <Input
              label={t('branches.modal.state')}
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
              placeholder="e.g. Telangana"
              error={errors.state}
              required
            />
            <Input
              label={t('branches.modal.district')}
              value={form.district}
              onChange={(e) => set('district', e.target.value)}
              placeholder="e.g. Hyderabad"
              error={errors.district}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              {t('branches.modal.address')} <span className={styles.req}>*</span>
            </label>
            <textarea
              className={`${styles.textarea} ${errors.address ? styles.textareaError : ''}`}
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="Plot No., Street, Area, City"
              rows={2}
            />
            {errors.address && <span className={styles.errMsg}>{errors.address}</span>}
          </div>

          <div className={styles.twoCol}>
            <Input
              label={t('branches.modal.pincode')}
              value={form.pincode}
              onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="e.g. 500081"
              error={errors.pincode}
              required
            />
            <div />
          </div>

          <div className={styles.field}>
            <div className={styles.coordHeader}>
              <span className={styles.label}>
                Coordinates <span className={styles.req}>*</span>
              </span>
              <button
                type="button"
                className={styles.geoBtn}
                onClick={detectLocation}
                disabled={geoLoading}
              >
                {geoLoading
                  ? <Loader2 size={12} className={styles.spin} />
                  : <LocateFixed size={12} />}
                {geoLoading ? 'Detecting…' : t('branches.actions.detectLocation')}
              </button>
            </div>
            <div className={styles.twoCol}>
              <Input
                label={t('branches.modal.latitude')}
                value={form.latitude}
                onChange={(e) => set('latitude', e.target.value)}
                placeholder="e.g. 17.385"
                error={errors.latitude}
                required
              />
              <Input
                label={t('branches.modal.longitude')}
                value={form.longitude}
                onChange={(e) => set('longitude', e.target.value)}
                placeholder="e.g. 78.4867"
                error={errors.longitude}
                required
              />
            </div>
            {geoError && <span className={styles.geoError}>{geoError}</span>}
          </div>

          {/* ── Contact ──────────────────────────────────────────── */}
          <div className={styles.twoCol}>
            <Input
              label={t('branches.modal.phone')}
              type="tel"
              value={form.contactNumber}
              onChange={(e) => set('contactNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="9140234567"
              error={errors.contactNumber}
              required
            />
            <Input
              label="Alternate Number"
              type="tel"
              value={form.alternateContactNumber}
              onChange={(e) => set('alternateContactNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="9140234568"
              error={errors.alternateContactNumber}
              required
            />
          </div>

          <Input
            label={t('branches.modal.email')}
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="e.g. hitech@glasspro.com"
            error={errors.email}
            required
            fullWidth
          />

          {/* ── Hours & Status ───────────────────────────────────── */}
          <div className={styles.field}>
            <label className={styles.label}>Working Hours</label>
            <div className={styles.hoursRow}>
              <input
                type="time"
                className={styles.timeInput}
                value={form.openingTime}
                onChange={(e) => set('openingTime', e.target.value)}
              />
              <span className={styles.hoursSep}>to</span>
              <input
                type="time"
                className={styles.timeInput}
                value={form.closingTime}
                onChange={(e) => set('closingTime', e.target.value)}
              />
            </div>
          </div>

          <Select
            label={t('branches.modal.status')}
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
          />

          {/* ── Branch Admin Account ─────────────────────────────── */}
          <div className={styles.field}>
            <span className={styles.sectionLabel}>Branch Admin Account</span>
          </div>

          <Input
            label="Admin Full Name"
            value={form.adminName}
            onChange={(e) => set('adminName', e.target.value)}
            placeholder="e.g. Rajesh Kumar"
            error={errors.adminName}
            required
            fullWidth
          />

          <div className={styles.twoCol}>
            <Input
              label="Admin Email"
              type="email"
              value={form.adminEmail}
              onChange={(e) => set('adminEmail', e.target.value)}
              placeholder="e.g. rajesh@glasspro.com"
              error={errors.adminEmail}
              required
            />
            <Input
              label="Admin Phone"
              type="tel"
              value={form.adminPhone}
              onChange={(e) => set('adminPhone', e.target.value.replace(/\D/g, '').slice(0, 13))}
              placeholder="919876543210"
              hint="With country code, e.g. 91XXXXXXXXXX"
              error={errors.adminPhone}
              required
            />
          </div>

          <Input
            label="Temporary Password"
            type="password"
            value={form.adminPassword}
            onChange={(e) => set('adminPassword', e.target.value)}
            placeholder="Min. 8 characters"
            hint="The branch admin must change this on first login."
            error={errors.adminPassword}
            required
            fullWidth
          />
        </div>
      </Modal>

      {/* ── Edit Branch Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={editingBranch !== null}
        onClose={closeEdit}
        title={t('branches.modal.editTitle', { name: editingBranch?.name ?? '' })}
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={closeEdit} disabled={updating}>{t('common:actions.cancel')}</Button>
            <Button onClick={handleSave} loading={updating}>{t('branches.modal.save')}</Button>
          </div>
        }
      >
        <div className={styles.form}>

          {/* ── Branch details ─────────────────────────────────────── */}
          <Input
            label={t('branches.modal.name')}
            value={editForm.name}
            onChange={(e) => setEdit('name', e.target.value)}
            placeholder="e.g. Glass Pro – Hyderabad Hitech City"
            error={editErrors.name}
            required
            fullWidth
            autoFocus
          />

          {/* ── Location ──────────────────────────────────────────── */}
          <div className={styles.twoCol}>
            <Input
              label={t('branches.modal.state')}
              value={editForm.state}
              onChange={(e) => setEdit('state', e.target.value)}
              placeholder="e.g. Telangana"
              error={editErrors.state}
              required
            />
            <Input
              label={t('branches.modal.district')}
              value={editForm.district}
              onChange={(e) => setEdit('district', e.target.value)}
              placeholder="e.g. Hyderabad"
              error={editErrors.district}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              {t('branches.modal.address')} <span className={styles.req}>*</span>
            </label>
            <textarea
              className={`${styles.textarea} ${editErrors.address ? styles.textareaError : ''}`}
              value={editForm.address}
              onChange={(e) => setEdit('address', e.target.value)}
              placeholder="Plot No., Street, Area, City"
              rows={2}
            />
            {editErrors.address && <span className={styles.errMsg}>{editErrors.address}</span>}
          </div>

          <div className={styles.twoCol}>
            <Input
              label={t('branches.modal.pincode')}
              value={editForm.pincode}
              onChange={(e) => setEdit('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="e.g. 500081"
              error={editErrors.pincode}
              required
            />
            <div />
          </div>

          <div className={styles.field}>
            <div className={styles.coordHeader}>
              <span className={styles.label}>
                Coordinates <span className={styles.req}>*</span>
              </span>
              <button
                type="button"
                className={styles.geoBtn}
                onClick={detectEditLocation}
                disabled={editGeoLoad}
              >
                {editGeoLoad
                  ? <Loader2 size={12} className={styles.spin} />
                  : <LocateFixed size={12} />}
                {editGeoLoad ? 'Detecting…' : t('branches.actions.detectLocation')}
              </button>
            </div>
            <div className={styles.twoCol}>
              <Input
                label={t('branches.modal.latitude')}
                value={editForm.latitude}
                onChange={(e) => setEdit('latitude', e.target.value)}
                placeholder="e.g. 17.385"
                error={editErrors.latitude}
                required
              />
              <Input
                label={t('branches.modal.longitude')}
                value={editForm.longitude}
                onChange={(e) => setEdit('longitude', e.target.value)}
                placeholder="e.g. 78.4867"
                error={editErrors.longitude}
                required
              />
            </div>
            {editGeoError && <span className={styles.geoError}>{editGeoError}</span>}
          </div>

          {/* ── Contact ────────────────────────────────────────────── */}
          <div className={styles.twoCol}>
            <Input
              label={t('branches.modal.phone')}
              type="tel"
              value={editForm.contactNumber}
              onChange={(e) => setEdit('contactNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="9140234567"
              error={editErrors.contactNumber}
              required
            />
            <Input
              label="Alternate Number"
              type="tel"
              value={editForm.alternateContactNumber}
              onChange={(e) => setEdit('alternateContactNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="9140234568"
              error={editErrors.alternateContactNumber}
              required
            />
          </div>

          <Input
            label={t('branches.modal.email')}
            type="email"
            value={editForm.email}
            onChange={(e) => setEdit('email', e.target.value)}
            placeholder="e.g. hitech@glasspro.com"
            error={editErrors.email}
            required
            fullWidth
          />

          {/* ── Hours & Status ─────────────────────────────────────── */}
          <div className={styles.field}>
            <label className={styles.label}>Working Hours</label>
            <div className={styles.hoursRow}>
              <input
                type="time"
                className={styles.timeInput}
                value={editForm.openingTime}
                onChange={(e) => setEdit('openingTime', e.target.value)}
              />
              <span className={styles.hoursSep}>to</span>
              <input
                type="time"
                className={styles.timeInput}
                value={editForm.closingTime}
                onChange={(e) => setEdit('closingTime', e.target.value)}
              />
            </div>
          </div>

          <Select
            label={t('branches.modal.status')}
            options={EDIT_STATUS_OPTIONS}
            value={editForm.status}
            onChange={(e) => setEdit('status', e.target.value)}
          />
        </div>
      </Modal>

      {/* ── Deactivate Confirmation Modal ──────────────────────────────── */}
      <Modal
        isOpen={confirmBranch !== null}
        onClose={() => setConfirmBranch(null)}
        title="Deactivate Branch"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={() => setConfirmBranch(null)} disabled={deactivating}>
              {t('common:actions.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDeactivate} loading={deactivating}>
              Deactivate
            </Button>
          </div>
        }
      >
        <p className={styles.confirmText}>
          Are you sure you want to deactivate{' '}
          <strong>{confirmBranch?.name}</strong>?
        </p>
        <p className={styles.confirmHint}>
          This will set the branch status to Inactive. No data will be deleted.
          You can reactivate it later by editing the branch status.
        </p>
      </Modal>
    </PageShell>
  );
}
