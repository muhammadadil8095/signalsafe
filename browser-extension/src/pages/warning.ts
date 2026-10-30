import "@fontsource/red-hat-text/400.css";
import "@fontsource/red-hat-text/700.css";
import "@fontsource/red-hat-mono/400.css";
import "../popup/popup.css";
import { ScanResponse } from "../types";
import { getLastScan } from "../storage/storage";
import { isHighRisk } from "../utils/url";

const root = document.getElementById("root");

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function render(scan: ScanResponse | null, requestedId: string | null) {
  if (!root) return;
  document.body.style.width = "100%";
  document.documentElement.style.width = "100%";
  document.body.style.minHeight = "100vh";

  if (!scan || (requestedId && String(scan.id) !== requestedId)) {
    root.innerHTML = `
      <main class="main" style="max-width:680px;margin:60px auto;background:var(--panel);border:1px solid var(--well-edge);padding:32px;border-radius:4px;">
        <h1 style="color:var(--cyan);font-size:22px;margin:0 0 12px;">No Active Threat Record</h1>
        <p style="color:var(--muted);line-height:1.6;">This warning page displays security verdicts returned by the SignalSafe Campus analysis engine. No scan record matches the requested ID.</p>
        <button class="btn btn-ghost" style="margin-top:16px;" onclick="window.close()">Close Page</button>
      </main>`;
    return;
  }

  const high = isHighRisk(scan.risk_level);
  const reasons = (scan.explanation?.length ? scan.explanation : []).map(
    (line) => `<li>${escapeHtml(line)}</li>`
  ).join("");

  const heuristicList = [
    ...(scan.threat_signals || []),
    ...(scan.signals || []),
  ].map((sig: unknown) => {
    if (typeof sig === "string") return `<li>${escapeHtml(sig)}</li>`;
    if (sig && typeof sig === "object") {
      const item = sig as { description?: string; signal_type?: string; severity?: string; name?: string };
      const label = [
        item.severity ? `[${item.severity.toUpperCase()}]` : null,
        item.signal_type || item.name,
        item.description,
      ].filter(Boolean).join(" · ");
      return `<li class="signal-item">${escapeHtml(label || JSON.stringify(sig))}</li>`;
    }
    return `<li>${escapeHtml(String(sig))}</li>`;
  }).join("");

  root.innerHTML = `
    <main class="main" style="max-width:760px;margin:40px auto;background:var(--panel);border:1px solid ${high ? "var(--crimson)" : "var(--well-edge)"};padding:36px;border-radius:4px;box-shadow:0 12px 48px rgba(0,0,0,0.6);">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <span class="chip ${high ? "danger" : "ok"}">${escapeHtml(scan.risk_level.toUpperCase())} VERDICT</span>
        <span style="font-family:var(--mono);font-size:12px;color:var(--muted);">THREAT SCORE: ${escapeHtml(String(scan.risk_score))} / 100</span>
      </div>

      <h1 style="font-size:26px;font-weight:700;letter-spacing:-0.03em;margin:12px 0 10px;color:${high ? "var(--crimson)" : "var(--ink)"};">
        ${high ? "Warning: High-Risk Campus Threat Detected" : "SignalSafe Security Inspection Result"}
      </h1>

      <p style="color:#c5d6ce;font-size:14px;line-height:1.55;margin:0 0 16px;">
        SignalSafe Campus evaluated this destination using machine learning, VirusTotal intelligence, and heuristic signals.
        <strong>Technical notice:</strong> Scans are user-initiated; the initial network request has already reached the host. Do not submit credentials, download files, or proceed further.
      </p>

      <div class="sample" style="margin:16px 0 20px;">
        <p class="label">FLAGGED DESTINATION</p>
        <p class="url" style="font-size:13px;">${escapeHtml(scan.normalized_url || scan.original_input)}</p>
        <p class="hint">Target Host: ${escapeHtml(scan.domain || "—")} · Scan ID: ${escapeHtml(String(scan.id))} · Timestamp: ${escapeHtml(scan.scanned_at)}</p>
      </div>

      ${heuristicList ? `
        <h2 style="font-size:13px;font-family:var(--mono);color:var(--cyan);text-transform:uppercase;margin:20px 0 8px;">Heuristic Signals & Detections</h2>
        <ul class="list" style="margin-bottom:18px;">${heuristicList}</ul>
      ` : ""}

      <h2 style="font-size:13px;font-family:var(--mono);color:var(--cyan);text-transform:uppercase;margin:20px 0 8px;">Why this destination was flagged</h2>
      <ul class="list" style="margin-bottom:18px;">${reasons || "<li>Heuristic risk thresholds exceeded campus security policy.</li>"}</ul>

      <h2 style="font-size:13px;font-family:var(--mono);color:var(--cyan);text-transform:uppercase;margin:20px 0 8px;">Recommended Defensive Actions</h2>
      <ul class="list" style="margin-bottom:24px;">${(scan.recommendations || []).map((line) => `<li>${escapeHtml(line)}</li>`).join("") || "<li>Close the tab immediately and do not enter personal or campus credentials.</li>"}</ul>

      <div class="row" style="margin-top:24px;gap:12px;">
        <button class="btn btn-primary" id="back" type="button" style="padding:11px 18px;font-size:13.5px;">Return to Safety</button>
        <button class="btn btn-danger" id="report" type="button" style="padding:11px 18px;font-size:13.5px;">Report URL to Incident Response</button>
      </div>
      <p id="note" class="hint" style="margin-top:12px;font-size:12px;"></p>
    </main>
  `;

  document.getElementById("back")?.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.runtime.sendMessage({ type: "SAFE_RETURN", tabId: tab.id });
    }
    window.close();
  });

  document.getElementById("report")?.addEventListener("click", async () => {
    const btn = document.getElementById("report") as HTMLButtonElement | null;
    const note = document.getElementById("note");
    if (btn) btn.disabled = true;
    if (note) note.textContent = "Submitting incident report…";

    const response = await chrome.runtime.sendMessage({
      type: "REPORT_URL",
      scanId: String(scan.id),
      incidentType: "phishing",
    });

    if (note) {
      note.textContent = response.ok
        ? response.state.reportStatus || "Incident report successfully filed with Campus IT Security."
        : response.error || "Unable to submit report.";
    }
  });
}

void (async () => {
  const params = new URLSearchParams(location.search);
  const scanId = params.get("scan");
  const scan = await getLastScan();
  render(scan, scanId);
})();
