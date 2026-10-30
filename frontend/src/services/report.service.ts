import api from './api';
import { IncidentCreatePayload, IncidentListPaginated, IncidentReport, IncidentStatus } from '@/types';

export const reportService = {
  async createReport(payload: IncidentCreatePayload): Promise<IncidentReport> {
    const res = await api.post<IncidentReport>('/reports/', payload);
    return res.data;
  },

  async getReports(page = 1, size = 20): Promise<IncidentListPaginated> {
    const res = await api.get<IncidentListPaginated>(`/reports/?page=${page}&size=${size}`);
    return res.data;
  },

  async getReportById(id: string): Promise<IncidentReport> {
    const res = await api.get<IncidentReport>(`/reports/${id}`);
    return res.data;
  },

  async updateReportStatus(
    id: string,
    status: IncidentStatus,
    resolution_notes?: string
  ): Promise<IncidentReport> {
    const res = await api.put<IncidentReport>(`/reports/${id}/status`, {
      status,
      resolution_notes,
    });
    return res.data;
  },
};

