import { AuthState, DEFAULT_BASE_URL, ScanResponse, User } from "../types";

const KEYS = {
  access: "ssg.accessToken",
  refresh: "ssg.refreshToken",
  user: "ssg.user",
  baseUrl: "ssg.baseUrl",
  lastScan: "ssg.lastScan",
} as const;

/**
 * Token storage for trusted extension contexts only (service worker + popup +
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
  await chrome.storage.local.remove([KEYS.access, KEYS.refresh, KEYS.user, KEYS.lastScan]);
}

export async function setBaseUrl(baseUrl: string): Promise<void> {
  await chrome.storage.local.set({ [KEYS.baseUrl]: normalizeBaseUrl(baseUrl) });
}

export async function saveLastScan(scan: ScanResponse): Promise<void> {
  await chrome.storage.local.set({ [KEYS.lastScan]: scan });
}

export async function getLastScan(): Promise<ScanResponse | null> {
  const data = await chrome.storage.local.get(KEYS.lastScan);
  return (data[KEYS.lastScan] as ScanResponse | undefined) ?? null;
}

export async function clearLastScan(): Promise<void> {
  await chrome.storage.local.remove(KEYS.lastScan);
}

export function normalizeBaseUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");
  return trimmed || DEFAULT_BASE_URL;
}

export function originFromBaseUrl(baseUrl: string): string {
  const url = new URL(normalizeBaseUrl(baseUrl));
  return url.origin;
}

export { KEYS as STORAGE_KEYS };
