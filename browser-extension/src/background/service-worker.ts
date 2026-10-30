import {
  GuardianMessage,
  GuardianResponse,
  GuardianState,
  OverlayPayload,
  ScanResponse,
} from "../types";
import {
  addBypassedUrl,
  clearLastScan,
  getAuthState,
  getAutoProtection,
  getCachedScan,
  getLastScan,
  getLastTabId,
  getTabScan,
  isUrlBypassed,
  removeTabScan,
  saveLastTabId,
  saveTabScan,
  setAutoProtection,
  setBaseUrl,
} from "../storage/storage";
import { fetchMe, login, logout } from "../services/auth";
import { isMalicious, isSuspicious, reportScan, scanUrl } from "../services/scanner";
import { ApiError, isUnavailable } from "../services/api";
import { validateScanUrl } from "../utils/url";
import { addMaliciousDnrRule, clearMaliciousDnrRules } from "../services/dnr";

// In-flight scan tracker to prevent duplicate concurrent scans per tab
const activeTabScans = new Map<number, string>();

chrome.runtime.onInstalled.addListener(() => {
  console.info("SignalSafe Browser Guardian installed and active. Automatic threat protection enabled.");
});

// ----------------------------------------------------
// Automatic Website Scanning on Navigation Completed
// ----------------------------------------------------

chrome.webNavigation.onCompleted.addListener((details) => {
  // Only process top-level frame navigations (ignore subframes/iframes)
  if (details.frameId !== 0) return;
  void handleAutoScan(details.tabId, details.url);
});

// Clean up tab state when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  activeTabScans.delete(tabId);
  void removeTabScan(tabId);
});

async function handleAutoScan(tabId: number, rawUrl: string): Promise<void> {
  // Check if automatic protection is enabled
  const autoProtected = await getAutoProtection();
  if (!autoProtected) return;

  // Check if user is authenticated
  const auth = await getAuthState();
  if (!auth.accessToken) return;

  // Validate URL eligibility (skips chrome://, extension pages, localhost self-urls, etc.)
  const check = validateScanUrl(rawUrl, auth.baseUrl);
  if (!check.ok || !check.url) return;

  const targetUrl = check.url;

  // Check if user previously opted to "Continue Anyway" for this URL
  if (await isUrlBypassed(targetUrl)) return;

  // Prevent duplicate concurrent scanning if already in flight for this tab and URL
  if (activeTabScans.get(tabId) === targetUrl) return;
  activeTabScans.set(tabId, targetUrl);

  try {
    // Check if we have a valid cached result to avoid redundant remote requests
    let scan = await getCachedScan(targetUrl);
    if (!scan) {
      scan = await scanUrl(targetUrl, tabId);
    } else {
      await saveTabScan(tabId, scan);
    }

    // Race condition guard: verify tab is still open and has not navigated away during scan
    try {
      const tab = await chrome.tabs.get(tabId);
      if (!tab || !tab.url) return;
      const currentCheck = validateScanUrl(tab.url, auth.baseUrl);
      if (currentCheck.url !== targetUrl) {
        // Tab navigated elsewhere before scan finished; ignore stale response
        return;
      }
    } catch {
      // Tab was closed before scan completed
      return;
    }

    // Process scan verdict
    if (isMalicious(scan.risk_level)) {
      await handleMaliciousVerdict(tabId, targetUrl, scan);
    } else if (isSuspicious(scan.risk_level)) {
      await handleSuspiciousVerdict(tabId, targetUrl, scan);
    }
  } catch (error) {
    console.warn(`SignalSafe auto-scan failed for tab ${tabId} (${targetUrl}):`, error);
  } finally {
    if (activeTabScans.get(tabId) === targetUrl) {
      activeTabScans.delete(tabId);
    }
  }
}

async function handleMaliciousVerdict(tabId: number, url: string, scan: ScanResponse): Promise<void> {
  await saveLastTabId(tabId);
  await saveTabScan(tabId, scan);

  const domain = scan.domain || new URL(url).hostname;
  await addMaliciousDnrRule(domain, String(scan.id), url);

  // Immediately replace flagged destination with local warning page in the affected tab
  const warningUrl = chrome.runtime.getURL(
    `src/pages/warning.html?scan=${encodeURIComponent(scan.id)}&url=${encodeURIComponent(url)}&risk=malicious`
  );
  try {
    await chrome.tabs.update(tabId, { url: warningUrl });
  } catch (err) {
    console.error("Failed to navigate tab to warning page:", err);
  }
}

