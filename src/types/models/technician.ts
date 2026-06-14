import type { TechStatus } from '@/constants/statuses';

export interface Technician {
  id:               string;
  name:             string;
  phone:            string;
  email?:           string;
  specialization?:  string;
  yearsExperience?: number;
  assignedJobs:     number;
  completedJobs:    number;
  joiningDate?:     string;
  status:           TechStatus;
  createdAt:        string;
  updatedAt?:       string;
}

export interface CreateTechnicianDto {
  name:             string;
  phone:            string;
  email?:           string;
  specialization?:  string;
  yearsExperience?: number;
  joiningDate?:     string;
}

export interface UpdateTechnicianDto extends Partial<CreateTechnicianDto> {
  status?: TechStatus;
}
