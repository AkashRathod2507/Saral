import { axiosInstance } from './http';

export type GstReturnStatus = 'draft' | 'submitted' | 'filed' | 'paid';
export type GstReturnType = 'GSTR1' | 'GSTR3B' | 'ANNUAL';

export interface GstReturnSummary {
  _id: string;
  organization_id: string;
  period: string;
  period_start?: string;
  period_end?: string;
  return_type: GstReturnType;
  status: GstReturnStatus;
  total_taxable_value: number;
  total_tax: number;
  total_cess: number;
  gross_turnover: number;
  payments_received: number;
  outstanding_tax_liability: number;
  total_invoices: number;
  total_transactions: number;
  summary_breakup?: {
    invoices?: Record<string, { count: number; value: number }>;
    collections?: { received?: number; paid?: number };
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface GstListResponse {
  data: GstReturnSummary[];
  total: number;
  page: number;
  limit: number;
}

export const fetchGstReturns = async (params?: { page?: number; limit?: number }) => {
  const res = await axiosInstance.get('/api/v1/gst', { params });
  return res.data?.data as GstListResponse;
};

export const generateGstReturn = async (payload: { period: string; returnType?: GstReturnType }) => {
  const res = await axiosInstance.post('/api/v1/gst/generate', payload);
  return res.data?.data as GstReturnSummary;
};

export const updateGstReturnStatus = async (
  id: string,
  payload: { status: GstReturnStatus; notes?: string; referenceNumber?: string }
) => {
  const res = await axiosInstance.patch(`/api/v1/gst/${id}`, payload);
  return res.data?.data as GstReturnSummary;
};
