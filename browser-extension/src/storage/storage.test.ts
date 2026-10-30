import { beforeEach, describe, expect, it } from "vitest";
import {
  addBypassedUrl,
  getAutoProtection,
  getCachedScan,
  getTabScan,
  isUrlBypassed,
  removeTabScan,
  saveTabScan,
  setAutoProtection,
  setCachedScan,
} from "./storage";
import { ScanResponse } from "../types";

// In-memory mock for chrome.storage.local
const mockStorage: Record<string, unknown> = {};

// Setup global.chrome mock
(globalThis as unknown as { chrome: unknown }).chrome = {
  storage: {
    local: {
      get: (keys: string | string[]) => {
        if (typeof keys === "string") {
          return Promise.resolve({ [keys]: mockStorage[keys] });
        }
        const res: Record<string, unknown> = {};
        for (const k of keys) {
          if (mockStorage[k] !== undefined) res[k] = mockStorage[k];
        }
        return Promise.resolve(res);
      },
      set: (obj: Record<string, unknown>) => {
        Object.assign(mockStorage, obj);
        return Promise.resolve();
      },
      remove: (keys: string | string[]) => {
        const arr = Array.isArray(keys) ? keys : [keys];
        for (const k of arr) {
          delete mockStorage[k];
        }
        return Promise.resolve();
      },
    },
  },
};

const dummyScan: ScanResponse = {
  id: "scan-12345",
  scan_type: "url",
  original_input: "https://example.com/test",
  normalized_url: "https://example.com/test",
  domain: "example.com",
  risk_score: 10,
  risk_level: "safe",
  prediction: "safe",
  ml_available: true,
  ml_prediction: "safe",
  ml_confidence: 0.95,
  vt_available: true,
  vt_malicious: 0,
  vt_suspicious: 0,
  vt_undetected: 70,
  signals: [],
  explanation: ["URL is categorized as legitimate"],
  recommendations: ["Safe to browse"],
  threat_signals: [],
  scanned_at: new Date().toISOString(),
};

describe("storage service", () => {
  beforeEach(() => {
    for (const key in mockStorage) {
      delete mockStorage[key];
    }
  });

  describe("Automatic Protection toggle", () => {
    it("defaults to true when unset", async () => {
      const active = await getAutoProtection();
      expect(active).toBe(true);
    });

    it("persists false when disabled", async () => {
      await setAutoProtection(false);
      expect(await getAutoProtection()).toBe(false);
    });

    it("persists true when re-enabled", async () => {
      await setAutoProtection(false);
      await setAutoProtection(true);
      expect(await getAutoProtection()).toBe(true);
    });
  });

  describe("Tab scan association", () => {
    it("stores and retrieves scan results per tab ID independently", async () => {
      const tab1Scan: ScanResponse = { ...dummyScan, id: "scan-tab1", domain: "tab1.com" };
      const tab2Scan: ScanResponse = { ...dummyScan, id: "scan-tab2", domain: "tab2.com" };

      await saveTabScan(101, tab1Scan);
      await saveTabScan(102, tab2Scan);

      expect((await getTabScan(101))?.domain).toBe("tab1.com");
      expect((await getTabScan(102))?.domain).toBe("tab2.com");
      expect(await getTabScan(999)).toBeNull();
    });

    it("clears tab state on tab removal", async () => {
      await saveTabScan(101, dummyScan);
      expect(await getTabScan(101)).not.toBeNull();
      await removeTabScan(101);
      expect(await getTabScan(101)).toBeNull();
    });
  });

  describe("Scan cache with TTL", () => {
    it("caches and returns scan for matching normalized URL", async () => {
      await setCachedScan("https://example.com/test", dummyScan);
      const cached = await getCachedScan("https://example.com/test");
      expect(cached).not.toBeNull();
      expect(cached?.id).toBe("scan-12345");
    });

    it("returns null for uncached URL", async () => {
      const cached = await getCachedScan("https://not-cached.com");
      expect(cached).toBeNull();
    });
  });

  describe("Bypassed URLs ('Continue Anyway')", () => {
    it("tracks bypassed URLs so warnings are not shown repeatedly", async () => {
      expect(await isUrlBypassed("https://suspicious-test.com")).toBe(false);
      await addBypassedUrl("https://suspicious-test.com");
      expect(await isUrlBypassed("https://suspicious-test.com")).toBe(true);
      expect(await isUrlBypassed("https://other-site.com")).toBe(false);
    });
  });
});

