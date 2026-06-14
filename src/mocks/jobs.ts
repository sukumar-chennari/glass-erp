import type { Job, CreateJobDto } from '@/types/models/job';
import { JOB_STATUS } from '@/constants/statuses';

let store: Job[] = [
  {
    id: 'j-001', jobNumber: 'JC-2025-0847',
    customerId: 'c-001', customerName: 'Ravi Kumar', customerPhone: '9876543210',
    vehicleName: 'Honda City 2020', registrationNo: 'DL 01 AB 1234',
    glassPosition: 'Front Windshield', damageType: 'Crack',
    technicianId: 't-001', technicianName: 'Arun Mehta',
    paymentType: 'Insurance', estimatedCost: 6490,
    status: JOB_STATUS.IN_PROGRESS, scheduledDate: '2025-06-29',
    createdAt: '2025-06-29T09:00:00Z',
  },
  {
    id: 'j-002', jobNumber: 'JC-2025-0846',
    customerId: 'c-003', customerName: 'Mohan Singh', customerPhone: '9876543212',
    vehicleName: 'Hyundai i20 2021', registrationNo: 'UP 07 EF 9012',
    glassPosition: 'Driver Side Window', damageType: 'Complete Shatter',
    technicianId: 't-002', technicianName: 'Kiran Desai',
    paymentType: 'Cash', estimatedCost: 3800,
    status: JOB_STATUS.COMPLETED, scheduledDate: '2025-06-28',
    completedDate: '2025-06-28', createdAt: '2025-06-28T08:00:00Z',
  },
  {
    id: 'j-003', jobNumber: 'JC-2025-0845',
    customerId: 'c-002', customerName: 'Priya Sharma', customerPhone: '9876543211',
    vehicleName: 'Maruti Swift 2018', registrationNo: 'HR 26 CD 5678',
    glassPosition: 'Rear Windshield', damageType: 'Crack',
    technicianId: 't-003', technicianName: 'Deepak Rao',
    paymentType: 'Insurance', estimatedCost: 4200,
    status: JOB_STATUS.PENDING, scheduledDate: '2025-07-02',
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
    completedDate: '2025-06-26', createdAt: '2025-06-26T09:00:00Z',
  },
  {
    id: 'j-005', jobNumber: 'JC-2025-0843',
    customerId: 'c-005', customerName: 'Suresh Reddy', customerPhone: '9876543214',
    vehicleName: 'Kia Seltos 2023', registrationNo: 'TS 09 IJ 7890',
    glassPosition: 'Front Windshield', damageType: 'Chip / Stone Impact',
    technicianId: 't-002', technicianName: 'Kiran Desai',
    paymentType: 'UPI', estimatedCost: 5800,
    status: JOB_STATUS.IN_PROGRESS, scheduledDate: '2025-07-01',
    createdAt: '2025-06-30T14:00:00Z',
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

let nextNum  = 848;

export const jobMock = {
  list: (): Job[] => [...store],

  create: (dto: CreateJobDto, customerName: string, customerPhone: string, technicianName?: string): Job => {
    const job: Job = {
      ...dto,
      id:            `j-00${store.length + 1}`,
      jobNumber:     `JC-2025-0${nextNum++}`,
      customerName,
      customerPhone,
      technicianName,
      status:        JOB_STATUS.PENDING,
      createdAt:     new Date().toISOString(),
    };
    store = [...store, job];
    return job;
  },

  update: (id: string, dto: Partial<CreateJobDto> & { status?: Job['status'] }): Job => {
    const idx = store.findIndex((j) => j.id === id);
    if (idx === -1) throw new Error(`Job ${id} not found`);
    const updated: Job = {
      ...store[idx],
      ...dto,
      updatedAt: new Date().toISOString(),
      completedDate:
        dto.status === JOB_STATUS.COMPLETED
          ? store[idx].completedDate ?? new Date().toISOString().slice(0, 10)
          : store[idx].completedDate,
    };
    store = store.map((j) => (j.id === id ? updated : j));
    return updated;
  },

  remove: (id: string): string => {
    store = store.filter((j) => j.id !== id);
    return id;
  },
};
