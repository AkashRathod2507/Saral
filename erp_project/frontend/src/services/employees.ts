import { axiosInstance } from './http';

export interface EmployeeInput {
  fullName: string;
  roleTitle: string;
  email?: string;
  phone?: string;
  salary?: number;
  joiningDate: string;
  status?: 'active' | 'inactive' | 'probation';
  notes?: string;
}

export interface EmployeeRecord extends EmployeeInput {
  _id: string;
  organization_id: string;
  employeeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeListResponse {
  data: EmployeeRecord[];
  total: number;
  page: number;
  limit: number;
}

export const fetchEmployees = async (params?: { page?: number; limit?: number; status?: string; role?: string; q?: string }) => {
  const response = await axiosInstance.get('/api/v1/employees', { params });
  return response.data?.data as EmployeeListResponse;
};

export const createEmployee = async (payload: EmployeeInput) => {
  const response = await axiosInstance.post('/api/v1/employees', payload);
  return response.data?.data as EmployeeRecord;
};

export const updateEmployee = async (id: string, payload: Partial<EmployeeInput>) => {
  const response = await axiosInstance.put(`/api/v1/employees/${id}`, payload);
  return response.data?.data as EmployeeRecord;
};

export const deleteEmployee = async (id: string) => {
  const response = await axiosInstance.delete(`/api/v1/employees/${id}`);
  return response.data?.data;
};
