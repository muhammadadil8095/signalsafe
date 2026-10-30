import { AuthResponse, TokenPair, User } from "../types";
import {
  clearAuth,
  getAuthState,
  setAccessToken,
  setBaseUrl,
  setTokens,
} from "../storage/storage";
import { ApiError, apiRequest, ensureHostPermission, isExpiredStatus } from "./api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginInput(email: string, password: string, baseUrl: string): string | null {
  if (!baseUrl.trim()) return "Enter the SignalSafe backend base URL.";
  try {
    const url = new URL(baseUrl.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "Backend URL must start with http:// or https://.";
    }
  } catch {
    return "Backend URL is not valid.";
  }
  if (!EMAIL_PATTERN.test(email.trim())) return "Enter a valid email address.";
  if (!password) return "Enter your password.";
  return null;
}

export async function login(
  email: string,
  password: string,
  baseUrl: string
): Promise<AuthResponse> {
  const error = validateLoginInput(email, password, baseUrl);
  if (error) throw new ApiError(error, null, "invalid");

  const normalized = baseUrl.trim().replace(/\/+$/, "");
  await ensureHostPermission(normalized);
  await setBaseUrl(normalized);

  const result = await apiRequest<AuthResponse>({
    baseUrl: normalized,
    path: "/auth/login",
    method: "POST",
    body: { email: email.trim(), password },
  });

  if (!result?.access_token || !result.refresh_token) {
    throw new ApiError("Login response did not include tokens.", null, "invalid");
  }

  await setTokens(result.access_token, result.refresh_token, result.user ?? null);
  return result;
}

export async function logout(): Promise<void> {
  await clearAuth();
}

export async function refreshTokens(): Promise<string | null> {
  const auth = await getAuthState();
  if (!auth.refreshToken) return null;
  try {
    const pair = await apiRequest<TokenPair>({
      baseUrl: auth.baseUrl,
      path: "/auth/refresh",
      method: "POST",
      body: { refresh_token: auth.refreshToken },
    });
    if (!pair.access_token) return null;
    if (pair.refresh_token) {
      await setTokens(pair.access_token, pair.refresh_token, auth.user);
    } else {
      await setAccessToken(pair.access_token);
    }
    return pair.access_token;
  } catch {
    await clearAuth();
    return null;
  }
}

export async function authedRequest<T>(options: {
  path: string;
  method?: string;
  body?: unknown;
}): Promise<T> {
  const auth = await getAuthState();
  if (!auth.accessToken) {
    throw new ApiError("Sign in to scan with SignalSafe Campus.", 401, "http");
  }

  try {
    return await apiRequest<T>({
      baseUrl: auth.baseUrl,
      path: options.path,
      method: options.method,
      token: auth.accessToken,
      body: options.body,
    });
  } catch (error) {
    if (error instanceof ApiError && isExpiredStatus(error.status)) {
      const next = await refreshTokens();
      if (!next) {
        throw new ApiError("Authentication expired. Sign in again.", 401, "http");
      }
      return apiRequest<T>({
        baseUrl: auth.baseUrl,
        path: options.path,
        method: options.method,
        token: next,
        body: options.body,
      });
    }
    throw error;
  }
}

export async function fetchMe(): Promise<User> {
  return authedRequest<User>({ path: "/auth/me" });
}
