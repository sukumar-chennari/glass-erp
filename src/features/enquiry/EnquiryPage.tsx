import { useState, useMemo } from 'react';
import { Plus, PhoneCall, CheckCircle, ClipboardList } from 'lucide-react';
import { PageShell, SectionCard } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import type { TableColumn, SelectOption } from '@/types/ui';
import styles from './EnquiryPage.module.css';

// ── Types ──────────────────────────────────────────────────────────────
type EnquiryStatus = 'pending' | 'price_confirmed' | 'converted' | 'closed';
type EnquirySource = 'phone' | 'walk_in' | 'whatsapp';

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
  closeReason:  string | null;
  closeNotes:   string | null;
  createdAt:    string;
  jobRef:       string | null;
}

// ── Constants ──────────────────────────────────────────────────────────
const GLASS_OPTIONS: SelectOption[] = [
  { value: 'Front Windshield',      label: 'Front Windshield' },
  { value: 'Rear Windshield',       label: 'Rear Windshield' },
  { value: 'Driver Side Window',    label: 'Driver Side Window' },
  { value: 'Passenger Side Window', label: 'Passenger Side Window' },
  { value: 'Rear Left Window',      label: 'Rear Left Window' },
  { value: 'Rear Right Window',     label: 'Rear Right Window' },
  { value: 'Sunroof Glass',         label: 'Sunroof Glass' },
  { value: 'Quarter Glass',         label: 'Quarter Glass' },
];

