import type {
  Job, CreateJobDto, InsuranceDetails,
  InsuranceProcessing, StockResolution, StageEvent,
} from '@/types/models/job';
import { JOB_STATUS } from '@/constants/statuses';
import type { PaymentStatus } from '@/constants/statuses';

const DEFAULT_INSURANCE_DOCS = [
  { id: 'rc',     label: 'RC (Registration Certificate)',  required: true,  uploaded: false },
  { id: 'dl',     label: 'Driving Licence Copy',           required: true,  uploaded: false },
  { id: 'claim',  label: 'Claim Form (Insurer Template)',  required: true,  uploaded: false },
  { id: 'photos', label: 'Damage Photos (min 3)',          required: true,  uploaded: false },
  { id: 'fir',    label: 'FIR Copy (theft/accident only)', required: false, uploaded: false },
];

let store: Job[] = [
  {
    id: 'j-001', jobNumber: 'JC-2025-0847',
    customerId: 'c-001', customerName: 'Ravi Kumar', customerPhone: '9876543210',
    vehicleName: 'Honda City 2020', registrationNo: 'DL 01 AB 1234',
    glassPosition: 'Front Windshield', damageType: 'Crack',
    technicianId: 't-001', technicianName: 'Arun Mehta',
    paymentType: 'Insurance', estimatedCost: 6490,
    status: JOB_STATUS.WORKING, scheduledDate: '2025-06-29',
    assignedAt: '2025-06-29T09:00:00Z',
    stageHistory: [
      { stage: 'Pending',  at: '2025-06-29T08:45:00Z' },
      { stage: 'Assigned', at: '2025-06-29T09:00:00Z' },
      { stage: 'Accepted', at: '2025-06-29T09:10:00Z' },
      { stage: 'Arrived',  at: '2025-06-29T09:30:00Z' },
      { stage: 'Working',  at: '2025-06-29T09:45:00Z' },
    ],
    insuranceDetails: {
      insurer: 'HDFC ERGO', policyNumber: 'HDFC-2024-XYZ-001',
      accidentDate: '2025-06-28', excessAmount: 1500,
    },
    insuranceProcessing: {
      state: 'documents_pending',
      isBreakIn: false,
      documents: [
        { id: 'rc',     label: 'RC (Registration Certificate)',  required: true,  uploaded: true  },
        { id: 'dl',     label: 'Driving Licence Copy',           required: true,  uploaded: true  },
        { id: 'claim',  label: 'Claim Form (Insurer Template)',  required: true,  uploaded: false },
        { id: 'photos', label: 'Damage Photos (min 3)',          required: true,  uploaded: true  },
        { id: 'fir',    label: 'FIR Copy (theft/accident only)', required: false, uploaded: false },
      ],
      updatedAt: '2025-06-29T09:30:00Z',
    },
    paymentStatus: 'Insurance Pending',
    createdAt: '2025-06-29T08:45:00Z',
  },
  {
    id: 'j-002', jobNumber: 'JC-2025-0846',
    customerId: 'c-003', customerName: 'Mohan Singh', customerPhone: '9876543212',
    vehicleName: 'Hyundai i20 2021', registrationNo: 'UP 07 EF 9012',
    glassPosition: 'Driver Side Window', damageType: 'Complete Shatter',
    technicianId: 't-002', technicianName: 'Kiran Desai',
    paymentType: 'Cash', estimatedCost: 3800,
    status: JOB_STATUS.COMPLETED, scheduledDate: '2025-06-28',
    completedDate: '2025-06-28',
    paymentStatus: 'Cash Collected',
    createdAt: '2025-06-28T08:00:00Z',
  },
  {
    id: 'j-003', jobNumber: 'JC-2025-0845',
    customerId: 'c-002', customerName: 'Priya Sharma', customerPhone: '9876543211',
    vehicleName: 'Maruti Swift 2018', registrationNo: 'HR 26 CD 5678',
    glassPosition: 'Rear Windshield', damageType: 'Crack',
    paymentType: 'Insurance', estimatedCost: 4200,
    status: JOB_STATUS.PENDING, scheduledDate: '2025-07-02',
    stageHistory: [{ stage: 'Pending', at: '2025-06-27T10:00:00Z' }],
    createdAt: '2025-06-27T10:00:00Z',
  },
  {
    id: 'j-004', jobNumber: 'JC-2025-0844',
    customerId: 'c-004', customerName: 'Anjali Verma', customerPhone: '9876543213',
    vehicleName: 'Toyota Innova Crysta 2022', registrationNo: 'MH 02 GH 3456',
    glassPosition: 'Sunroof Glass', damageType: 'Stress Fracture',
    technicianId: 't-001', technicianName: 'Arun Mehta',
    paymentType: 'Card', estimatedCost: 12500,
    status: JOB_STATUS.COMPLETED, scheduledDate: '2025-06-26',
    completedDate: '2025-06-26',
    paymentStatus: 'Financially Closed',
    createdAt: '2025-06-26T09:00:00Z',
  },
  {
    id: 'j-005', jobNumber: 'JC-2025-0843',
    customerId: 'c-005', customerName: 'Suresh Reddy', customerPhone: '9876543214',
    vehicleName: 'Kia Seltos 2023', registrationNo: 'TS 09 IJ 7890',
    glassPosition: 'Front Windshield', damageType: 'Chip / Stone Impact',
    technicianId: 't-002', technicianName: 'Kiran Desai',
    paymentType: 'UPI', estimatedCost: 5800,
    status: JOB_STATUS.ASSIGNED, scheduledDate: '2025-07-01',
    assignedAt: '2025-06-30T14:00:00Z',
    stageHistory: [
      { stage: 'Pending',  at: '2025-06-30T13:50:00Z' },
      { stage: 'Assigned', at: '2025-06-30T14:00:00Z' },
    ],
    createdAt: '2025-06-30T13:50:00Z',
  },
  {
    id: 'j-006', jobNumber: 'JC-2025-0842',
    customerId: 'c-001', customerName: 'Ravi Kumar', customerPhone: '9876543210',
    vehicleName: 'Honda City 2020', registrationNo: 'DL 01 AB 1234',
    glassPosition: 'Passenger Side Window', damageType: 'Scratch',
    technicianId: 't-003', technicianName: 'Deepak Rao',
    paymentType: 'Cash', estimatedCost: 2800,
    status: JOB_STATUS.ON_HOLD, scheduledDate: '2025-06-25',
    notes: 'Waiting for replacement glass from supplier',
    stockResolution: {
      state: 'transfer_requested',
      note: 'Requested stock transfer from East Branch',
      updatedAt: '2025-06-25T11:00:00Z',
    },
    createdAt: '2025-06-25T10:00:00Z',
  },
  {
    id: 'j-007', jobNumber: 'JC-2025-0841',
    customerId: 'c-002', customerName: 'Priya Sharma', customerPhone: '9876543211',
    vehicleName: 'Maruti Swift 2018', registrationNo: 'HR 26 CD 5678',
    glassPosition: 'Rear Left Window', damageType: 'Crack',
    paymentType: 'Insurance', estimatedCost: 1900,
    status: JOB_STATUS.CANCELLED, scheduledDate: '2025-06-20',
    notes: 'Customer cancelled appointment',
    createdAt: '2025-06-18T09:00:00Z',
  },
];

