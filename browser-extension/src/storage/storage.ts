import {
  AuthState,
  CachedScanEntry,
  CACHE_TTL_MS,
  DEFAULT_BASE_URL,
  MAX_CACHE_ENTRIES,
  ScanResponse,
  User,
} from "../types";
import { normalizeScanUrl } from "../utils/url";

const KEYS = {
  access: "ssg.accessToken",
  refresh: "ssg.refreshToken",
  user: "ssg.user",
  baseUrl: "ssg.baseUrl",
  lastScan: "ssg.lastScan",
  lastTabId: "ssg.lastTabId",
  autoProtection: "ssg.autoProtection",
  scanCache: "ssg.scanCache",
  tabScans: "ssg.tabScans",
  bypassedUrls: "ssg.bypassedUrls",
} as const;

/**
 * Token and preference storage for trusted extension contexts only (service worker + popup +
 * extension pages). Content scripts must never read these keys.
 */
export async function getAuthState(): Promise<AuthState> {
  const data = await chrome.storage.local.get([
    KEYS.access,
    KEYS.refresh,
    KEYS.user,
    KEYS.baseUrl,
  ]);
  return {
    accessToken: (data[KEYS.access] as string | undefined) ?? null,
    refreshToken: (data[KEYS.refresh] as string | undefined) ?? null,
    user: (data[KEYS.user] as User | undefined) ?? null,
    baseUrl: normalizeBaseUrl((data[KEYS.baseUrl] as string | undefined) ?? DEFAULT_BASE_URL),
  };
}

export async function setTokens(
  accessToken: string,
  refreshToken: string,
  user: User | null
): Promise<void> {
  await chrome.storage.local.set({
    [KEYS.access]: accessToken,
    [KEYS.refresh]: refreshToken,
    [KEYS.user]: user,
  });
}

export async function setAccessToken(accessToken: string): Promise<void> {
  await chrome.storage.local.set({ [KEYS.access]: accessToken });
}

export async function clearAuth(): Promise<void> {
  await chrome.storage.local.remove([
    KEYS.access,
    KEYS.refresh,
    KEYS.user,
    KEYS.lastScan,
    KEYS.tabScans,
  ]);
}

export async function setBaseUrl(baseUrl: string): Promise<void> {
  await chrome.storage.local.set({ [KEYS.baseUrl]: normalizeBaseUrl(baseUrl) });
}

export async function getAutoProtection(): Promise<boolean> {
  const data = await chrome.storage.local.get(KEYS.autoProtection);
  const val = data[KEYS.autoProtection];
  return typeof val === "boolean" ? val : true; // Enabled by default
}

export async function setAutoProtection(enabled: boolean): Promise<void> {
  await chrome.storage.local.set({ [KEYS.autoProtection]: enabled });
}

export async function saveLastScan(scan: ScanResponse): Promise<void> {
  await chrome.storage.local.set({ [KEYS.lastScan]: scan });
  if (scan.original_input || scan.normalized_url) {
    await setCachedScan(scan.normalized_url || scan.original_input, scan);
  }
}

export async function getLastScan(): Promise<ScanResponse | null> {
  const data = await chrome.storage.local.get(KEYS.lastScan);
  return (data[KEYS.lastScan] as ScanResponse | undefined) ?? null;
}

export async function clearLastScan(): Promise<void> {
  await chrome.storage.local.remove([KEYS.lastScan, KEYS.lastTabId]);
}

export async function saveLastTabId(tabId: number): Promise<void> {
  await chrome.storage.local.set({ [KEYS.lastTabId]: tabId });
}

export async function getLastTabId(): Promise<number | null> {
  const data = await chrome.storage.local.get(KEYS.lastTabId);
  const value = data[KEYS.lastTabId];
  return typeof value === "number" ? value : null;
}

// ----------------------------------------------------
// Tab Scan Association
// ----------------------------------------------------

