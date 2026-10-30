import { describe, expect, it, vi } from "vitest";
import { reportScan, scanNeedsWarning } from "./scanner";
import { ScanResponse } from "../types";
import * as authService from "./auth";

describe("scanner service", () => {
  const sampleScan: ScanResponse = {
    id: "scan-abc-123",
    scan_type: "url",
    original_input: "https://phish-portal.org/login",
    normalized_url: "https://phish-portal.org/login",
    domain: "phish-portal.org",
    risk_score: 92,
    risk_level: "malicious",
    prediction: "phishing",
    ml_available: true,
    ml_prediction: "malicious",
    ml_confidence: 0.98,
    vt_available: true,
    vt_malicious: 12,
    vt_suspicious: 4,
    vt_undetected: 54,
    signals: [{ severity: "high", signal_type: "brand_impersonation", description: "Impersonates campus portal" }],
    explanation: ["Credential harvesting patterns detected"],
    recommendations: ["Do not enter credentials"],
    threat_signals: [],
    scanned_at: "2026-10-31T03:00:00Z",
  };

  describe("scanNeedsWarning", () => {
    it("returns true for malicious and suspicious scans", () => {
      expect(scanNeedsWarning(sampleScan)).toBe(true);
      expect(scanNeedsWarning({ ...sampleScan, risk_level: "suspicious" })).toBe(true);
    });

    it("returns false for safe and inconclusive scans", () => {
      expect(scanNeedsWarning({ ...sampleScan, risk_level: "safe" })).toBe(false);
      expect(scanNeedsWarning({ ...sampleScan, risk_level: "inconclusive" })).toBe(false);
    });
  });

  describe("reportScan", () => {
    it("submits incident report with correct payload and related_scan_id", async () => {
      const authedRequestSpy = vi.spyOn(authService, "authedRequest").mockResolvedValue({
        id: "incident-999",
        reporter_id: "user-1",
        title: "SignalSafe Alert: phish-portal.org",
        description: "Test description",
        incident_type: "phishing",
        severity: "high",
        status: "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const res = await reportScan(sampleScan, "phishing");
      expect(res.id).toBe("incident-999");
      expect(authedRequestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: "/reports/",
          method: "POST",
          body: expect.objectContaining({
            title: "SignalSafe Alert: phish-portal.org",
            severity: "high",
            related_scan_id: "scan-abc-123",
          }),
        })
      );
    });
  });
});

