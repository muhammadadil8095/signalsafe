export type IncidentType = 'phishing' | 'malware' | 'scam' | 'harassment' | 'data_breach' | 'other';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'submitted' | 'under_review' | 'investigating' | 'resolved' | 'rejected';

export interface IncidentEvidence {
  id: string;
  file_name: string;
  file_type?: string | null;
  file_size?: number | null;
  uploaded_at: string;
}

export interface IncidentReport {
  id: string;
  reporter_id: string;
  title: string;
  description: string;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  related_scan_id?: string | null;
  assigned_to?: string | null;
  resolution_notes?: string | null;
  created_at: string;
  updated_at: string;
  evidence?: IncidentEvidence[];
}

export interface IncidentCreatePayload {
  title: string;
  description: string;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  related_scan_id?: string | null;
}

export interface IncidentListPaginated {
  items: IncidentReport[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

