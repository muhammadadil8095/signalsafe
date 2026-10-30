export interface UrlCheck {
  ok: boolean;
  url?: string;
  reason?: string;
}

export function validateScanUrl(raw: string | undefined | null): UrlCheck {
  if (!raw || !raw.trim()) {
    return { ok: false, reason: "This tab has no URL to scan." };
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, reason: "The tab URL is not a valid address." };
  }

  const blocked = new Set([
    "chrome:",
    "chrome-extension:",
    "edge:",
    "extension:",
    "about:",
    "moz-extension:",
    "devtools:",
    "view-source:",
  ]);

  if (blocked.has(parsed.protocol) || parsed.protocol === "file:") {
    return {
      ok: false,
      reason: "Browser pages, extension pages, and local files cannot be scanned.",
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "Only http and https URLs can be submitted to SignalSafe." };
  }

  if (!parsed.hostname) {
    return { ok: false, reason: "The URL has no hostname." };
  }

  return { ok: true, url: parsed.toString() };
}

export function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function isHighRisk(riskLevel: string): boolean {
  const level = riskLevel.toLowerCase();
  return level === "malicious" || level === "suspicious";
}
