import { useState, useMemo, useEffect } from 'react';
import { Plus, PhoneCall, CheckCircle, ClipboardList, Inbox, Image, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { useToast } from '@/components/ui/Toast';
import { PricingBreakdown } from './components/PricingBreakdown';
import { SubmissionReviewModal } from './components/SubmissionReviewModal';
import type { CustomerSubmission } from './types';
import type { TableColumn, SelectOption } from '@/types/ui';
import { EnquiryFormDrawer } from './components/EnquiryFormDrawer';
import type { EnquiryFormValues } from './components/EnquiryFormDrawer';
import {
  useGetEnquiriesQuery,
  useLazyGetEnquiryByIdQuery,
  useUpdateEnquiryMutation,
} from './services/enquiriesListApi';
import type { BackendEnquiry, BackendEnquiryStatus, UpdateEnquiryPayload } from './services/enquiriesListApi';
import styles from './EnquiryPage.module.css';

// ── Types ──────────────────────────────────────────────────────────────
type EnquiryStatus  = 'pending' | 'price_confirmed' | 'converted' | 'closed';
type EnquirySource  = 'phone' | 'walk_in' | 'whatsapp' | 'google' | 'referral' | 'insurance_agent' | 'mechanic' | 'other';
type ViewTab        = 'enquiries' | 'submissions';
type StatusFilter   = 'all' | EnquiryStatus;

interface Enquiry {
  id:           string;
  enquiryNo:    string;
  phone:        string;
  customerName: string;
  vehicleNumber:string;
  vehicleModel: string;
  glassType:    string;
  source:       EnquirySource;
  status:       EnquiryStatus;
  quotedPrice:  number | null;
  priceBrand:   string | null;
  closeReason:  string | null;
  closeNotes:   string | null;
  createdAt:    string;
  jobRef:       string | null;
  vehicleBrandId?: string;
  vehicleBrand?:   string;
  vehicleYear?:    string;
  vehicleType?:    'Private' | 'Commercial';
  paymentType?:    'Cash' | 'Insurance';
  insurerName?:    string;
  damageNotes?:    string;
  branchId?:       string;
}

// CustomerSubmission imported from ./types

// ── Backend → frontend mapping ─────────────────────────────────────────
const VALID_SOURCES = new Set<string>([
  'phone', 'walk_in', 'whatsapp', 'google', 'referral', 'insurance_agent', 'mechanic', 'other',
]);

function mapBackendStatus(s: BackendEnquiryStatus): EnquiryStatus {
  switch (s) {
    case 'SUBMITTED': return 'pending';
    case 'CONVERTED': return 'converted';
    case 'LOST':      return 'closed';
    default:          return 'pending';
  }
}

function mapBackendToFrontend(b: BackendEnquiry): Enquiry {
  const srcRaw = b.source ?? '';
  return {
    id:            b.id,
    enquiryNo:     b.enquiryNo ?? `#${b.id.slice(-6).toUpperCase()}`,
    phone:         b.phone,
    customerName:  b.customerName,
    vehicleNumber: b.vehicleReg   ?? '',
    vehicleModel:  [b.vehicleMake, b.vehicleModel, b.vehicleYear].filter(Boolean).join(' '),
    glassType:     b.glassType    ?? '',
    source:        (VALID_SOURCES.has(srcRaw) ? srcRaw : 'other') as EnquirySource,
    status:        mapBackendStatus(b.status),
    quotedPrice:   b.quotedPrice  ?? null,
    priceBrand:    b.priceBrand   ?? null,
    closeReason:   b.closeReason  ?? null,
    closeNotes:    b.closeNotes   ?? null,
    createdAt:     b.createdAt,
    jobRef:        b.jobRef       ?? null,
    vehicleBrandId: b.carBrandId  ?? undefined,
    vehicleBrand:   b.vehicleMake ?? undefined,
    vehicleYear:    b.vehicleYear != null ? String(b.vehicleYear) : undefined,
    vehicleType:    (b.vehicleType as Enquiry['vehicleType']) ?? undefined,
    paymentType:    (b.paymentType as Enquiry['paymentType']) ?? undefined,
    insurerName:    b.insurerName  ?? undefined,
    damageNotes:    b.notes        ?? undefined,
    branchId:       b.branchId     ?? undefined,
  };
}

function mapBackendToFormValues(b: BackendEnquiry): Partial<EnquiryFormValues> {
  return {
    customerName:    b.customerName    ?? '',
    phone:           b.phone           ?? '',
    branchId:        b.branchId        ?? '',
    source:          b.source          ?? '',
    // vehicle — brand/model IDs from catalog
    vehicleBrandId:  b.carBrandId      ?? '',
    vehicleBrand:    b.vehicleMake     ?? '',
    vehicleModelId:  b.carModelId      ?? '',
    vehicleModel:    b.vehicleModel    ?? '',
    // vehicleYear is a number from backend; form expects string for <select>
    vehicleYear:     b.vehicleYear != null ? String(b.vehicleYear) : '',
    vehicleNumber:   b.vehicleReg      ?? '',
    vehicleType:     (b.vehicleType as EnquiryFormValues['vehicleType']) ?? '',
    // catalog cascade IDs
    variantId:       b.carModelVariantId ?? '',
    glassTypeId:     b.glassPartTypeId   ?? '',
    glassType:       b.glassType         ?? '',
    serviceType:     (b.serviceType as EnquiryFormValues['serviceType']) ?? '',
    // bodyType from backend is a single string; form holds it as string[]
    modelBodyType:   b.bodyType ? [b.bodyType] : [],
    paymentType:     (b.paymentType as EnquiryFormValues['paymentType']) ?? '',
    insurerName:     b.insurerName     ?? '',
    accidentDate:    b.accidentDate    ?? '',
    // preferredDate comes as full ISO datetime — slice to YYYY-MM-DD for <input type="date">
    appointmentDate: b.preferredDate ? b.preferredDate.slice(0, 10) : '',
    damageNotes:     b.notes           ?? '',
  };
}

// ── Counter for locally-created enquiries (pre-write-API) ──────────────
let nextEnqNum = 1058;

const INITIAL_SUBMISSIONS: CustomerSubmission[] = [
  {
    id: 'sub-001', phone: '9876541234', name: 'Karthik Rao',
    vehicleNo: 'AP 10 AB 5678', vehicleMake: 'Maruti', vehicleModel: 'Baleno', vehicleYear: 2022,
    glassType: 'Front Windshield', glassPosition: 'Front Windshield',
    description: 'Stone chip — small crack spreading from impact point. Noticed yesterday morning.',
    submittedAt: '2026-06-30T08:10:00Z',
    photoCount: 3, rcUploaded: false, whatsappVerified: true,
    preferredBranch: 'Hyderabad Main Branch',
    paymentPreference: 'insurance',
    insuranceInsurer: 'HDFC Ergo', insurancePolicyNo: 'HDFC-2024-KB-5432',
  },
  {
    id: 'sub-002', phone: '9876548765', name: 'Fatima Sheikh',
    vehicleNo: 'TN 22 CD 9012', vehicleMake: 'Hyundai', vehicleModel: 'Creta', vehicleYear: 2023,
    glassType: 'Rear Windshield', glassPosition: 'Rear Windshield',
    description: 'Complete shatter due to accident. Vehicle is currently at home. Urgent.',
    submittedAt: '2026-06-30T07:45:00Z',
    photoCount: 0, rcUploaded: true, whatsappVerified: false,
    preferredBranch: 'Chennai East Branch',
    paymentPreference: 'insurance',
    insuranceInsurer: 'New India Assurance',
  },
  {
    id: 'sub-003', phone: '9876542233', name: 'Ramesh Patil',
    vehicleNo: 'MH 14 PQ 3344', vehicleMake: 'Tata', vehicleModel: 'Harrier', vehicleYear: 2023,
    glassType: 'Driver Side Window', glassPosition: 'Driver Side Window',
    description: 'Crack on driver window — noticed after parking lot incident. Need urgent replacement.',
    submittedAt: '2026-06-30T06:55:00Z',
    photoCount: 5, rcUploaded: true, whatsappVerified: true,
    preferredBranch: 'Pune Central Branch',
    paymentPreference: 'cash',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── Confirm Price Modal ───────────────────────────────────────────────
interface ConfirmPriceModalProps {
  isOpen:  boolean;
  onClose: () => void;
  enquiry: Enquiry | null;
  onSave:  (price: number, brand: string) => void;
}

function ConfirmPriceModal({ isOpen, onClose, enquiry, onSave }: ConfirmPriceModalProps) {
  const { t } = useTranslation(['enquiry', 'common']);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState('');

  function handleClose() {
    setSelectedPrice(null);
    setSelectedBrand('');
    onClose();
  }

  function handleSave() {
    if (!selectedPrice) return;
    onSave(selectedPrice, selectedBrand);
    setSelectedPrice(null);
    setSelectedBrand('');
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('page.confirmPriceModal.title')}
      maxWidth="640px"
      footer={
        <div className={styles.modalFooter}>
          <Button variant="ghost" onClick={handleClose}>{'Cancel'}</Button>
          <Button onClick={handleSave} disabled={!selectedPrice}>
            {selectedPrice
              ? t('page.confirmPriceModal.confirmWith', { price: selectedPrice.toLocaleString('en-IN'), brand: selectedBrand })
              : t('page.confirmPriceModal.selectHint')}
          </Button>
        </div>
      }
    >
      <div className={styles.form}>
        {enquiry && (
          <div className={styles.enquiryMeta}>
            <span className={styles.enquiryMetaNo}>{enquiry.enquiryNo}</span>
            <span>{enquiry.customerName} · {enquiry.vehicleModel}</span>
            <span className={styles.enquiryMetaGlass}>{enquiry.glassType}</span>
          </div>
        )}
        {enquiry && (
          <PricingBreakdown
            glassType={enquiry.glassType}
            vehicleModel={enquiry.vehicleModel}
            onSelect={(price, brand) => { setSelectedPrice(price); setSelectedBrand(brand); }}
          />
        )}
      </div>
    </Modal>
  );
}

// ── Close Enquiry Modal ───────────────────────────────────────────────
interface CloseModalProps {
  isOpen:  boolean;
  onClose: () => void;
  enquiry: Enquiry | null;
  onSave:  (reason: string, notes: string) => void;
}

function CloseEnquiryModal({ isOpen, onClose, enquiry, onSave }: CloseModalProps) {
  const { t } = useTranslation(['enquiry', 'common']);
  const [reason, setReason] = useState('declined_price');
  const [notes,  setNotes]  = useState('');

  const CLOSE_REASON_OPTIONS: SelectOption[] = [
    { value: 'declined_price',  label: t('page.closeReasons.declined_price')  },
    { value: 'found_vendor',    label: t('page.closeReasons.found_vendor')    },
    { value: 'wrong_number',    label: t('page.closeReasons.wrong_number')    },
    { value: 'test_spam',       label: t('page.closeReasons.test_spam')       },
    { value: 'other_channel',   label: t('page.closeReasons.other_channel')   },
    { value: 'other',           label: t('page.closeReasons.other')           },
  ];

  function handleSave() {
    onSave(reason, notes);
    setReason('declined_price');
    setNotes('');
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { onClose(); setReason('declined_price'); setNotes(''); }}
      title={t('page.closeModal.title')}
      maxWidth="440px"
      footer={
        <div className={styles.modalFooter}>
          <Button variant="ghost" onClick={onClose}>{t('common:actions.cancel')}</Button>
          <Button variant="danger" onClick={handleSave}>{t('page.closeModal.confirm')}</Button>
        </div>
      }
    >
      <div className={styles.form}>
        {enquiry && (
          <div className={styles.enquiryMeta}>
            <span className={styles.enquiryMetaNo}>{enquiry.enquiryNo}</span>
            <span>{enquiry.customerName} · {enquiry.vehicleModel}</span>
          </div>
        )}
        <Select
          label={t('page.closeModal.reasonLabel')}
          options={CLOSE_REASON_OPTIONS}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Input
          label={t('page.closeModal.notesLabel')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('page.closeModal.notesPlaceholder')}
          fullWidth
        />
      </div>
    </Modal>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export function EnquiryPage() {
  const { t } = useTranslation(['enquiry', 'common']);
  const toast = useToast();

  const [viewTab,    setViewTab]   = useState<ViewTab>('enquiries');
  const [enquiries,  setEnquiries] = useState<Enquiry[]>([]);
  const [submissions,setSubs]      = useState<CustomerSubmission[]>(INITIAL_SUBMISSIONS);
  const [filter,     setFilter]    = useState<StatusFilter>('all');
  const [page,       setPage]      = useState(1);
  const [formOpen,    setFormOpen]  = useState(false);
  const [formMode,    setFormMode]  = useState<'create' | 'complete' | 'update'>('create');
  const [formInitial, setFormInit]  = useState<Partial<EnquiryFormValues> | undefined>();
  const [formEnqId,   setFormEnqId] = useState<string | undefined>();
  const [formEnqNo,   setFormEnqNo] = useState<string | undefined>();
  const [editLoading, setEditLoading] = useState(false);
  const [priceTgt,   setPriceTgt]  = useState<Enquiry | null>(null);
  const [closeTgt,   setCloseTgt]  = useState<Enquiry | null>(null);
  const [reviewSub,  setReviewSub] = useState<CustomerSubmission | null>(null);

  // ── List API ──────────────────────────────────────────────────────────
  const LIMIT = 20;

  // price_confirmed is a local-only status (no backend equivalent).
  // Send SUBMITTED to the backend so those records are fetched,
  // then the local `filtered` memo narrows to price_confirmed rows.
  const apiStatus: BackendEnquiryStatus | undefined =
    filter === 'pending'         ? 'SUBMITTED' :
    filter === 'price_confirmed' ? 'SUBMITTED' :
    filter === 'converted'       ? 'CONVERTED' :
    filter === 'closed'          ? 'LOST'      : undefined;

  const {
    data:      listResponse,
    isLoading: listLoading,
    isError:   listError,
  } = useGetEnquiriesQuery({
    page,
    limit:     LIMIT,
    sortBy:    'createdAt',
    sortOrder: 'desc',
    ...(apiStatus ? { status: apiStatus } : {}),
  });

  const [triggerGetById] = useLazyGetEnquiryByIdQuery();
  const [updateEnquiry, { isLoading: updateSaving }] = useUpdateEnquiryMutation();

  useEffect(() => {
    if (listResponse?.data) {
      setEnquiries(listResponse.data.map(mapBackendToFrontend));
    }
  }, [listResponse]);

  // ── i18n-driven constants ─────────────────────────────────────────────
  const CLOSE_REASON_OPTIONS: SelectOption[] = useMemo(() => [
    { value: 'declined_price',  label: t('page.closeReasons.declined_price')  },
    { value: 'found_vendor',    label: t('page.closeReasons.found_vendor')    },
    { value: 'wrong_number',    label: t('page.closeReasons.wrong_number')    },
    { value: 'test_spam',       label: t('page.closeReasons.test_spam')       },
    { value: 'other_channel',   label: t('page.closeReasons.other_channel')   },
    { value: 'other',           label: t('page.closeReasons.other')           },
  ], [t]);

  const CLOSE_REASON_LABEL = useMemo(
    () => Object.fromEntries(CLOSE_REASON_OPTIONS.map((r) => [r.value, r.label])),
    [CLOSE_REASON_OPTIONS],
  );

  const STATUS_DISPLAY = useMemo(() => ({
    pending:         { label: t('page.status.pending'),         variant: 'info'    as const },
    price_confirmed: { label: t('page.status.priceConfirmed'),  variant: 'warning' as const },
    converted:       { label: t('page.status.converted'),       variant: 'success' as const },
    closed:          { label: t('page.status.closed'),          variant: 'neutral' as const },
  }), [t]);

  const FILTER_TABS: { id: StatusFilter; label: string }[] = useMemo(() => [
    { id: 'all',             label: t('page.filters.all')           },
    { id: 'pending',         label: t('page.filters.pending')       },
    { id: 'price_confirmed', label: t('page.filters.priceConfirmed') },
    { id: 'converted',       label: t('page.filters.converted')     },
    { id: 'closed',          label: t('page.filters.closed')        },
  ], [t]);

  const filtered = useMemo(
    () => filter === 'all' ? enquiries : enquiries.filter((e) => e.status === filter),
    [enquiries, filter],
  );

  async function handleFormSave(values: EnquiryFormValues) {
    if (formMode === 'update' && formEnqId) {
      // Build payload: only include non-empty fields to avoid overwriting existing data.
      // Map frontend field names → backend field names where they differ.
      const patch: UpdateEnquiryPayload = { id: formEnqId };
      if (values.customerName.trim())   patch.customerName       = values.customerName.trim();
      if (values.phone)                 patch.phone              = values.phone;
      if (values.vehicleBrand)          patch.vehicleMake        = values.vehicleBrand;
      if (values.vehicleModel)          patch.vehicleModel       = values.vehicleModel;
      if (values.vehicleYear)           patch.vehicleYear        = parseInt(values.vehicleYear, 10);
      if (values.vehicleNumber)         patch.vehicleReg         = values.vehicleNumber;
      if (values.glassType)             patch.glassType          = values.glassType;
      if (values.serviceType)           patch.serviceType        = values.serviceType;
      if (values.vehicleType)           patch.vehicleType        = values.vehicleType;
      if (values.source)                patch.source             = values.source;
      if (values.paymentType)           patch.paymentType        = values.paymentType;
      if (values.insurerName)           patch.insurerName        = values.insurerName;
      if (values.accidentDate)          patch.accidentDate       = values.accidentDate;
      if (values.appointmentDate)       patch.preferredDate      = values.appointmentDate;
      if (values.damageNotes)           patch.notes              = values.damageNotes;
      // catalog IDs — only send when user actually picked values in the cascade
      if (values.vehicleBrandId)        patch.carBrandId         = values.vehicleBrandId;
      if (values.vehicleModelId)        patch.carModelId         = values.vehicleModelId;
      if (values.variantId)             patch.carModelVariantId  = values.variantId;
      if (values.glassTypeId)           patch.glassPartTypeId    = values.glassTypeId;
      // bodyType: first entry from the model metadata array (e.g. "LMV")
      if (values.modelBodyType.length > 0) patch.bodyType        = values.modelBodyType[0];

      const result = await updateEnquiry(patch);

      if ('error' in result) {
        const err = result.error as { status?: number; data?: { message?: string } };
        if (err?.status === 404) {
          toast.error('Enquiry not found — it may have been removed.');
          setFormOpen(false);
          setFormInit(undefined);
          setFormEnqId(undefined);
          setFormEnqNo(undefined);
        } else if (err?.status === 400) {
          toast.error('Only submitted enquiries can be updated.');
        } else {
          toast.error('Update failed — please check your connection and try again.');
        }
        return;
      }

      // Merge server response into local row, preserving local-only workflow state
      // (price_confirmed status, quotedPrice, closeReason, jobRef) that has no write API yet.
      const serverRow = mapBackendToFrontend(result.data);
      setEnquiries((prev) => prev.map((e) =>
        e.id === serverRow.id
          ? { ...serverRow, status: e.status, quotedPrice: e.quotedPrice, priceBrand: e.priceBrand, closeReason: e.closeReason, closeNotes: e.closeNotes, jobRef: e.jobRef }
          : e,
      ));
      toast.success(`${formEnqNo ?? serverRow.enquiryNo} updated`);
      setFormOpen(false);
      setFormInit(undefined);
      setFormEnqId(undefined);
      setFormEnqNo(undefined);
      return;
    } else {
      const displayModel = [values.vehicleBrand, values.vehicleModel, values.vehicleYear].filter(Boolean).join(' ') || 'TBD';
      const e: Enquiry = {
        id:            `enq-${Date.now()}`,
        enquiryNo:     `ENQ-${nextEnqNum++}`,
        phone:         values.phone,
        customerName:  values.customerName,
        vehicleNumber: values.vehicleNumber,
        vehicleModel:  displayModel,
        glassType:     values.glassType || 'Front Windshield',
        source:        (values.source as EnquirySource) || 'phone',
        status:        'pending',
        quotedPrice:   null,
        priceBrand:    null,
        closeReason:   null,
        closeNotes:    null,
        createdAt:     new Date().toISOString(),
        jobRef:        null,
        vehicleBrandId: values.vehicleBrandId || undefined,
        vehicleBrand:   values.vehicleBrand   || undefined,
        vehicleYear:    values.vehicleYear     || undefined,
        vehicleType:    values.vehicleType     || undefined,
        paymentType:    values.paymentType     || undefined,
        insurerName:    values.insurerName     || undefined,
        damageNotes:    values.damageNotes     || undefined,
        branchId:       values.branchId        || undefined,
      };
      setEnquiries((prev) => [e, ...prev]);
      toast.success(t('page.toast.enquiryCreated', { enquiryNo: e.enquiryNo }));
    }
    setFormOpen(false);
    setFormInit(undefined);
    setFormEnqId(undefined);
    setFormEnqNo(undefined);
  }

  async function openEditForm(enq: Enquiry) {
    setEditLoading(true);
    try {
      const result = await triggerGetById(enq.id);
      if (result.isError) {
        const err = result.error as { status?: number };
        if (err?.status === 404) {
          toast.error('Enquiry not found — it may have been removed.');
        } else {
          toast.error('Could not load enquiry details. Please try again.');
        }
        return;
      }
      const detail = result.data!;
      const mapped = mapBackendToFrontend(detail);
      setFormInit(mapBackendToFormValues(detail));
      setFormMode('update');
      setFormEnqId(detail.id);
      setFormEnqNo(mapped.enquiryNo);
      setFormOpen(true);
    } finally {
      setEditLoading(false);
    }
  }

  function handleFilterChange(newFilter: StatusFilter) {
    setFilter(newFilter);
    setPage(1);
  }

  function handleConfirmPrice(price: number, brand: string) {
    if (!priceTgt) return;
    setEnquiries((prev) =>
      prev.map((e) =>
        e.id === priceTgt.id
          ? { ...e, status: 'price_confirmed', quotedPrice: price, priceBrand: brand }
          : e,
      ),
    );
    toast.success(t('page.toast.priceConfirmed', { price: price.toLocaleString('en-IN'), brand, enquiryNo: priceTgt.enquiryNo }));
    setPriceTgt(null);
  }

  function handleClose(reason: string, notes: string) {
    if (!closeTgt) return;
    setEnquiries((prev) =>
      prev.map((e) =>
        e.id === closeTgt.id
          ? { ...e, status: 'closed', closeReason: reason, closeNotes: notes || null }
          : e,
      ),
    );
    toast.success(t('page.toast.enquiryClosed', { enquiryNo: closeTgt.enquiryNo }));
    setCloseTgt(null);
  }

  function handleConvert(enquiry: Enquiry) {
    // TODO (backend): POST /jobs with enquiry payload; get back jobId
    const mockRef = `JC-2026-0${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
    setEnquiries((prev) =>
      prev.map((e) => e.id === enquiry.id ? { ...e, status: 'converted', jobRef: mockRef } : e),
    );
    toast.success(t('page.toast.converted', { enquiryNo: enquiry.enquiryNo, jobRef: mockRef }));
  }

  function handleCreateFromSubmission(sub: CustomerSubmission) {
    setFormInit({
      customerName:  sub.name,
      phone:         sub.phone,
      vehicleNumber: sub.vehicleNo,
      vehicleModel:  sub.vehicleModel,
      vehicleYear:   String(sub.vehicleYear),
      glassType:     sub.glassPosition ?? sub.glassType,
      paymentType:   sub.paymentPreference === 'cash'      ? 'Cash'
                   : sub.paymentPreference === 'insurance' ? 'Insurance' : '',
      insurerName:   sub.insuranceInsurer ?? '',
      damageNotes:   sub.description,
      source:        'whatsapp',
    });
    setFormMode('complete');
    setFormEnqId(undefined);
    setSubs((prev) => prev.filter((s) => s.id !== sub.id));
    setViewTab('enquiries');
    setFormOpen(true);
  }

  function handleDismissSubmission(id: string) {
    setSubs((prev) => prev.filter((s) => s.id !== id));
    toast.success(t('page.toast.submissionDismissed'));
  }

  const pendingCount   = enquiries.filter((e) => e.status === 'pending').length;
  const confirmedCount = enquiries.filter((e) => e.status === 'price_confirmed').length;

  // ── Enquiry table columns ──────────────────────────────────────────
  const columns: TableColumn<Enquiry>[] = useMemo(() => [
    {
      key: 'enquiryNo',
      header: t('page.columns.enquiry'),
      width: '115px',
      render: (e) => (
        <div>
          <div className={styles.enquiryNo}>{e.enquiryNo}</div>
          <div className={styles.timeAgo}>{fmtDate(e.createdAt)}</div>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: t('page.columns.customer'),
      render: (e) => (
        <div>
          <div className={styles.cellBold}>{e.customerName}</div>
          <div className={styles.cellMuted}>+91 {e.phone}</div>
        </div>
      ),
    },
    {
      key: 'vehicleModel',
      header: t('page.columns.vehicle'),
      render: (e) => (
        <div>
          <div className={styles.cellBold}>{e.vehicleModel}</div>
          <div className={styles.cellMuted}>{e.vehicleNumber}</div>
        </div>
      ),
    },
    { key: 'glassType', header: t('page.columns.glassType') },
    {
      key: 'quotedPrice',
      header: t('page.columns.price'),
      align: 'right' as const,
      render: (e) => (
        <div className={styles.priceGroup}>
          {e.quotedPrice != null
            ? <span className={styles.priceCell}>₹{e.quotedPrice.toLocaleString('en-IN')}</span>
            : <span className={styles.priceCell}>—</span>}
          {e.priceBrand && (
            <span className={styles.brandChip}>{e.priceBrand}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: t('page.columns.status'),
      render: (e) => {
        const d = STATUS_DISPLAY[e.status];
        return <Badge label={d.label} variant={d.variant} size="sm" />;
      },
    },
    {
      key: 'id',
      header: t('page.columns.actions'),
      render: (e) => (
        <div className={styles.actionCell}>
          {e.status === 'pending' && (
            <>
              <Button size="sm" variant="ghost" onClick={() => { void openEditForm(e); }} disabled={editLoading}>Edit</Button>
              <Button size="sm" onClick={() => setPriceTgt(e)}>{t('page.actions.confirmPrice')}</Button>
              <Button size="sm" variant="ghost" onClick={() => setCloseTgt(e)}>{t('page.actions.close')}</Button>
            </>
          )}
          {e.status === 'price_confirmed' && (
            <>
              <Button size="sm" variant="ghost" onClick={() => { void openEditForm(e); }} disabled={editLoading}>Edit</Button>
              <Button size="sm" variant="primary" onClick={() => handleConvert(e)}>{t('page.actions.convertToJob')}</Button>
              <Button size="sm" variant="ghost" onClick={() => setCloseTgt(e)}>{t('page.actions.close')}</Button>
            </>
          )}
          {e.status === 'converted' && (
            <span className={styles.jobChip}>
              <ClipboardList size={12} />
              {e.jobRef}
            </span>
          )}
          {e.status === 'closed' && (
            <span className={styles.closedReason}>
              {CLOSE_REASON_LABEL[e.closeReason ?? ''] ?? e.closeReason}
            </span>
          )}
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, STATUS_DISPLAY, CLOSE_REASON_LABEL]);

  // ── Submission table columns ───────────────────────────────────────
  const subColumns: TableColumn<CustomerSubmission>[] = useMemo(() => [
    {
      key: 'submittedAt',
      header: t('page.columns.received'),
      width: '100px',
      render: (s) => <div className={styles.timeAgo}>{fmtDate(s.submittedAt)}</div>,
    },
    {
      key: 'name',
      header: t('page.columns.customer'),
      render: (s) => (
        <div>
          <div className={styles.cellBold}>{s.name}</div>
          <div className={styles.cellMuted}>+91 {s.phone}</div>
        </div>
      ),
    },
    {
      key: 'vehicleModel',
      header: t('page.columns.vehicle'),
      render: (s) => (
        <div>
          <div className={styles.cellBold}>{s.vehicleMake} {s.vehicleModel} {s.vehicleYear}</div>
          <div className={styles.cellMuted}>{s.vehicleNo}</div>
        </div>
      ),
    },
    { key: 'glassType', header: t('page.columns.glass') },
    {
      key: 'description',
      header: t('page.columns.description'),
      render: (s) => (
        <div className={styles.subDesc}>
          <span>{s.description.slice(0, 70)}{s.description.length > 70 ? '…' : ''}</span>
          {s.photoCount > 0 && (
            <span className={styles.photoChip}><Image size={11} /> {s.photoCount} {t('page.columns.photos')}</span>
          )}
        </div>
      ),
    },
    {
      key: 'id',
      header: t('page.columns.actions'),
      render: (s) => (
        <div className={styles.actionCell}>
          <Button size="sm" variant="secondary" leftIcon={<Eye size={13} />} onClick={() => setReviewSub(s)}>
            {t('page.actions.review')}
          </Button>
          <Button size="sm" onClick={() => handleCreateFromSubmission(s)}>
            {t('page.actions.createEnquiry')}
          </Button>
        </div>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t]);

  return (
    <PageShell
      heading={t('page.heading')}
      description={t('page.description')}
      actions={
        viewTab === 'enquiries' ? (
          <Button leftIcon={<Plus size={16} />} onClick={() => { setFormMode('create'); setFormInit(undefined); setFormEnqId(undefined); setFormOpen(true); }}>
            {t('page.actions.newEnquiry')}
          </Button>
        ) : undefined
      }
    >
      {/* View switcher */}
      <div className={styles.viewTabs}>
        <button
          className={`${styles.viewTab} ${viewTab === 'enquiries' ? styles.viewTabActive : ''}`}
          onClick={() => setViewTab('enquiries')}
        >
          {t('page.tabs.enquiries')}
        </button>
        <button
          className={`${styles.viewTab} ${viewTab === 'submissions' ? styles.viewTabActive : ''}`}
          onClick={() => setViewTab('submissions')}
        >
          <Inbox size={14} />
          {t('page.tabs.submissions')}
          {submissions.length > 0 && (
            <span className={styles.viewTabBadge}>{submissions.length}</span>
          )}
        </button>
      </div>

      {viewTab === 'enquiries' ? (
        <>
          {/* Quick summary chips */}
          <div className={styles.summaryRow}>
            <div className={styles.summaryChip}>
              <PhoneCall size={13} />
              {t('page.summary.pending', { count: pendingCount })}
            </div>
            <div className={`${styles.summaryChip} ${styles.confirmedChip}`}>
              <CheckCircle size={13} />
              {t('page.summary.confirmed', { count: confirmedCount })}
            </div>
          </div>

          <SectionCard>
            {/* Status filter tabs */}
            <div className={styles.filterBar}>
              {FILTER_TABS.map((tab) => {
                const count = tab.id === 'all'
                  ? (listResponse?.total ?? enquiries.length)
                  : enquiries.filter((e) => e.status === tab.id).length;
                return (
                  <button
                    key={tab.id}
                    className={`${styles.filterTab} ${filter === tab.id ? styles.filterActive : ''}`}
                    onClick={() => handleFilterChange(tab.id)}
                  >
                    {tab.label}
                    <span className={styles.tabCount}>{count}</span>
                  </button>
                );
              })}
            </div>

            {listError && (
              <AlertBanner
                variant="error"
                message="Failed to load enquiries. Please check your connection and try again."
              />
            )}

            <DataTable
              columns={columns}
              data={filtered}
              isLoading={listLoading}
              emptyMessage={t('page.emptyFilter')}
            />

            {!listLoading && !listError && listResponse && listResponse.total > LIMIT && (
              <div className={styles.paginationRow}>
                <span className={styles.paginationInfo}>
                  {`${Math.min((page - 1) * LIMIT + 1, listResponse.total)}–${Math.min(page * LIMIT, listResponse.total)} of ${listResponse.total}`}
                </span>
                <div className={styles.paginationBtns}>
                  <button
                    className={styles.pageBtn}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    ← Prev
                  </button>
                  <button
                    className={styles.pageBtn}
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * LIMIT >= listResponse.total}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </SectionCard>
        </>
      ) : (
        <SectionCard>
          {submissions.length === 0 ? (
            <div className={styles.subEmpty}>
              <Inbox size={36} />
              <p>{t('page.noSubmissions')}</p>
            </div>
          ) : (
            <DataTable
              columns={subColumns}
              data={submissions}
              emptyMessage={t('page.noSubmissions')}
            />
          )}
        </SectionCard>
      )}

      <EnquiryFormDrawer
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setFormInit(undefined); setFormEnqId(undefined); setFormEnqNo(undefined); }}
        onSave={(v) => { void handleFormSave(v); }}
        initialValues={formInitial}
        mode={formMode}
        enquiryNo={formMode === 'update' ? formEnqNo : undefined}
        isSaving={formMode === 'update' && updateSaving}
      />
      <ConfirmPriceModal
        isOpen={!!priceTgt}
        onClose={() => setPriceTgt(null)}
        enquiry={priceTgt}
        onSave={handleConfirmPrice}
      />
      <CloseEnquiryModal
        isOpen={!!closeTgt}
        onClose={() => setCloseTgt(null)}
        enquiry={closeTgt}
        onSave={handleClose}
      />
      <SubmissionReviewModal
        submission={reviewSub}
        isOpen={!!reviewSub}
        onClose={() => setReviewSub(null)}
        onConvert={handleCreateFromSubmission}
        onDismiss={handleDismissSubmission}
      />
    </PageShell>
  );
}
