import api from './api';
import { ScanHistoryPaginated, ScanResult } from '@/types';

export const scanService = {
  async scanURL(url: string): Promise<ScanResult> {
    const res = await api.post<ScanResult>('/scans/url', { url });
    return res.data;
  },

  async getHistory(page = 1, size = 20): Promise<ScanHistoryPaginated> {
    const res = await api.get<ScanHistoryPaginated>(`/scans/history?page=${page}&size=${size}`);
    return res.data;
  },

  async getScanById(scanId: string): Promise<ScanResult> {
    const res = await api.get<ScanResult>(`/scans/${scanId}`);
    return res.data;
  },
};

