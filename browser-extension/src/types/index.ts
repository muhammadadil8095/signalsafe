/** Types matching the SignalSafe Campus FastAPI schemas. Do not invent fields. */

export type RiskLevel = "safe" | "suspicious" | "malicious" | "inconclusive";

export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** POST /api/v1/auth/login response */
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

/** POST /api/v1/auth/refresh response (Token schema) */
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ScanURLRequest {
  url: string;
  scan_type?: string;
}

export interface ThreatSignal {
  signal_type: string;
  description: string;
  severity: string;
  source: string;
}

/**
 * POST /api/v1/scans/url → ScanResponse
 * backend/app/schemas/scan.py
 */
export interface ScanResponse {
  id: string;
  scan_type: string;
  original_input: string;
  normalized_url?: string | null;
  domain?: string | null;
  risk_score: number;
  risk_level: string;
  prediction: string;
  ml_available: boolean;
  ml_prediction?: string | null;
  ml_confidence?: number | null;
  vt_available: boolean;
  vt_malicious?: number | null;
  vt_suspicious?: number | null;
  vt_undetected?: number | null;
  signals: Array<Record<string, unknown> | ThreatSignal>;
  explanation: string[];
  recommendations: string[];
  threat_signals?: ThreatSignal[];
  scanned_at: string;
}

export interface IncidentCreate {
  title: string;
  description: string;
  incident_type: string;
  severity: string;
  related_scan_id?: string | null;
}

export interface IncidentResponse {
  id: string;
  reporter_id: string;
  title: string;
  description: string;
  incident_type: string;
  severity: string;
  status: string;
  related_scan_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type PopupPhase =
  | "unauthenticated"
  | "idle"
  | "scanning"
  | "safe"
  | "suspicious"
  | "malicious"
  | "inconclusive"
  | "backend_unavailable"
  | "auth_expired"
  | "error";

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  baseUrl: string;
}

export interface TabInfo {
  tabId: number;
  url: string;
  title: string;
  scannable: boolean;
  reason?: string;
}

export interface OverlayPayload {
  riskLevel: string;
  domain: string;
  url: string;
  explanation: string[];
  scanId: string;
  riskScore?: number;
  recommendations?: string[];
}

export type GuardianMessage =
  | { type: "GET_STATE"; tabId?: number }
  | { type: "LOGIN"; email: string; password: string; baseUrl: string }
  | { type: "LOGOUT" }
  | { type: "SET_BASE_URL"; baseUrl: string }
  | { type: "SET_AUTO_PROTECTION"; enabled: boolean }
  | { type: "SCAN_CURRENT_TAB" }
  | { type: "REPORT_URL"; scanId: string; incidentType?: string }
  | { type: "OPEN_WARNING"; scanId: string; riskLevel?: string; url?: string }
  | { type: "SAFE_RETURN"; tabId?: number }
  | { type: "CONTINUE_ANYWAY"; url: string; tabId?: number }
  | { type: "CLEAR_SCAN" };

export interface CachedScanEntry {
  scan: ScanResponse;
  timestamp: number;
}

export interface GuardianState {
  phase: PopupPhase;
  baseUrl: string;
  user: User | null;
  authenticated: boolean;
  autoProtection: boolean;
  backendOnline: boolean;
  tab: TabInfo | null;
  scan: ScanResponse | null;
  error: string | null;
  reporting: boolean;
  reportStatus: string | null;
}

export interface GuardianResponse {
  ok: boolean;
  state: GuardianState;
  error?: string;
}

export const DEFAULT_BASE_URL = "https://signalsafe.onrender.com";
export const DEPLOYED_FRONTEND_URL = "https://signalsafe.vercel.app";
export const API_PREFIX = "/api/v1";
export const REQUEST_TIMEOUT_MS = 28_000;
export const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const MAX_CACHE_ENTRIES = 100;
