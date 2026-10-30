import { IncidentCreate, IncidentResponse, ScanResponse } from "../types";
import { getCachedScan, saveLastScan, saveTabScan, setCachedScan } from "../storage/storage";
import { authedRequest } from "./auth";
import { ApiError } from "./api";
import { isHighRisk, isMalicious, isSuspicious, validateScanUrl } from "../utils/url";

export async function scanUrl(url: string, tabId?: number, skipCache = false): Promise<ScanResponse> {
  const check = validateScanUrl(url);
  if (!check.ok || !check.url) {
    throw new ApiError(check.reason ?? "Invalid URL.", null, "invalid");
  }

  // Check cache first to prevent duplicate remote scans
  if (!skipCache) {
    const cached = await getCachedScan(check.url);
    if (cached) {
      if (tabId !== undefined) {
        await saveTabScan(tabId, cached);
      } else {
        await saveLastScan(cached);
      }
      return cached;
    }
  }

  const scan = await authedRequest<ScanResponse>({
    path: "/scans/url",
    method: "POST",
    body: { url: check.url },
  });

  await setCachedScan(check.url, scan);
  if (tabId !== undefined) {
    await saveTabScan(tabId, scan);
  } else {
    await saveLastScan(scan);
  }

  return scan;
}

export async function reportScan(scan: ScanResponse, incidentType = "phishing"): Promise<IncidentResponse> {
  const level = (scan.risk_level || "").toLowerCase();
  const severity = level === "malicious" ? "high" : "medium";
  const domain = scan.domain || "unknown host";
  const payload: IncidentCreate = {
    title: `SignalSafe Alert: ${domain}`,
    description: [
      `Submitted automatically via SignalSafe Browser Guardian.`,
      `Target URL: ${scan.normalized_url || scan.original_input}`,
      `Risk Level: ${scan.risk_level.toUpperCase()}`,
      `Risk Score: ${scan.risk_score}/100`,
      `Detection Verdict: ${scan.prediction}`,
      scan.explanation?.length ? `Explanation:\n${scan.explanation.join("\n")}` : "",
      scan.recommendations?.length ? `Recommendations:\n${scan.recommendations.join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    incident_type: incidentType,
    severity,
    related_scan_id: scan.id,
  };

  return authedRequest<IncidentResponse>({
    path: "/reports/",
    method: "POST",
    body: payload,
  });
}

export function scanNeedsWarning(scan: ScanResponse): boolean {
  return isHighRisk(scan.risk_level);
}

export { isMalicious, isSuspicious };
