import { GuardianMessage, GuardianResponse, GuardianState, OverlayPayload, ScanResponse } from "../types";
import { clearLastScan, getAuthState, getLastScan, setBaseUrl } from "../storage/storage";
import { login, logout, fetchMe } from "../services/auth";
import { reportScan, scanNeedsWarning, scanUrl } from "../services/scanner";
import { ApiError, isUnavailable } from "../services/api";
import { validateScanUrl } from "../utils/url";

chrome.runtime.onInstalled.addListener(() => {
  console.info("SignalSafe Browser Guardian ready. Scans are user-triggered; first-request blocking is not enabled.");
});

chrome.runtime.onMessage.addListener((message: GuardianMessage, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) {
    sendResponse({ ok: false, error: "Rejected untrusted message.", state: emptyState() });
    return false;
  }

  void handleMessage(message)
    .then(sendResponse)
    .catch(async (error: unknown) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error.",
        state: await buildState({
          error: error instanceof Error ? error.message : "Unexpected error.",
          phase: error instanceof ApiError && error.status === 401 ? "auth_expired" : "error",
        }),
      } satisfies GuardianResponse);
    });
  return true;
});

async function handleMessage(message: GuardianMessage): Promise<GuardianResponse> {
  switch (message.type) {
    case "GET_STATE":
      return { ok: true, state: await buildState() };
    case "SET_BASE_URL":
      await setBaseUrl(message.baseUrl);
      return { ok: true, state: await buildState() };
    case "LOGIN": {
      try {
        await login(message.email, message.password, message.baseUrl);
        return { ok: true, state: await buildState({ phase: "idle", error: null }) };
      } catch (error) {
        return failure(error);
      }
    }
    case "LOGOUT":
      await logout();
      return { ok: true, state: await buildState({ phase: "unauthenticated" }) };
    case "SCAN_CURRENT_TAB":
      return scanCurrentTab();
    case "REPORT_URL":
      return submitReport(message.scanId, message.incidentType);
    case "OPEN_WARNING":
      await openWarningPage(message.scanId);
      return { ok: true, state: await buildState() };
    case "SAFE_RETURN":
      await safeReturn(message.tabId);
      return { ok: true, state: await buildState() };
    case "CLEAR_SCAN":
      await clearLastScan();
      return { ok: true, state: await buildState({ scan: null, phase: "idle" }) };
    default:
      return { ok: false, error: "Unknown message.", state: await buildState() };
  }
}

async function scanCurrentTab(): Promise<GuardianResponse> {
  const tab = await getActiveTab();
  const check = validateScanUrl(tab.url);
  if (!check.ok || !check.url) {
    return {
      ok: false,
      error: check.reason,
      state: await buildState({ error: check.reason ?? "Cannot scan this tab.", phase: "error" }),
    };
  }

  try {
    const scan = await scanUrl(check.url);
    const phase = phaseFromScan(scan);
    if (scanNeedsWarning(scan) && tab.id !== undefined) {
      await showWarningSurfaces(tab.id, scan);
    }
    return { ok: true, state: await buildState({ scan, phase, error: null }) };
  } catch (error) {
    return failure(error);
  }
}

async function submitReport(scanId: string, incidentType?: string): Promise<GuardianResponse> {
  const scan = await getLastScan();
  if (!scan || String(scan.id) !== String(scanId)) {
    return {
      ok: false,
      error: "No matching scan is stored to report.",
      state: await buildState({ error: "No matching scan is stored to report." }),
    };
  }
  try {
    const report = await reportScan(scan, incidentType ?? "phishing");
    return {
      ok: true,
      state: await buildState({
        reportStatus: `Report ${report.id} submitted (${report.status}).`,
        reporting: false,
      }),
    };
  } catch (error) {
    return failure(error);
  }
}

async function showWarningSurfaces(tabId: number, scan: ScanResponse): Promise<void> {
  await openWarningPage(String(scan.id));
  const payload: OverlayPayload = {
    riskLevel: scan.risk_level,
    domain: scan.domain || new URL(scan.normalized_url || scan.original_input).hostname,
    url: scan.normalized_url || scan.original_input,
    explanation: Array.isArray(scan.explanation) ? scan.explanation.slice(0, 6) : [],
    scanId: String(scan.id),
  };

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/content/content.ts"],
    });
    await chrome.tabs.sendMessage(tabId, { type: "SHOW_OVERLAY", payload });
  } catch {
    // Overlay is best-effort. The extension warning page is the guaranteed surface.
  }
}

async function openWarningPage(scanId: string): Promise<void> {
  const url = chrome.runtime.getURL(`src/pages/warning.html?scan=${encodeURIComponent(scanId)}`);
  await chrome.tabs.create({ url, active: true });
}

async function safeReturn(tabId: number): Promise<void> {
  try {
    await chrome.tabs.goBack(tabId);
  } catch {
    await chrome.tabs.update(tabId, { url: "chrome://newtab/" });
  }
}

async function getActiveTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    throw new ApiError("No active tab.", null, "invalid");
  }
  return tab;
}

function phaseFromScan(scan: ScanResponse): GuardianState["phase"] {
  const level = (scan.risk_level || "").toLowerCase();
  if (level === "malicious") return "malicious";
  if (level === "suspicious") return "suspicious";
  if (level === "safe") return "safe";
  if (level === "inconclusive") return "inconclusive";
  return "idle";
}

async function buildState(partial?: Partial<GuardianState>): Promise<GuardianState> {
  const auth = await getAuthState();
  const scan = partial?.scan === null ? null : (partial?.scan ?? (await getLastScan()));
  let tabInfo: GuardianState["tab"] = null;
  try {
    const tab = await getActiveTab();
    const check = validateScanUrl(tab.url);
    tabInfo = {
      tabId: tab.id ?? -1,
      url: tab.url ?? "",
      title: tab.title ?? "",
      scannable: check.ok,
      reason: check.reason,
    };
  } catch {
    tabInfo = {
      tabId: -1,
      url: "",
      title: "",
      scannable: false,
      reason: "Unable to read the current tab.",
    };
  }

  let phase: GuardianState["phase"] = "unauthenticated";
  if (auth.accessToken && auth.user) {
    phase = scan ? phaseFromScan(scan) : "idle";
  }
  if (partial?.phase) phase = partial.phase;

  return {
    phase,
    baseUrl: auth.baseUrl,
    user: auth.user,
    authenticated: Boolean(auth.accessToken),
    tab: tabInfo,
    scan,
    error: partial?.error ?? null,
    reporting: partial?.reporting ?? false,
    reportStatus: partial?.reportStatus ?? null,
  };
}

async function failure(error: unknown): Promise<GuardianResponse> {
  const message = error instanceof Error ? error.message : "Request failed.";
  let phase: GuardianState["phase"] = "error";
  if (error instanceof ApiError && error.status === 401) phase = "auth_expired";
  else if (isUnavailable(error)) phase = "backend_unavailable";
  return {
    ok: false,
    error: message,
    state: await buildState({ error: message, phase }),
  };
}

function emptyState(): GuardianState {
  return {
    phase: "unauthenticated",
    baseUrl: "http://127.0.0.1:8000",
    user: null,
    authenticated: false,
    tab: null,
    scan: null,
    error: null,
    reporting: false,
    reportStatus: null,
  };
}

void (async () => {
  const auth = await getAuthState();
  if (!auth.accessToken) return;
  try {
    await fetchMe();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      await logout();
    }
  }
})();
