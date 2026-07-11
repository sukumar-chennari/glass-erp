import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft, MapPin, LocateFixed, Loader2 } from 'lucide-react';
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
import { useGetBranchesQuery, useCreateBranchMutation } from '@/features/settings/services/branchesApi';
import type { Branch, BranchCreatePayload, BranchStatus } from '@/types/models/branch';
import type { TableColumn, SelectOption } from '@/types/ui';
import { ROUTES } from '@/constants/routes';
import styles from './BranchesPage.module.css';

const BRANCH_STATUS_MAP: Record<BranchStatus, { label: string; variant: 'success' | 'neutral' }> = {
  Active:   { label: 'Active',   variant: 'success' },
  Inactive: { label: 'Inactive', variant: 'neutral' },
};

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'ACTIVE',   label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

// ── Table Columns ──────────────────────────────────────────────────────
const COLUMNS: TableColumn<Branch>[] = [
  {
    key: 'name',
    header: 'Branch',
    render: (b) => (
      <div>
        <div className={styles.cellPrimary}>{b.name}</div>
        <div className={styles.cellMuted}>{b.address}</div>
        {b.mapsUrl && (
          <a
            href={b.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapsLink}
            onClick={(e) => e.stopPropagation()}
          >
            <MapPin size={10} /> View on Maps
          </a>
        )}
      </div>
    ),
  },
  {
    key: 'openTime',
    header: 'Hours',
    render: (b) => (
      <span className={styles.hours}>{b.openTime} – {b.closeTime}</span>
    ),
  },
  { key: 'phone',   header: 'Phone'   },
  { key: 'manager', header: 'Manager' },
  {
    key: 'staff',
    header: 'Staff',
    align: 'center' as const,
    render: (b) => <span>{b.staff}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    render: (b) => <StatusBadge status={b.status} statusMap={BRANCH_STATUS_MAP} size="sm" />,
  },
];

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
  const toast      = useToast();
  const canCreate  = useHasPermission('branches:write');

  const { data: branches = [], isLoading, isError } = useGetBranchesQuery();
  const [createBranch, { isLoading: saving }] = useCreateBranchMutation();

  const [modalOpen,   setModal]     = useState(false);
  const [form,        setForm]      = useState<BranchForm>(EMPTY_FORM);
  const [errors,      setErrors]    = useState<FormErrors>({});
  const [geoLoading,  setGeoLoad]   = useState(false);
  const [geoError,    setGeoError]  = useState<string | null>(null);

  const totalStaff = useMemo(() => branches.reduce((a, b) => a + b.staff, 0), [branches]);

  function set(key: keyof BranchForm, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key as keyof FormErrors]) {
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
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
      toast.success(`Branch "${payload.name}" created successfully.`);
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
      heading="Branches"
      description="Manage branch locations, assign managers and configure service areas."
      actions={
        canCreate ? (
          <Button leftIcon={<Building2 size={16} />} onClick={openModal}>
            Add Branch
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
          <span className={styles.count}>{branches.length} branches · {totalStaff} staff</span>
        </div>
        {isLoading && <div className={styles.emptyState}>Loading branches…</div>}
        {isError   && <div className={styles.emptyState}>Failed to load branches.</div>}
        {!isLoading && !isError && <DataTable columns={COLUMNS} data={branches} />}
      </SectionCard>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Add Branch"
        footer={
          <div className={styles.modalFooter}>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleAdd} loading={saving}>Create Branch</Button>
          </div>
        }
      >
        <div className={styles.form}>

          {/* ── Branch details ────────────────────────────────────── */}
          <Input
            label="Branch Name"
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
              label="State"
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
              placeholder="e.g. Telangana"
              error={errors.state}
              required
            />
            <Input
              label="District"
              value={form.district}
              onChange={(e) => set('district', e.target.value)}
              placeholder="e.g. Hyderabad"
              error={errors.district}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Full Address <span className={styles.req}>*</span>
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
              label="Pincode"
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
                {geoLoading ? 'Detecting…' : 'Detect my location'}
              </button>
            </div>
            <div className={styles.twoCol}>
              <Input
                label="Latitude"
                value={form.latitude}
                onChange={(e) => set('latitude', e.target.value)}
                placeholder="e.g. 17.385"
                error={errors.latitude}
                required
              />
              <Input
                label="Longitude"
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
              label="Contact Number"
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
            label="Branch Email"
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
            label="Status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
          />

          {/* ── Branch Admin Account ─────────────────────────────── */}
          <div className={styles.field}>
            <span className={styles.label} style={{ fontWeight: 600 }}>Branch Admin Account</span>
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
    </PageShell>
  );
}
