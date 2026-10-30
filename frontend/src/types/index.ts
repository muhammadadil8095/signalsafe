export * from './auth';
export * from './scan';
export * from './incident';

export interface AuditLogItem {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details?: Record<string, any> | null;
  created_at: string;
}

export interface AdminDashboardStats {
  total_users: number;
  total_scans: number;
  malicious_detections: number;
  suspicious_detections: number;
  open_reports: number;
  total_reports: number;
  threat_distribution: Record<string, number>;
  scan_types: Record<string, number>;
  recent_incidents: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    incident_type: string;
    created_at: string;
  }>;
}

