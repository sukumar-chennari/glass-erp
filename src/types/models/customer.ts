export interface Vehicle {
  id:               string;
  make:             string;
  model:            string;
  year:             number;
  registrationNo:   string;
  color?:           string;
}

export interface Customer {
  id:           string;
  name:         string;
  phone:        string;
  email?:       string;
  address?:     string;
  city?:        string;
  vehicles:     Vehicle[];
  totalJobs:    number;
  createdAt:    string;
  updatedAt?:   string;
}

export interface CreateCustomerDto {
  name:           string;
  phone:          string;
  email?:         string;
  address?:       string;
  city?:          string;
  vehicles?:      Omit<Vehicle, 'id'>[];
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}
