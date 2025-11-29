import { axiosInstance } from './http';

export type AttendanceStatus = 'present' | 'absent' | 'leave';

export interface AttendanceRecord {
  _id: string;
  employee_id: {
    _id: string;
    fullName: string;
    employeeId: string;
    roleTitle: string;
    status: string;
  } | string;
  organization_id: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

export const fetchAttendance = async (params: { date?: string; employeeId?: string }) => {
  const response = await axiosInstance.get('/api/v1/attendance', { params });
  return response.data?.data as AttendanceRecord[];
};

export const saveAttendance = async (records: Array<{ employeeId: string; date: string; status: AttendanceStatus; checkIn?: string; checkOut?: string; notes?: string }>) => {
  const response = await axiosInstance.post('/api/v1/attendance', { records });
  return response.data?.data as AttendanceRecord[];
};

export const updateAttendance = async (id: string, payload: Partial<{ status: AttendanceStatus; checkIn?: string; checkOut?: string; notes?: string }>) => {
  const response = await axiosInstance.patch(`/api/v1/attendance/${id}`, payload);
  return response.data?.data as AttendanceRecord;
};

export interface EmployeeAttendanceSummary {
  employeeMongoId: string;
  employeeId?: string;
  fullName?: string;
  roleTitle?: string;
  status?: string;
  present: number;
  absent: number;
  leave: number;
  total: number;
}

export interface AttendanceEmployeeSummaryResponse {
  range: {
    start: string;
    end: string;
  };
  totals: EmployeeAttendanceSummary[];
}

export interface MonthlyAttendanceSummaryRow {
  month: number;
  present: number;
  absent: number;
  leave: number;
  total: number;
}

export interface MonthlyAttendanceSummaryResponse {
  year: number;
  months: MonthlyAttendanceSummaryRow[];
}

export const fetchAttendanceEmployeeSummary = async (params: { month?: string; startDate?: string; endDate?: string }) => {
  const response = await axiosInstance.get('/api/v1/attendance/summary/employees', { params });
  return response.data?.data as AttendanceEmployeeSummaryResponse;
};

export const fetchMonthlyAttendanceSummary = async (params: { year?: number; employeeId?: string }) => {
  const response = await axiosInstance.get('/api/v1/attendance/summary/monthly', { params });
  return response.data?.data as MonthlyAttendanceSummaryResponse;
};
