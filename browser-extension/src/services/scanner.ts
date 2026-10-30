import { IncidentCreate, IncidentResponse, ScanResponse } from "../types";
import { saveLastScan } from "../storage/storage";
import { authedRequest } from "./auth";
import { ApiError } from "./api";
import { isHighRisk, validateScanUrl } from "../utils/url";

export async function scanUrl(url: string): Promise<ScanResponse> {
  const check = validateScanUrl(url);
  if (!check.ok || !check.url) {
    throw new ApiError(check.reason ?? "Invalid URL.", null, "invalid");
  }

  const scan = await authedRequest<ScanResponse>({
    path: "/scans/url",
    method: "POST",
    body: { url: check.url },
  });

  await saveLastScan(scan);
  return scan;
}

export async function reportScan(scan: ScanResponse, incidentType = "phishing"): Promise<IncidentResponse> {
  const level = (scan.risk_level || "").toLowerCase();
  const severity = level === "malicious" ? "high" : "medium";
  const domain = scan.domain || "unknown host";
  const payload: IncidentCreate = {
    title: `Browser Guardian flag: ${domain}`,
    description: [
      `Reported from SignalSafe Browser Guardian.`,
      `URL: ${scan.normalized_url || scan.original_input}`,
      `Risk level: ${scan.risk_level}`,
      `Risk score: ${scan.risk_score}`,
      `Prediction: ${scan.prediction}`,
      scan.explanation?.length ? `Explanation:\n${scan.explanation.join("\n")}` : "",
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
