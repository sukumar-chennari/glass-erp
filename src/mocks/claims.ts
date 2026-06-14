import type { Claim, CreateClaimDto } from '@/types/models/claim';
import { CLAIM_STATUS } from '@/constants/statuses';

let store: Claim[] = [
  {
    id: 'cl-001', claimNumber: 'CLM-2025-041',
    customerId: 'c-001', customerName: 'Ravi Kumar',
    vehicleName: 'Honda City 2020', registrationNo: 'DL 01 AB 1234',
    glassPosition: 'Front Windshield', damageType: 'Crack',
    insurer: 'New India Assurance', policyNumber: 'POL-2024-001234',
    claimedAmount: 10000, approvedAmount: 10000, customerBalance: 0,
    status: CLAIM_STATUS.APPROVED,
    remarks: 'Surveyor visited on 20 May. Full amount sanctioned.',
    submittedAt: '2025-05-15T10:00:00Z',
    history: [
      { step: 'Submitted',    date: '15 May 2025', note: 'Claim submitted with all documents', state: 'done' },
      { step: 'Under Review', date: '17 May 2025', note: 'Assigned to surveyor Ramesh Nair',   state: 'done' },
      { step: 'Surveyed',     date: '20 May 2025', note: 'Physical inspection completed',       state: 'done' },
      { step: 'Approved',     date: '22 May 2025', note: 'Full amount ₹10,000 approved',        state: 'done' },
    ],
  },
  {
    id: 'cl-002', claimNumber: 'CLM-2025-039',
    customerId: 'c-002', customerName: 'Priya Sharma',
    vehicleName: 'Maruti Swift 2018', registrationNo: 'HR 26 CD 5678',
    glassPosition: 'Rear Windshield', damageType: 'Complete Shatter',
    insurer: 'ICICI Lombard', policyNumber: 'POL-2023-005678',
    claimedAmount: 6800, approvedAmount: 4500, customerBalance: 2300,
    status: CLAIM_STATUS.PARTIAL,
    remarks: 'Deductible of ₹1,000 applied. Labour charges not covered.',
    submittedAt: '2025-05-18T11:00:00Z',
    history: [
      { step: 'Submitted',        date: '18 May 2025', note: 'Claim submitted with photos',           state: 'done'    },
      { step: 'Under Review',     date: '19 May 2025', note: 'Documents verified',                    state: 'done'    },
      { step: 'Surveyed',         date: '23 May 2025', note: 'Inspection done, report filed',         state: 'done'    },
      { step: 'Partial Approved', date: '25 May 2025', note: '₹4,500 approved. ₹2,300 customer bal.', state: 'partial' },
    ],
  },
  {
    id: 'cl-003', claimNumber: 'CLM-2025-036',
    customerId: 'c-003', customerName: 'Mohan Singh',
    vehicleName: 'Hyundai i20 2021', registrationNo: 'UP 07 EF 9012',
    glassPosition: 'Driver Side Window', damageType: 'Chip / Stone Impact',
    insurer: 'HDFC ERGO', policyNumber: 'POL-2024-009012',
    claimedAmount: 4200, approvedAmount: 0, customerBalance: 4200,
    status: CLAIM_STATUS.UNDER_REVIEW,
    submittedAt: '2025-05-22T09:00:00Z',
    history: [
      { step: 'Submitted',    date: '22 May 2025', note: 'Claim submitted',                     state: 'done'    },
      { step: 'Under Review', date: '24 May 2025', note: 'Surveyor assigned. Visit scheduled.',  state: 'active'  },
      { step: 'Surveyed',     date: '—',           note: 'Awaiting visit',                       state: 'pending' },
      { step: 'Decision',     date: '—',           note: 'Pending',                              state: 'pending' },
    ],
  },
  {
    id: 'cl-004', claimNumber: 'CLM-2025-033',
    customerId: 'c-004', customerName: 'Anjali Verma',
    vehicleName: 'Toyota Innova Crysta 2022', registrationNo: 'MH 02 GH 3456',
    glassPosition: 'Sunroof Glass', damageType: 'Stress Fracture',
    insurer: 'Bajaj Allianz', policyNumber: 'POL-2025-003456',
    claimedAmount: 14000, approvedAmount: 0, customerBalance: 14000,
    status: CLAIM_STATUS.SUBMITTED,
    submittedAt: '2025-05-28T08:00:00Z',
    history: [
      { step: 'Submitted',    date: '28 May 2025', note: 'Claim lodged with all documents', state: 'active'  },
      { step: 'Under Review', date: '—',           note: 'Pending acknowledgement',          state: 'pending' },
      { step: 'Surveyed',     date: '—',           note: 'Pending',                          state: 'pending' },
      { step: 'Decision',     date: '—',           note: 'Pending',                          state: 'pending' },
    ],
  },
];

let nextClaim = 42;

export const claimMock = {
  list: (): Claim[] => [...store],

  create: (dto: CreateClaimDto, customerName: string): Claim => {
    const claim: Claim = {
      id:             `cl-00${store.length + 1}`,
      claimNumber:    `CLM-2025-0${nextClaim++}`,
      customerId:     dto.customerId,
      customerName,
      vehicleName:    dto.vehicleName,
      registrationNo: dto.registrationNo,
      glassPosition:  dto.glassPosition,
      damageType:     dto.damageType,
      insurer:        dto.insurer,
      policyNumber:   dto.policyNumber,
      policyExpiry:   dto.policyExpiry,
      claimedAmount:  dto.claimedAmount,
      approvedAmount: 0,
      customerBalance: dto.claimedAmount,
      deductible:     dto.deductible,
      status:         CLAIM_STATUS.SUBMITTED,
      surveyorName:   dto.surveyorName,
      submittedAt:    new Date().toISOString(),
      history: [
        {
          step:  'Submitted',
          date:  new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          note:  'Claim submitted with all documents',
          state: 'active',
        },
        { step: 'Under Review', date: '—', note: 'Pending', state: 'pending' },
        { step: 'Surveyed',     date: '—', note: 'Pending', state: 'pending' },
        { step: 'Decision',     date: '—', note: 'Pending', state: 'pending' },
      ],
    };
    store = [...store, claim];
    return claim;
  },

  update: (
    id: string,
    dto: { status?: Claim['status']; approvedAmount?: number; remarks?: string; surveyorName?: string },
  ): Claim => {
    const idx = store.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`Claim ${id} not found`);
    const existing = store[idx];
    const approvedAmount = dto.approvedAmount ?? existing.approvedAmount;
    const updated: Claim = {
      ...existing,
      status:          dto.status         ?? existing.status,
      approvedAmount,
      customerBalance: existing.claimedAmount - approvedAmount,
      remarks:         dto.remarks        ?? existing.remarks,
      surveyorName:    dto.surveyorName   ?? existing.surveyorName,
      updatedAt:       new Date().toISOString(),
    };
    store = store.map((c) => (c.id === id ? updated : c));
    return updated;
  },

  remove: (id: string): string => {
    store = store.filter((c) => c.id !== id);
    return id;
  },
};