async function handleSuspiciousVerdict(tabId: number, url: string, scan: ScanResponse): Promise<void> {
  await saveTabScan(tabId, scan);

  const payload: OverlayPayload = {
    riskLevel: "suspicious",
    domain: scan.domain || new URL(url).hostname,
    url,
    explanation: Array.isArray(scan.explanation) ? scan.explanation.slice(0, 6) : [],
    scanId: String(scan.id),
    riskScore: scan.risk_score,
    recommendations: scan.recommendations || [],
  };

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/content/content.js"],
    });
    await chrome.tabs.sendMessage(tabId, { type: "SHOW_OVERLAY", payload });
  } catch {
    // In-page overlay fallback: if content script injection is restricted, popup displays verdict
  }
}

// ----------------------------------------------------
// Message Communication
// ----------------------------------------------------

chrome.runtime.onMessage.addListener((message: GuardianMessage, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id) {
    sendResponse({ ok: false, error: "Rejected untrusted message.", state: emptyState() });
    return false;
  }

  void handleMessage(message, sender.tab?.id)
    .then(sendResponse)
    .catch(async (error: unknown) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error.",
        state: await buildState(undefined, {
          error: error instanceof Error ? error.message : "Unexpected error.",
          phase: error instanceof ApiError && error.status === 401 ? "auth_expired" : "error",
        }),
      } satisfies GuardianResponse);
    });
  return true;
});

async function handleMessage(message: GuardianMessage, senderTabId?: number): Promise<GuardianResponse> {
  switch (message.type) {
    case "GET_STATE":
      return { ok: true, state: await buildState(message.tabId ?? senderTabId) };

    case "SET_AUTO_PROTECTION":
      await setAutoProtection(message.enabled);
      return { ok: true, state: await buildState(senderTabId) };

    case "SET_BASE_URL":
      await setBaseUrl(message.baseUrl);
      return { ok: true, state: await buildState(senderTabId) };

    case "LOGIN": {
      try {
        await login(message.email, message.password, message.baseUrl);
        return { ok: true, state: await buildState(senderTabId, { phase: "idle", error: null }) };
      } catch (error) {
        return failure(error, senderTabId);
      }
    }

    case "LOGOUT":
      await logout();
      await clearMaliciousDnrRules();
      return { ok: true, state: await buildState(senderTabId, { phase: "unauthenticated" }) };

    case "SCAN_CURRENT_TAB":
      return manualScanCurrentTab();

    case "REPORT_URL":
      return submitReport(message.scanId, message.incidentType);

    case "OPEN_WARNING":
      await openWarningPage(message.scanId, message.riskLevel, message.url);
      return { ok: true, state: await buildState(senderTabId) };

    case "CONTINUE_ANYWAY": {
      if (message.url) {
        await addBypassedUrl(message.url);
      }
      return { ok: true, state: await buildState(message.tabId ?? senderTabId) };
    }

    case "SAFE_RETURN":
      await safeReturn(message.tabId ?? senderTabId);
      return { ok: true, state: await buildState(message.tabId ?? senderTabId) };

    case "CLEAR_SCAN":
      await clearLastScan();
      return { ok: true, state: await buildState(senderTabId, { scan: null, phase: "idle" }) };

    default:
      return { ok: false, error: "Unknown message.", state: await buildState(senderTabId) };
  }
}

async function manualScanCurrentTab(): Promise<GuardianResponse> {
  const tab = await getActiveTab();
  const auth = await getAuthState();
  const check = validateScanUrl(tab.url, auth.baseUrl);
  if (!check.ok || !check.url) {
    return {
      ok: false,
      error: check.reason,
      state: await buildState(tab.id, { error: check.reason ?? "Cannot scan this tab.", phase: "error" }),
    };
  }

  try {
    if (tab.id !== undefined) {
      await saveLastTabId(tab.id);
      activeTabScans.set(tab.id, check.url);
    }
    // Manual scan forces fresh scan without stale cache
    const scan = await scanUrl(check.url, tab.id, true);
    const phase = phaseFromScan(scan);

    if (tab.id !== undefined) {
      if (isMalicious(scan.risk_level)) {
        await handleMaliciousVerdict(tab.id, check.url, scan);
      } else if (isSuspicious(scan.risk_level)) {
        await handleSuspiciousVerdict(tab.id, check.url, scan);
      }
    }

    return { ok: true, state: await buildState(tab.id, { scan, phase, error: null }) };
  } catch (error) {
    return failure(error, tab.id);
  } finally {
    if (tab.id !== undefined) {
      activeTabScans.delete(tab.id);
    }
  }
}

