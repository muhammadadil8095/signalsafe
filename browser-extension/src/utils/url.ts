import { DEFAULT_BASE_URL, DEPLOYED_FRONTEND_URL } from "../types";

export interface UrlCheck {
  ok: boolean;
  url?: string;
  reason?: string;
}

const BLOCKED_PROTOCOLS = new Set([
  "chrome:",
  "chrome-extension:",
  "edge:",
  "extension:",
  "about:",
  "moz-extension:",
  "devtools:",
  "view-source:",
  "data:",
  "javascript:",
]);

export function normalizeScanUrl(raw: string): string {
  try {
    const parsed = new URL(raw.trim());
    parsed.hash = ""; // strip fragment
    return parsed.toString();
  } catch {
    return raw.trim();
  }
}

export function validateScanUrl(raw: string | undefined | null, configuredBaseUrl?: string): UrlCheck {
  if (!raw || !raw.trim()) {
    return { ok: false, reason: "This tab has no URL to scan." };
  }

  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return { ok: false, reason: "The tab URL is not a valid address." };
  }

  if (BLOCKED_PROTOCOLS.has(parsed.protocol) || parsed.protocol === "file:") {
    return {
      ok: false,
      reason: "Browser pages, extension pages, and local files are exempt from threat scanning.",
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "Only HTTP and HTTPS URLs can be submitted to SignalSafe." };
  }

  if (!parsed.hostname) {
    return { ok: false, reason: "The URL has no hostname." };
  }

  // Prevent scanning the backend or frontend services themselves
  const host = parsed.hostname.toLowerCase();
  const baseHost = configuredBaseUrl ? domainFromUrl(configuredBaseUrl).toLowerCase() : "";
  const defaultBaseHost = domainFromUrl(DEFAULT_BASE_URL).toLowerCase();
  const frontendHost = domainFromUrl(DEPLOYED_FRONTEND_URL).toLowerCase();

  if (
    (baseHost && host === baseHost) ||
    host === defaultBaseHost ||
    host === frontendHost ||
    host === "127.0.0.1" && (parsed.port === "8000" || parsed.port === "5173") ||
    host === "localhost" && (parsed.port === "8000" || parsed.port === "5173")
  ) {
    return {
      ok: false,
      reason: "SignalSafe application endpoints are protected and not scanned as external targets.",
    };
  }

  return { ok: true, url: normalizeScanUrl(parsed.toString()) };
}

export function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function isHighRisk(riskLevel?: string | null): boolean {
  if (!riskLevel) return false;
  const level = riskLevel.toLowerCase();
  return level === "malicious" || level === "suspicious";
}

export function isMalicious(riskLevel?: string | null): boolean {
  if (!riskLevel) return false;
  return riskLevel.toLowerCase() === "malicious";
}

export function isSuspicious(riskLevel?: string | null): boolean {
  if (!riskLevel) return false;
  return riskLevel.toLowerCase() === "suspicious";
}