let nextNum = 848;

type UpdateDto = Partial<CreateJobDto> & {
  status?:              Job['status'];
  technicianName?:      string;
  insuranceDetails?:    InsuranceDetails;
  insuranceProcessing?: InsuranceProcessing;
  stockResolution?:     StockResolution;
  paymentStatus?:       PaymentStatus;
  stageHistory?:        StageEvent[];
};

export const jobMock = {
  list: (): Job[] => [...store],

  create: (dto: CreateJobDto, customerName: string, customerPhone: string, technicianName?: string): Job => {
    const now = new Date().toISOString();
    const insuranceProcessing: InsuranceProcessing | undefined =
      dto.paymentType === 'Insurance' && dto.insuranceDetails
        ? {
            state: 'verifying_policy',
            isBreakIn: false,
            documents: DEFAULT_INSURANCE_DOCS.map((d) => ({ ...d })),
            updatedAt: now,
          }
        : undefined;
    const job: Job = {
      ...dto,
      id:                   `j-${String(store.length + 1).padStart(3, '0')}`,
      jobNumber:            `JC-2025-0${nextNum++}`,
      customerName,
      customerPhone,
      technicianName,
      status:               JOB_STATUS.PENDING,
      stageHistory:         [{ stage: JOB_STATUS.PENDING, at: now }],
      insuranceProcessing,
      createdAt:            now,
    };
    store = [...store, job];
    return job;
  },

  update: (id: string, dto: UpdateDto): Job => {
    const idx = store.findIndex((j) => j.id === id);
    if (idx === -1) throw new Error(`Job ${id} not found`);
    const now = new Date().toISOString();
    const prev = store[idx];

    // Auto-append stageHistory when status changes
    const stageHistory: StageEvent[] =
      dto.status && dto.status !== prev.status
        ? [...(prev.stageHistory ?? []), { stage: dto.status, at: now }]
        : (dto.stageHistory ?? prev.stageHistory ?? []);

    const updated: Job = {
      ...prev,
      ...dto,
      updatedAt: now,
      stageHistory,
      assignedAt:
        dto.status === JOB_STATUS.ASSIGNED
          ? prev.assignedAt ?? now
          : prev.assignedAt,
      completedDate:
        dto.status === JOB_STATUS.COMPLETED
          ? prev.completedDate ?? now.slice(0, 10)
          : prev.completedDate,
    };
    store = store.map((j) => (j.id === id ? updated : j));
    return updated;
  },

  remove: (id: string): string => {
    store = store.filter((j) => j.id !== id);
    return id;
  },
};