async function submitReport(scanId: string, incidentType?: string): Promise<GuardianResponse> {
  const scan = await getLastScan();
  if (!scan || String(scan.id) !== String(scanId)) {
    return {
      ok: false,
      error: "No matching scan record found to report.",
      state: await buildState(undefined, { error: "No matching scan record found to report." }),
    };
  }
  try {
    const report = await reportScan(scan, incidentType ?? "phishing");
    return {
      ok: true,
      state: await buildState(undefined, {
        reportStatus: `Report #${report.id.slice(0, 8)} successfully filed with Campus IT Security.`,
        reporting: false,
      }),
    };
  } catch (error) {
    return failure(error);
  }
}

async function openWarningPage(scanId: string, riskLevel = "malicious", url = ""): Promise<void> {
  const fullUrl = chrome.runtime.getURL(
    `src/pages/warning.html?scan=${encodeURIComponent(scanId)}&url=${encodeURIComponent(url)}&risk=${encodeURIComponent(riskLevel)}`
  );
  await chrome.tabs.create({ url: fullUrl, active: true });
}

async function safeReturn(tabId?: number): Promise<void> {
  const targetId = tabId && tabId > 0 ? tabId : (await getLastTabId());
  if (targetId && targetId > 0) {
    try {
      await chrome.tabs.goBack(targetId);
      return;
    } catch {
      try {
        await chrome.tabs.update(targetId, { url: "chrome://newtab/" });
        return;
      } catch {
        /* Tab may have already closed */
      }
    }
  }

  // Fallback: create fresh empty tab
  try {
    await chrome.tabs.create({ url: "chrome://newtab/", active: true });
  } catch {
    /* Ignore */
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

async function buildState(
  tabId?: number,
  partial?: Partial<GuardianState>
): Promise<GuardianState> {
  const auth = await getAuthState();
  const autoProtection = await getAutoProtection();

  let targetTab: chrome.tabs.Tab | null = null;
  if (tabId && tabId > 0) {
    try {
      targetTab = await chrome.tabs.get(tabId);
    } catch {
      targetTab = null;
    }
  }
  if (!targetTab) {
    try {
      targetTab = await getActiveTab();
    } catch {
      targetTab = null;
    }
  }

  const effectiveTabId = targetTab?.id ?? -1;
  const tabScan = effectiveTabId > 0 ? await getTabScan(effectiveTabId) : null;
  const scan = partial?.scan === null ? null : (partial?.scan ?? tabScan ?? (await getLastScan()));

  let tabInfo: GuardianState["tab"] = null;
  if (targetTab) {
    const check = validateScanUrl(targetTab.url, auth.baseUrl);
    tabInfo = {
      tabId: targetTab.id ?? -1,
      url: targetTab.url ?? "",
      title: targetTab.title ?? "",
      scannable: check.ok,
      reason: check.reason,
    };
  }

  // Determine state phase
  let phase: GuardianState["phase"] = "unauthenticated";
  if (auth.accessToken && auth.user) {
    if (effectiveTabId > 0 && activeTabScans.has(effectiveTabId)) {
      phase = "scanning";
    } else if (scan) {
      phase = phaseFromScan(scan);
    } else {
      phase = "idle";
    }
  }
  if (partial?.phase) phase = partial.phase;

  // Check backend health asynchronously
  const backendOnline = Boolean(auth.baseUrl);

  return {
    phase,
    baseUrl: auth.baseUrl,
    user: auth.user,
    authenticated: Boolean(auth.accessToken),
    autoProtection,
    backendOnline,
    tab: tabInfo,
    scan,
    error: partial?.error ?? null,
    reporting: partial?.reporting ?? false,
    reportStatus: partial?.reportStatus ?? null,
  };
}

async function failure(error: unknown, tabId?: number): Promise<GuardianResponse> {
  const message = error instanceof Error ? error.message : "Request failed.";
  let phase: GuardianState["phase"] = "error";
  if (error instanceof ApiError && error.status === 401) phase = "auth_expired";
  else if (isUnavailable(error)) phase = "backend_unavailable";
  return {
    ok: false,
    error: message,
    state: await buildState(tabId, { error: message, phase }),
  };
}

function emptyState(): GuardianState {
  return {
    phase: "unauthenticated",
    baseUrl: "https://signalsafe.onrender.com",
    user: null,
    authenticated: false,
    autoProtection: true,
    backendOnline: true,
    tab: null,
    scan: null,
    error: null,
    reporting: false,
    reportStatus: null,
  };
}

// Background startup session check
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