const SOURCE_OPTIONS: SelectOption[] = [
  { value: 'phone',    label: 'Phone Call' },
  { value: 'walk_in',  label: 'Walk-in' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

const CLOSE_REASON_OPTIONS: SelectOption[] = [
  { value: 'declined_price',  label: 'Customer declined price' },
  { value: 'found_vendor',    label: 'Found another vendor' },
  { value: 'wrong_number',    label: 'Wrong number' },
  { value: 'test_spam',       label: 'Test / spam enquiry' },
  { value: 'other_channel',   label: 'Converted via other channel' },
  { value: 'other',           label: 'Other' },
];

const CLOSE_REASON_LABEL: Record<string, string> = Object.fromEntries(
  CLOSE_REASON_OPTIONS.map((r) => [r.value, r.label]),
);

const STATUS_DISPLAY: Record<EnquiryStatus, { label: string; variant: 'info' | 'warning' | 'success' | 'neutral' }> = {
  pending:         { label: 'Pending',         variant: 'info'    },
  price_confirmed: { label: 'Price Confirmed', variant: 'warning' },
  converted:       { label: 'Converted',       variant: 'success' },
  closed:          { label: 'Closed',          variant: 'neutral' },
};

// ── Mock Data ──────────────────────────────────────────────────────────
let nextEnqNum = 1058;

const INITIAL_ENQUIRIES: Enquiry[] = [
  {
    id: 'enq-001', enquiryNo: 'ENQ-1057',
    phone: '9876543210', customerName: 'Ravi Kumar',
    vehicleNumber: 'DL 01 AB 1234', vehicleModel: 'Honda City 2020',
    glassType: 'Front Windshield', source: 'phone',
    status: 'pending', quotedPrice: null, closeReason: null, closeNotes: null,
    createdAt: '2026-06-29T09:15:00Z', jobRef: null,
  },
  {
    id: 'enq-002', enquiryNo: 'ENQ-1056',
    phone: '9876543211', customerName: 'Priya Sharma',
    vehicleNumber: 'HR 26 CD 5678', vehicleModel: 'Maruti Swift 2018',
    glassType: 'Rear Windshield', source: 'whatsapp',
    status: 'price_confirmed', quotedPrice: 4200, closeReason: null, closeNotes: null,
    createdAt: '2026-06-29T08:30:00Z', jobRef: null,
  },
  {
    id: 'enq-003', enquiryNo: 'ENQ-1055',
    phone: '9876543212', customerName: 'Mohan Singh',
    vehicleNumber: 'UP 07 EF 9012', vehicleModel: 'Hyundai i20 2021',
    glassType: 'Driver Side Window', source: 'walk_in',
    status: 'converted', quotedPrice: 3800, closeReason: null, closeNotes: null,
    createdAt: '2026-06-29T07:45:00Z', jobRef: 'JC-2025-0847',
  },
  {
    id: 'enq-004', enquiryNo: 'ENQ-1054',
    phone: '9876543213', customerName: 'Anjali Verma',
    vehicleNumber: 'MH 02 GH 3456', vehicleModel: 'Toyota Innova 2022',
    glassType: 'Sunroof Glass', source: 'phone',
    status: 'closed', quotedPrice: 12500, closeReason: 'declined_price', closeNotes: 'Too expensive',
    createdAt: '2026-06-28T16:00:00Z', jobRef: null,
  },
  {
    id: 'enq-005', enquiryNo: 'ENQ-1053',
    phone: '9876543214', customerName: 'Suresh Reddy',
    vehicleNumber: 'TS 09 IJ 7890', vehicleModel: 'Kia Seltos 2023',
    glassType: 'Front Windshield', source: 'whatsapp',
    status: 'pending', quotedPrice: null, closeReason: null, closeNotes: null,
    createdAt: '2026-06-28T14:20:00Z', jobRef: null,
  },
  {
    id: 'enq-006', enquiryNo: 'ENQ-1052',
    phone: '9876543215', customerName: 'Kavita Nair',
    vehicleNumber: 'KL 07 MN 2345', vehicleModel: 'Tata Nexon EV 2023',
    glassType: 'Quarter Glass', source: 'phone',
    status: 'price_confirmed', quotedPrice: 2100, closeReason: null, closeNotes: null,
    createdAt: '2026-06-28T11:30:00Z', jobRef: null,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── Sub-modals ─────────────────────────────────────────────────────────
interface CreateModalProps {
  isOpen:  boolean;
  onClose: () => void;
  onSave:  (e: Omit<Enquiry, 'id' | 'enquiryNo' | 'status' | 'quotedPrice' | 'closeReason' | 'closeNotes' | 'createdAt' | 'jobRef'>) => void;
}

function CreateEnquiryModal({ isOpen, onClose, onSave }: CreateModalProps) {
  const [form, setForm] = useState({
    phone: '', customerName: '', vehicleNumber: '', vehicleModel: '',
    glassType: 'Front Windshield', source: 'phone' as EnquirySource,
  });

  function f(key: keyof typeof form, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function handleSave() {
    if (!form.phone || !form.customerName.trim() || !form.vehicleNumber.trim() || !form.vehicleModel.trim()) return;
    onSave(form);
    setForm({ phone: '', customerName: '', vehicleNumber: '', vehicleModel: '', glassType: 'Front Windshield', source: 'phone' });
  }

  const canSave =
    form.phone.length === 10 &&
    !!form.customerName.trim() &&
    !!form.vehicleNumber.trim() &&
    !!form.vehicleModel.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Enquiry"
      footer={
        <div className={styles.modalFooter}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave}>Create Enquiry</Button>
        </div>
      }
    >
      <div className={styles.form}>
        <div className={styles.phoneRow}>
          <span className={styles.phonePrefix}>+91</span>
          <Input
            label="Phone Number"
            type="tel"
            value={form.phone}
            onChange={(e) => f('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit number"
            fullWidth
            autoFocus
          />
        </div>
        <Input
          label="Customer Name"
          value={form.customerName}
          onChange={(e) => f('customerName', e.target.value)}
          fullWidth
          required
        />
        <div className={styles.twoCol}>
          <Input
            label="Vehicle Number"
            value={form.vehicleNumber}
            onChange={(e) => f('vehicleNumber', e.target.value.toUpperCase())}
            placeholder="DL 01 AB 1234"
          />
          <Input
            label="Vehicle Model"
            value={form.vehicleModel}
            onChange={(e) => f('vehicleModel', e.target.value)}
            placeholder="Honda City 2020"
          />
        </div>
        <div className={styles.twoCol}>
          <Select label="Glass Type" options={GLASS_OPTIONS} value={form.glassType} onChange={(e) => f('glassType', e.target.value)} />
          <Select label="Source" options={SOURCE_OPTIONS} value={form.source} onChange={(e) => f('source', e.target.value as EnquirySource)} />
        </div>
      </div>
    </Modal>
  );
}

interface ConfirmPriceModalProps {
  isOpen:   boolean;
  onClose:  () => void;
  enquiry:  Enquiry | null;
  onSave:   (price: number) => void;
}

function ConfirmPriceModal({ isOpen, onClose, enquiry, onSave }: ConfirmPriceModalProps) {
  const [price, setPrice] = useState('');

  function handleSave() {
    const n = Number(price);
    if (!n || n <= 0) return;
    onSave(n);
    setPrice('');
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { onClose(); setPrice(''); }}
      title="Confirm Price"
      maxWidth="420px"
      footer={
        <div className={styles.modalFooter}>
          <Button variant="ghost" onClick={() => { onClose(); setPrice(''); }}>Cancel</Button>
          <Button onClick={handleSave} disabled={!price || Number(price) <= 0}>Confirm Price</Button>
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
        <Input
          label="Quoted Price (₹)"
          type="number"
          min="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g. 4500"
          fullWidth
          autoFocus
        />
      </div>
    </Modal>
  );
}

interface CloseModalProps {
  isOpen:   boolean;
  onClose:  () => void;
  enquiry:  Enquiry | null;
  onSave:   (reason: string, notes: string) => void;
}

function CloseEnquiryModal({ isOpen, onClose, enquiry, onSave }: CloseModalProps) {
  const [reason, setReason] = useState('declined_price');
  const [notes,  setNotes]  = useState('');

  function handleSave() {
    onSave(reason, notes);
    setReason('declined_price');
    setNotes('');
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { onClose(); setReason('declined_price'); setNotes(''); }}
      title="Close Enquiry"
      maxWidth="440px"
      footer={
        <div className={styles.modalFooter}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={handleSave}>Close Enquiry</Button>
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
          label="Reason for closing"
          options={CLOSE_REASON_OPTIONS}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Input
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional context..."
          fullWidth
        />
      </div>
    </Modal>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
type StatusFilter = 'all' | EnquiryStatus;

const FILTER_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all',             label: 'All'             },
  { id: 'pending',         label: 'Pending'         },
  { id: 'price_confirmed', label: 'Price Confirmed' },
  { id: 'converted',       label: 'Converted'       },
  { id: 'closed',          label: 'Closed'          },
];

export function EnquiryPage() {
  const toast = useToast();

  const [enquiries,  setEnquiries] = useState<Enquiry[]>(INITIAL_ENQUIRIES);
  const [filter,     setFilter]    = useState<StatusFilter>('all');
  const [createOpen, setCreate]    = useState(false);
  const [priceTgt,   setPriceTgt]  = useState<Enquiry | null>(null);
  const [closeTgt,   setCloseTgt]  = useState<Enquiry | null>(null);

  const filtered = useMemo(
    () => filter === 'all' ? enquiries : enquiries.filter((e) => e.status === filter),
    [enquiries, filter],
  );

  function handleCreate(data: Parameters<CreateModalProps['onSave']>[0]) {
    const e: Enquiry = {
      ...data,
      id:          `enq-${Date.now()}`,
      enquiryNo:   `ENQ-${nextEnqNum++}`,
      status:      'pending',
      quotedPrice: null,
      closeReason: null,
      closeNotes:  null,
      createdAt:   new Date().toISOString(),
      jobRef:      null,
    };
    setEnquiries((prev) => [e, ...prev]);
    toast.success(`Enquiry ${e.enquiryNo} created.`);
    setCreate(false);
  }

  function handleConfirmPrice(price: number) {
    if (!priceTgt) return;
    setEnquiries((prev) =>
      prev.map((e) => e.id === priceTgt.id ? { ...e, status: 'price_confirmed', quotedPrice: price } : e),
    );
    toast.success(`Price ₹${price.toLocaleString('en-IN')} confirmed for ${priceTgt.enquiryNo}.`);
    setPriceTgt(null);
  }

  function handleClose(reason: string, notes: string) {
    if (!closeTgt) return;
    setEnquiries((prev) =>
      prev.map((e) => e.id === closeTgt.id ? { ...e, status: 'closed', closeReason: reason, closeNotes: notes || null } : e),
    );
    toast.success(`${closeTgt.enquiryNo} closed.`);
    setCloseTgt(null);
  }

  function handleConvert(enquiry: Enquiry) {
    // TODO (backend): POST /jobs with enquiry payload; get back jobId
    const mockRef = `JC-2026-0${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
    setEnquiries((prev) =>
      prev.map((e) => e.id === enquiry.id ? { ...e, status: 'converted', jobRef: mockRef } : e),
    );
    toast.success(`${enquiry.enquiryNo} converted to job ${mockRef}.`);
  }

  const pendingCount   = enquiries.filter((e) => e.status === 'pending').length;
  const confirmedCount = enquiries.filter((e) => e.status === 'price_confirmed').length;

  const columns: TableColumn<Enquiry>[] = [
    {
      key: 'enquiryNo',
      header: 'Enquiry',
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
      header: 'Customer',
      render: (e) => (
        <div>
          <div className={styles.cellBold}>{e.customerName}</div>
          <div className={styles.cellMuted}>+91 {e.phone}</div>
        </div>
      ),
    },
    {
      key: 'vehicleModel',
      header: 'Vehicle',
      render: (e) => (
        <div>
          <div className={styles.cellBold}>{e.vehicleModel}</div>
          <div className={styles.cellMuted}>{e.vehicleNumber}</div>
        </div>
      ),
    },
    { key: 'glassType', header: 'Glass Type' },
    {
      key: 'quotedPrice',
      header: 'Price',
      align: 'right' as const,
      render: (e) => (
        <span className={styles.priceCell}>
          {e.quotedPrice != null ? `₹${e.quotedPrice.toLocaleString('en-IN')}` : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (e) => {
        const d = STATUS_DISPLAY[e.status];
        return <Badge label={d.label} variant={d.variant} size="sm" />;
      },
    },
    {
      key: 'id',
      header: 'Actions',
      render: (e) => (
        <div className={styles.actionCell}>
          {e.status === 'pending' && (
            <>
              <Button size="sm" onClick={() => setPriceTgt(e)}>
                Confirm Price
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCloseTgt(e)}>
                Close
              </Button>
            </>
          )}
          {e.status === 'price_confirmed' && (
            <>
              <Button size="sm" variant="primary" onClick={() => handleConvert(e)}>
                Convert to Job
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCloseTgt(e)}>
                Close
              </Button>
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
  ];

  return (
    <PageShell
      heading="Enquiries"
      description="Manage customer enquiries — confirm prices, convert to jobs and close lost leads."
      actions={
        <Button leftIcon={<Plus size={16} />} onClick={() => setCreate(true)}>
          New Enquiry
        </Button>
      }
    >
      {/* Quick summary chips */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryChip}>
          <PhoneCall size={13} />
          {pendingCount} pending
        </div>
        <div className={`${styles.summaryChip} ${styles.confirmedChip}`}>
          <CheckCircle size={13} />
          {confirmedCount} price confirmed
        </div>
      </div>

      <SectionCard>
        {/* Status filter tabs */}
        <div className={styles.filterBar}>
          {FILTER_TABS.map((tab) => {
            const count = tab.id === 'all'
              ? enquiries.length
              : enquiries.filter((e) => e.status === tab.id).length;
            return (
              <button
                key={tab.id}
                className={`${styles.filterTab} ${filter === tab.id ? styles.filterActive : ''}`}
                onClick={() => setFilter(tab.id)}
              >
                {tab.label}
                <span className={styles.tabCount}>{count}</span>
              </button>
            );
          })}
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          emptyMessage="No enquiries match the selected filter."
        />
      </SectionCard>

      <CreateEnquiryModal
        isOpen={createOpen}
        onClose={() => setCreate(false)}
        onSave={handleCreate}
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
    </PageShell>
  );
}
