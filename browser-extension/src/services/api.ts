import { API_PREFIX, REQUEST_TIMEOUT_MS } from "../types";
import { originFromBaseUrl } from "../storage/storage";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly code: "http" | "timeout" | "network" | "invalid"
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isExpiredStatus(status: number | null): boolean {
  return status === 401;
}

export function isUnavailable(error: unknown): boolean {
  return error instanceof ApiError && (error.code === "timeout" || error.code === "network");
}

export async function checkBackendHealth(baseUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function ensureHostPermission(baseUrl: string): Promise<void> {
  const origin = `${originFromBaseUrl(baseUrl)}/*`;
  const already = await chrome.permissions.contains({ origins: [origin] });
  if (already) return;
  const granted = await chrome.permissions.request({ origins: [origin] });
  if (!granted) {
    throw new ApiError(
      `Host permission was not granted for ${originFromBaseUrl(baseUrl)}.`,
      null,
      "invalid"
    );
  }
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${API_PREFIX}${path}`;
}

export async function apiRequest<T>(options: {
  baseUrl: string;
  path: string;
  method?: string;
  token?: string | null;
  body?: unknown;
  timeoutMs?: number;
}): Promise<T> {
  const { baseUrl, path, method = "GET", token, body, timeoutMs = REQUEST_TIMEOUT_MS } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(joinUrl(baseUrl, path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await response.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        parsed = text;
      }
    }

    if (!response.ok) {
      throw new ApiError(extractDetail(parsed, response.status), response.status, "http");
    }

    return parsed as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The SignalSafe API timed out. Try again.", null, "timeout");
    }
    throw new ApiError(
      "SignalSafe backend is unavailable. Check the base URL and that the API is running.",
      null,
      "network"
    );
  } finally {
    clearTimeout(timer);
  }
}

function extractDetail(parsed: unknown, status: number): string {
  if (parsed && typeof parsed === "object" && "detail" in parsed) {
    const detail = (parsed as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: unknown }).msg);
          }
          return JSON.stringify(item);
        })
        .join("; ");
    }
  }
  if (status === 401) return "Authentication expired. Sign in again.";
  if (status === 403) return "This account is not allowed to scan URLs.";
  if (status === 422) return "The API rejected this URL. Use a full http(s) address.";
  return `Request failed (${status}).`;
}
