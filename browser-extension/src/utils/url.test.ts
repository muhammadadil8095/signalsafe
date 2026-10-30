import { describe, expect, it } from "vitest";
import {
  domainFromUrl,
  isHighRisk,
  isMalicious,
  isSuspicious,
  normalizeScanUrl,
  validateScanUrl,
} from "./url";

describe("validateScanUrl", () => {
  it("accepts valid http and https URLs", () => {
    expect(validateScanUrl("https://example.com/login").ok).toBe(true);
    expect(validateScanUrl("http://campus.edu").ok).toBe(true);
    expect(validateScanUrl("https://portal.university.edu/auth?dest=student").ok).toBe(true);
  });

  it("rejects browser and extension pages", () => {
    expect(validateScanUrl("chrome://extensions").ok).toBe(false);
    expect(validateScanUrl("edge://settings").ok).toBe(false);
    expect(validateScanUrl("chrome-extension://abc123xyz/popup.html").ok).toBe(false);
    expect(validateScanUrl("file:///C:/Users/student/doc.html").ok).toBe(false);
    expect(validateScanUrl("about:blank").ok).toBe(false);
    expect(validateScanUrl("javascript:void(0)").ok).toBe(false);
  });

  it("rejects empty or whitespace values", () => {
    expect(validateScanUrl("").ok).toBe(false);
    expect(validateScanUrl("   ").ok).toBe(false);
    expect(validateScanUrl(undefined).ok).toBe(false);
    expect(validateScanUrl(null).ok).toBe(false);
  });

  it("rejects SignalSafe backend and frontend self-URLs to prevent recursive scanning", () => {
    expect(validateScanUrl("https://signalsafe.onrender.com").ok).toBe(false);
    expect(validateScanUrl("https://signalsafe.onrender.com/api/v1/scans").ok).toBe(false);
    expect(validateScanUrl("https://signalsafe.vercel.app/").ok).toBe(false);
    expect(validateScanUrl("http://127.0.0.1:8000/docs").ok).toBe(false);
  });

  it("normalizes URLs by stripping fragments", () => {
    const res = validateScanUrl("https://example.com/index.html#section-two");
    expect(res.ok).toBe(true);
    expect(res.url).toBe("https://example.com/index.html");
  });
});

describe("normalizeScanUrl", () => {
  it("removes URL fragments while preserving query parameters", () => {
    expect(normalizeScanUrl("https://test.edu/login?ref=1#top")).toBe("https://test.edu/login?ref=1");
  });
});

describe("domainFromUrl", () => {
  it("extracts hostname from URL", () => {
    expect(domainFromUrl("https://portal.university.edu/path")).toBe("portal.university.edu");
    expect(domainFromUrl("http://phish-site.com:8080/index")).toBe("phish-site.com");
  });
});

describe("risk classification helpers", () => {
  it("identifies high risk for malicious and suspicious only", () => {
    expect(isHighRisk("malicious")).toBe(true);
    expect(isHighRisk("suspicious")).toBe(true);
    expect(isHighRisk("safe")).toBe(false);
    expect(isHighRisk("inconclusive")).toBe(false);
    expect(isHighRisk(null)).toBe(false);
  });

  it("identifies malicious", () => {
    expect(isMalicious("malicious")).toBe(true);
    expect(isMalicious("suspicious")).toBe(false);
    expect(isMalicious("safe")).toBe(false);
  });

  it("identifies suspicious", () => {
    expect(isSuspicious("suspicious")).toBe(true);
    expect(isSuspicious("malicious")).toBe(false);
    expect(isSuspicious("safe")).toBe(false);
  });
});
