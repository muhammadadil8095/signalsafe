import api from './api';
import { ThreatSignal } from '@/types';

export interface AttachmentAnalysisResult {
  scan_id?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  risk_level: 'safe' | 'suspicious' | 'malicious' | 'inconclusive';
  risk_score: number;
  indicators: ThreatSignal[];
  explanation: string[];
  recommendations: string[];
}

export const attachmentService = {
  async analyzeAttachment(file: File): Promise<AttachmentAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<AttachmentAnalysisResult>('/analyze/attachment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};

