import type { Technician, CreateTechnicianDto, UpdateTechnicianDto } from '@/types/models/technician';
import { TECH_STATUS } from '@/constants/statuses';

let store: Technician[] = [
  {
    id: 't-001',
    name:             'Arun Mehta',
    phone:            '9876543220',
    email:            'arun.mehta@windx.in',
    specialization:   'Windshield Replacement',
    yearsExperience:  6,
    assignedJobs:     2,
    completedJobs:    142,
    joiningDate:      '2019-04-01',
    status:           TECH_STATUS.ACTIVE,
    createdAt:        '2019-04-01T09:00:00Z',
  },
  {
    id: 't-002',
    name:             'Kiran Desai',
    phone:            '9876543221',
    email:            'kiran.desai@windx.in',
    specialization:   'Side Glass & Sunroof',
    yearsExperience:  4,
    assignedJobs:     1,
    completedJobs:    98,
    joiningDate:      '2021-07-15',
    status:           TECH_STATUS.ACTIVE,
    createdAt:        '2021-07-15T10:00:00Z',
  },
  {
    id: 't-003',
    name:             'Deepak Rao',
    phone:            '9876543222',
    specialization:   'All Glass Types',
    yearsExperience:  2,
    assignedJobs:     0,
    completedJobs:    34,
    joiningDate:      '2023-01-10',
    status:           TECH_STATUS.TRAINING,
    createdAt:        '2023-01-10T08:00:00Z',
  },
  {
    id: 't-004',
    name:             'Sunil Patil',
    phone:            '9876543223',
    email:            'sunil.patil@windx.in',
    specialization:   'Windshield Replacement',
    yearsExperience:  8,
    assignedJobs:     0,
    completedJobs:    210,
    joiningDate:      '2017-09-01',
    status:           TECH_STATUS.ON_LEAVE,
    createdAt:        '2017-09-01T09:00:00Z',
  },
  {
    id: 't-005',
    name:             'Venkat Raman',
    phone:            '9876543224',
    specialization:   'Side Glass',
    yearsExperience:  1,
    assignedJobs:     0,
    completedJobs:    12,
    joiningDate:      '2024-06-01',
    status:           TECH_STATUS.INACTIVE,
    createdAt:        '2024-06-01T10:00:00Z',
  },
];

let nextNum = 6;

export const technicianMock = {
  list: (): Technician[] => [...store],

  create: (dto: CreateTechnicianDto): Technician => {
    const tech: Technician = {
      ...dto,
      id:            `t-00${nextNum++}`,
      assignedJobs:  0,
      completedJobs: 0,
      status:        TECH_STATUS.ACTIVE,
      createdAt:     new Date().toISOString(),
    };
    store = [...store, tech];
    return tech;
  },

  update: (id: string, dto: UpdateTechnicianDto): Technician => {
    const idx = store.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Technician ${id} not found`);
    const updated: Technician = { ...store[idx], ...dto, updatedAt: new Date().toISOString() };
    store = store.map((t) => (t.id === id ? updated : t));
    return updated;
  },

  remove: (id: string): string => {
    store = store.filter((t) => t.id !== id);
    return id;
  },
};
