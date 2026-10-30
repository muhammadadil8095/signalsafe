import api from './api';
import { ScanHistoryPaginated, ScanResult } from '@/types';

// Safe offline heuristic analyzer if backend is unreachable or user is evaluating standalone
function clientHeuristicFallback(rawUrl: string): ScanResult {
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    parsed = new URL('https://' + url);
  }

  const signals: Array<{
    signal_type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: string;
  }> = [];
  let score = 5.0;

  const hostname = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();

  // 1. IP address check
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    score += 40;
    signals.push({
      signal_type: 'ip_address_host',
      description: 'Host identifier is a raw IP address instead of an authenticated domain',
      severity: 'high',
      source: 'heuristic',
    });
  }

  // 2. Suspicious TLD check
  const badTlds = ['.tk', '.xyz', '.top', '.ml', '.ga', '.cf', '.gq', '.work', '.click', '.fit', '.buzz'];
  if (badTlds.some((tld) => hostname.endsWith(tld))) {
    score += 35;
    signals.push({
      signal_type: 'suspicious_tld',
      description: `Domain suffix uses high-abuse top-level domain`,
      severity: 'high',
      source: 'heuristic',
    });
  }

  // 3. Credential and urgency keywords
  const keywords = ['login', 'verify', 'update', 'secure', 'account', 'banking', 'paypal', 'sso', 'portal', 'auth'];
  const matchedKw = keywords.filter((kw) => hostname.includes(kw) || path.includes(kw));
  if (matchedKw.length > 0) {
    score += Math.min(30, matchedKw.length * 15);
    signals.push({
      signal_type: 'credential_path',
      description: `Target contains sensitive credential terminology: [${matchedKw.join(', ')}]`,
      severity: 'medium',
      source: 'heuristic',
    });
  }

  // 4. Excessive subdomains
  const subdomains = hostname.split('.');
  if (subdomains.length > 3) {
    score += 20;
    signals.push({
      signal_type: 'excessive_subdomains',
      description: `Excessive subdomain nesting (${subdomains.length} segments) obscures destination`,
      severity: 'medium',
      source: 'heuristic',
    });
  }

  // 5. Length checks
  if (url.length > 80) {
    score += 15;
    signals.push({
      signal_type: 'abnormal_url_length',
      description: `URL length (${url.length} chars) exceeds standard bounds`,
      severity: 'low',
      source: 'heuristic',
    });
  }

  score = Math.min(100.0, Math.max(0.0, score));
  const risk_level: 'safe' | 'suspicious' | 'malicious' =
    score >= 60 ? 'malicious' : score >= 25 ? 'suspicious' : 'safe';

  return {
    id: 'scan-' + Date.now(),
    scan_type: 'url',
    original_input: rawUrl,
    normalized_url: url,
    domain: hostname,
    risk_score: parseFloat(score.toFixed(1)),
    risk_level,
    prediction: risk_level,
    ml_available: false,
    ml_prediction: null,
    ml_confidence: null,
    vt_available: false,
    vt_malicious: 0,
    vt_suspicious: 0,
    vt_undetected: 0,
    signals,
    explanation: [
      `Client-side static heuristic assessment (Local Evaluation Mode).`,
      `NOTE: Machine learning classifiers and threat telemetry require an active backend connection. This is a preliminary structural check, not a verified offline certification.`,
      signals.length === 0
        ? `Zero structural anomaly flags triggered in lexical tokens.`
        : `${signals.length} structural heuristic indicator(s) identified.`,
    ],
    recommendations:
      risk_level === 'malicious'
        ? [
            'CRITICAL: Do NOT submit credentials or personal data to this site.',
            'Report this threat incident to campus IT Security once network connection is restored.',
          ]
        : risk_level === 'suspicious'
        ? [
            'Exercise heightened caution. Verify sender domain via institutional phone directory.',
          ]
        : ['Preliminary lexical structure conforms to web standards. Live threat verification requires backend connectivity.'],
    scanned_at: new Date().toISOString(),
  };
}

export const scanService = {
  async scanURL(url: string): Promise<ScanResult> {
    // Explicit offline check: live threat analysis requires connectivity
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error(
        'Offline: Live threat analysis requires an active network connection to query the security backend and AI classification pipeline. Please reconnect to scan.'
      );
    }

    try {
      // Ensure demo authentication if user has no token
      if (!localStorage.getItem('signalsafe_token')) {
        try {
          const authRes = await api.post('/auth/login', {
            email: 'student@campus.edu',
            password: 'student123',
          });
          if (authRes.data.access_token) {
            localStorage.setItem('signalsafe_token', authRes.data.access_token);
            localStorage.setItem('signalsafe_user', JSON.stringify(authRes.data.user));
          }
        } catch {
          // Continue if auto-login is not permitted
        }
      }

      const res = await api.post<ScanResult>('/scans/url', { url });
      return res.data;
    } catch (err: any) {
      if (err.message && err.message.startsWith('Offline:')) {
        throw err;
      }
      // If server is unreachable but device is online, fallback to client heuristic with explicit disclaimer
      return clientHeuristicFallback(url);
    }
  },

  async getHistory(page = 1, size = 20): Promise<ScanHistoryPaginated> {
    try {
      const res = await api.get<ScanHistoryPaginated>(`/scans/history?page=${page}&size=${size}`);
      return res.data;
    } catch {
      return {
        items: [],
        total: 0,
        page,
        size,
        pages: 0,
      };
    }
  },

  async getScanById(scanId: string): Promise<ScanResult> {
    const res = await api.get<ScanResult>(`/scans/${scanId}`);
    return res.data;
  },
};

