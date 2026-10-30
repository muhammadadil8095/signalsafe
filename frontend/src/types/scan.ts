export type RiskLevel = 'safe' | 'suspicious' | 'malicious' | 'inconclusive';
export type ScanType = 'url' | 'qr' | 'message' | 'attachment';

export interface ThreatSignal {
  signal_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
}

export interface MLResult {
  available: boolean;
  prediction?: string | null;
  confidence?: number | null;
}

export interface VirusTotalResult {
  available: boolean;
  malicious?: number;
  suspicious?: number;
  undetected?: number;
}

export interface ScanResult {
  id: string;
  scan_id?: string;
  scan_type: ScanType;
  original_input: string;
  normalized_url?: string;
  domain?: string;
  risk_score: number;
  risk_level: RiskLevel;
  prediction: string;
  ml?: MLResult;
  ml_available?: boolean;
  ml_prediction?: string | null;
  ml_confidence?: number | null;
  virustotal?: VirusTotalResult;
  vt_available?: boolean;
  vt_malicious?: number;
  vt_suspicious?: number;
  vt_undetected?: number;
  signals: ThreatSignal[];
  explanation: string[];
  recommendations: string[];
  scanned_at: string;
}

export interface ScanHistoryPaginated {
  items: ScanResult[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