export async function saveTabScan(tabId: number, scan: ScanResponse): Promise<void> {
  const data = await chrome.storage.local.get(KEYS.tabScans);
  const map: Record<string, ScanResponse> = (data[KEYS.tabScans] as Record<string, ScanResponse>) || {};
  map[String(tabId)] = scan;
  await chrome.storage.local.set({ [KEYS.tabScans]: map });
  await saveLastScan(scan);
}

export async function getTabScan(tabId: number): Promise<ScanResponse | null> {
  const data = await chrome.storage.local.get(KEYS.tabScans);
  const map: Record<string, ScanResponse> = (data[KEYS.tabScans] as Record<string, ScanResponse>) || {};
  return map[String(tabId)] ?? null;
}

export async function removeTabScan(tabId: number): Promise<void> {
  const data = await chrome.storage.local.get(KEYS.tabScans);
  const map: Record<string, ScanResponse> = (data[KEYS.tabScans] as Record<string, ScanResponse>) || {};
  if (map[String(tabId)]) {
    delete map[String(tabId)];
    await chrome.storage.local.set({ [KEYS.tabScans]: map });
  }
}

// ----------------------------------------------------
// Scan Cache with TTL & LRU bounds
// ----------------------------------------------------

export async function getCachedScan(url: string): Promise<ScanResponse | null> {
  const norm = normalizeScanUrl(url);
  const data = await chrome.storage.local.get(KEYS.scanCache);
  const cache: Record<string, CachedScanEntry> =
    (data[KEYS.scanCache] as Record<string, CachedScanEntry>) || {};

  const entry = cache[norm];
  if (!entry) return null;

  // Check TTL
  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL_MS) {
    delete cache[norm];
    await chrome.storage.local.set({ [KEYS.scanCache]: cache });
    return null;
  }

  return entry.scan;
}

export async function setCachedScan(url: string, scan: ScanResponse): Promise<void> {
  const norm = normalizeScanUrl(url);
  const data = await chrome.storage.local.get(KEYS.scanCache);
  const cache: Record<string, CachedScanEntry> =
    (data[KEYS.scanCache] as Record<string, CachedScanEntry>) || {};

  const keys = Object.keys(cache);
  if (keys.length >= MAX_CACHE_ENTRIES) {
    // Evict oldest
    let oldestKey = keys[0];
    let oldestTime = cache[oldestKey].timestamp;
    for (const k of keys) {
      if (cache[k].timestamp < oldestTime) {
        oldestTime = cache[k].timestamp;
        oldestKey = k;
      }
    }
    delete cache[oldestKey];
  }

  cache[norm] = {
    scan,
    timestamp: Date.now(),
  };

  await chrome.storage.local.set({ [KEYS.scanCache]: cache });
}

// ----------------------------------------------------
// Suspicious URL Bypass ("Continue Anyway")
// ----------------------------------------------------

export async function isUrlBypassed(url: string): Promise<boolean> {
  const norm = normalizeScanUrl(url);
  const data = await chrome.storage.local.get(KEYS.bypassedUrls);
  const list: string[] = (data[KEYS.bypassedUrls] as string[]) || [];
  return list.includes(norm);
}

export async function addBypassedUrl(url: string): Promise<void> {
  const norm = normalizeScanUrl(url);
  const data = await chrome.storage.local.get(KEYS.bypassedUrls);
  const list: string[] = (data[KEYS.bypassedUrls] as string[]) || [];
  if (!list.includes(norm)) {
    list.push(norm);
    if (list.length > 50) list.shift(); // Keep list bounded
    await chrome.storage.local.set({ [KEYS.bypassedUrls]: list });
  }
}

// ----------------------------------------------------
// Base URL Formatting
// ----------------------------------------------------

export function normalizeBaseUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  return trimmed || DEFAULT_BASE_URL;
}

export function originFromBaseUrl(baseUrl: string): string {
  const url = new URL(normalizeBaseUrl(baseUrl));
  return url.origin;
}

export { KEYS as STORAGE_KEYS };
