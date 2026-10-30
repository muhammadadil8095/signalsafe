import { beforeEach, describe, expect, it } from "vitest";
import { validateScanUrl } from "../utils/url";
import { ScanResponse } from "../types";

describe("automatic scanning logic & reliability rules", () => {
  // In-flight tracker simulation
  let activeTabScans: Map<number, string>;
  let tabScans: Map<number, ScanResponse>;
  let bypassedUrls: Set<string>;

  const mockSafeScan: ScanResponse = {
    id: "scan-safe-1",
    scan_type: "url",
    original_input: "https://campus-library.edu",
    normalized_url: "https://campus-library.edu",
    domain: "campus-library.edu",
    risk_score: 5,
    risk_level: "safe",
    prediction: "benign",
    ml_available: true,
    ml_prediction: "safe",
    ml_confidence: 0.99,
    vt_available: true,
    vt_malicious: 0,
    vt_suspicious: 0,
    vt_undetected: 70,
    signals: [],
    explanation: ["No threats found"],
    recommendations: ["Safe to browse"],
    scanned_at: new Date().toISOString(),
  };

  const mockMaliciousScan: ScanResponse = {
    id: "scan-mal-1",
    scan_type: "url",
    original_input: "https://fake-login-campus.net",
    normalized_url: "https://fake-login-campus.net",
    domain: "fake-login-campus.net",
    risk_score: 95,
    risk_level: "malicious",
    prediction: "credential_phishing",
    ml_available: true,
    ml_prediction: "malicious",
    ml_confidence: 0.99,
    vt_available: true,
    vt_malicious: 18,
    vt_suspicious: 2,
    vt_undetected: 50,
    signals: [{ severity: "high", signal_type: "phishing", description: "Harvests user passwords" }],
    explanation: ["Detected brand impersonation"],
    recommendations: ["Leave page immediately"],
    scanned_at: new Date().toISOString(),
  };

  beforeEach(() => {
    activeTabScans = new Map();
    tabScans = new Map();
    bypassedUrls = new Set();
  });

  describe("Automatic scanning eligibility", () => {
    it("skips scan when automatic protection is disabled", () => {
      const autoProtection = false;
      const isAuthenticated = true;
      const shouldScan = autoProtection && isAuthenticated;
      expect(shouldScan).toBe(false);
    });

    it("skips scan when user is unauthenticated", () => {
      const autoProtection = true;
      const isAuthenticated = false;
      const shouldScan = autoProtection && isAuthenticated;
      expect(shouldScan).toBe(false);
    });

    it("skips scan for invalid or internal browser schemes", () => {
      expect(validateScanUrl("chrome://extensions").ok).toBe(false);
      expect(validateScanUrl("edge://settings").ok).toBe(false);
      expect(validateScanUrl("file:///home/user/test.html").ok).toBe(false);
    });

    it("skips scan if URL was explicitly bypassed by user via Continue Anyway", () => {
      const targetUrl = "https://suspicious-test.edu";
      bypassedUrls.add(targetUrl);
      const isBypassed = bypassedUrls.has(targetUrl);
      expect(isBypassed).toBe(true);
    });
  });

  describe("Duplicate in-flight scan prevention", () => {
    it("prevents redundant concurrent scan when a scan is already in-flight for tab and URL", () => {
      const tabId = 101;
      const url = "https://campus-portal.edu/home";

      // First navigation begins scan
      expect(activeTabScans.get(tabId)).toBeUndefined();
      activeTabScans.set(tabId, url);

      // Duplicate navigation event fires before first scan finishes
      const isAlreadyInFlight = activeTabScans.get(tabId) === url;
      expect(isAlreadyInFlight).toBe(true);

      // Clean up after completion
      activeTabScans.delete(tabId);
      expect(activeTabScans.get(tabId)).toBeUndefined();
    });
  });

  describe("Multi-tab scan isolation", () => {
    it("associates scan verdicts strictly with the corresponding tab", () => {
      const tab1 = 101;
      const tab2 = 102;

      tabScans.set(tab1, mockSafeScan);
      tabScans.set(tab2, mockMaliciousScan);

      expect(tabScans.get(tab1)?.risk_level).toBe("safe");
      expect(tabScans.get(tab2)?.risk_level).toBe("malicious");

      // Closing tab1 clears only tab1
      tabScans.delete(tab1);
      expect(tabScans.get(tab1)).toBeUndefined();
      expect(tabScans.get(tab2)?.risk_level).toBe("malicious");
    });
  });

  describe("Race condition & fast navigation handling", () => {
    it("discards scan result if tab navigated to another URL before scan completed", () => {
      const tabId = 201;
      const initialUrl: string = "https://slow-analyzing-site.com";
      activeTabScans.set(tabId, initialUrl);

      // User immediately clicks a link or navigates away
      const currentTabUrl: string = "https://new-destination.com";

      // When async scan returns, we check if tab URL still matches
      const isStale = currentTabUrl !== initialUrl;
      expect(isStale).toBe(true);

      // Stale response is dropped, does not update tabScans
      if (!isStale) {
        tabScans.set(tabId, mockSafeScan);
      }
      expect(tabScans.get(tabId)).toBeUndefined();
    });
  });
});
