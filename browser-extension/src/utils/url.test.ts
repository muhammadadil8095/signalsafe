import { describe, expect, it } from "vitest";
import { isHighRisk, validateScanUrl } from "./url";

describe("validateScanUrl", () => {
  it("accepts http and https", () => {
    expect(validateScanUrl("https://example.com/login").ok).toBe(true);
    expect(validateScanUrl("http://campus.edu").ok).toBe(true);
  });

  it("rejects browser and extension pages", () => {
    expect(validateScanUrl("chrome://extensions").ok).toBe(false);
    expect(validateScanUrl("edge://settings").ok).toBe(false);
    expect(validateScanUrl("chrome-extension://abc/popup.html").ok).toBe(false);
    expect(validateScanUrl("file:///tmp/page.html").ok).toBe(false);
  });

  it("rejects empty values", () => {
    expect(validateScanUrl("").ok).toBe(false);
    expect(validateScanUrl(undefined).ok).toBe(false);
  });
});

describe("isHighRisk", () => {
  it("flags malicious and suspicious only", () => {
    expect(isHighRisk("malicious")).toBe(true);
    expect(isHighRisk("suspicious")).toBe(true);
    expect(isHighRisk("safe")).toBe(false);
    expect(isHighRisk("inconclusive")).toBe(false);
  });
});
