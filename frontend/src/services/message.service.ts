import api from './api';
import { ThreatSignal } from '@/types';

export interface MessageAnalysisResult {
  scan_id?: string;
  risk_level: 'safe' | 'suspicious' | 'malicious';
  risk_score: number;
  indicators: ThreatSignal[];
  explanation: string[];
  recommendations: string[];
}

export const messageService = {
  async analyzeMessage(content: string): Promise<MessageAnalysisResult> {
    const res = await api.post<MessageAnalysisResult>('/analyze/message', { content });
    return res.data;
  },
};

