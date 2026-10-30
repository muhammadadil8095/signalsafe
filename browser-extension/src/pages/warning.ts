import "@fontsource/red-hat-text/400.css";
import "@fontsource/red-hat-text/700.css";
import "@fontsource/red-hat-mono/400.css";
import "../popup/popup.css";
import { ScanResponse } from "../types";
import { getLastScan } from "../storage/storage";
import { isMalicious, isSuspicious } from "../utils/url";

const root = document.getElementById("root");

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function render(scan: ScanResponse | null, requestedId: string | null, targetUrl: string | null, riskParam: string | null) {
  if (!root) return;
  document.body.style.width = "100%";
  document.documentElement.style.width = "100%";
  document.body.style.minHeight = "100vh";

  const effectiveRisk = (riskParam || scan?.risk_level || "malicious").toLowerCase();
  const malicious = isMalicious(effectiveRisk);
  const suspicious = isSuspicious(effectiveRisk);

  if (!scan && !targetUrl) {
    root.innerHTML = `
      <main class="main" style="max-width:680px;margin:60px auto;background:var(--paper-card);border:1px solid var(--border);padding:32px;border-radius:2px;">
        <h1 style="color:var(--forest);font-family:var(--font-heading);font-size:20px;letter-spacing:-0.02em;margin:0 0 12px;">No Active Threat Record</h1>
        <p style="color:var(--forest-muted);font-family:var(--font-sans);line-height:1.6;">This warning page displays security verdicts returned by the SignalSafe Campus analysis engine. No scan record was found.</p>
        <button class="btn btn-ghost" style="margin-top:16px;" onclick="window.close()">Close Page</button>
      </main>`;
    return;
  }

  const displayUrl = targetUrl || scan?.normalized_url || scan?.original_input || "Unknown destination";
  let displayDomain = scan?.domain;
  if (!displayDomain) {
    try {
      displayDomain = new URL(displayUrl).hostname;
    } catch {
      displayDomain = "Unknown host";
    }
  }

  const score = scan?.risk_score ?? (malicious ? 95 : 65);
  const reasons = (scan?.explanation?.length ? scan.explanation : [
    malicious
      ? "High-confidence indicators of malicious infrastructure or credential-phishing activity."
      : "Suspicious heuristic signals detected in URL pattern or domain reputation."
  ]).map((line) => `<li>${escapeHtml(line)}</li>`).join("");

  const heuristicList = [
    ...(scan?.threat_signals || []),
    ...(scan?.signals || []),
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

  const titleText = malicious
    ? "DANGER: MALICIOUS THREAT DETECTED"
    : "CAUTION: SUSPICIOUS WEBSITE";

  const bannerColor = malicious ? "var(--coral-text)" : "var(--gold-text)";
  const chipClass = malicious ? "danger" : "warn";

  root.innerHTML = `
    <main class="main" style="max-width:760px;margin:40px auto;background:var(--paper-card);border:1px solid var(--border);padding:32px;border-radius:2px;">
      
      <!-- Top Alert Badge -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <span class="chip ${chipClass}">
          ${escapeHtml(effectiveRisk.toUpperCase())} THREAT VERDICT
        </span>
        <span style="font-family:var(--font-mono);font-size:11px;color:var(--forest-muted);">
          THREAT SCORE: <strong style="color:${bannerColor};">${escapeHtml(String(score))}</strong> / 100
        </span>
      </div>

      <!-- Main Headline -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="width:36px;height:36px;border:1px solid var(--border);background:var(--paper-panel);border-radius:2px;display:flex;align-items:center;justify-content:center;color:${bannerColor};">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
        </div>
        <h1 style="font-family:var(--font-heading);font-size:22px;font-weight:700;letter-spacing:-0.03em;margin:0;color:${bannerColor};">
          ${titleText}
        </h1>
      </div>

      <!-- Simple Language Explanation -->
      <p style="color:var(--forest);font-family:var(--font-sans);font-size:14px;line-height:1.55;margin:12px 0 16px;font-weight:500;">
        SignalSafe Guardian detected high-confidence risk signals associated with this URL.
        ${malicious 
          ? " This destination exhibits characteristics of credential phishing, brand spoofing, or hostile command-and-control infrastructure designed to compromise student credentials."
          : " Some lexical and heuristic security indicators suggest this destination may be unverified. Exercise extreme caution."
        }
      </p>

      <!-- Destination Summary Box -->
      <div class="sample" style="margin:16px 0 20px;border-left:3px solid ${bannerColor};">
        <p class="label">FLAGGED DESTINATION</p>
        <p class="url" style="font-size:13px;color:var(--forest);">${escapeHtml(displayUrl)}</p>
        <p class="hint">Target Host: <strong>${escapeHtml(displayDomain)}</strong> · Scan Timestamp: ${escapeHtml(scan?.scanned_at || new Date().toISOString())}</p>
      </div>

      <!-- Recommended Protective Actions -->
      <div style="background:var(--paper-panel);border:1px solid var(--border);padding:16px 18px;border-radius:2px;margin-bottom:20px;">
        <h2 style="font-size:11px;font-family:var(--font-mono);font-weight:700;color:var(--forest);text-transform:uppercase;margin:0 0 8px;letter-spacing:0.06em;">
          Immediate Institutional Recommendations
        </h2>
        <ul style="margin:0;padding-left:18px;color:var(--forest);font-size:12.5px;line-height:1.6;font-family:var(--font-sans);">
          <li><strong>Do not enter passwords</strong> or university NetID credentials.</li>
          <li><strong>Do not share student records</strong> or financial payment info.</li>
          <li><strong>Do not download attachments</strong> or install certificates from this host.</li>
          <li>Return to safety immediately.</li>
        </ul>
      </div>

      <!-- Primary Action Buttons -->
      <div class="row" style="margin-top:20px;gap:12px;flex-wrap:wrap;">
        <button class="btn btn-primary" id="btn-back" type="button" style="padding:12px 22px;font-size:14px;">
          RETURN TO SAFETY
        </button>
        ${suspicious ? `
          <button class="btn btn-ghost" id="btn-continue" type="button" style="padding:12px 18px;font-size:13px;border-color:var(--amber);color:var(--amber);">
            Continue Anyway
          </button>
        ` : ""}
        <button class="btn btn-danger" id="btn-report" type="button" style="padding:12px 18px;font-size:13px;">
          REPORT TO CAMPUS SECURITY
        </button>
        <button class="btn btn-ghost" id="btn-toggle-tech" type="button" style="padding:12px 18px;font-size:13px;">
          VIEW TECHNICAL DETAILS ▼
        </button>
      </div>
      <p id="report-feedback" class="hint" style="margin-top:10px;font-size:12px;min-height:1.2em;"></p>

      <!-- Expandable Technical Details Section -->
      <div id="tech-details" style="display:none;margin-top:24px;border-top:1px solid var(--well-edge);padding-top:18px;">
        <h3 style="font-size:13px;font-family:var(--mono);color:var(--cyan);text-transform:uppercase;margin:0 0 12px;">
          Technical Scan Diagnostics
        </h3>

        <div class="lanes" style="margin-bottom:16px;">
          <article class="lane">
            <h2>AI SECURITY ANALYSIS</h2>
            <p>${scan?.ml_available ? (scan.ml_prediction || "Active") : "Unavailable"}</p>
            ${scan?.ml_available && scan.ml_confidence != null ? `<p class="num">Confidence: ${(scan.ml_confidence * 100).toFixed(0)}%</p>` : ""}
          </article>
          <article class="lane">
            <h2>THREAT INTELLIGENCE</h2>
            <p>${scan?.vt_available ? "Active" : "Unavailable"}</p>
            ${scan?.vt_available ? `<p class="num">${scan.vt_malicious ?? 0}M / ${scan.vt_suspicious ?? 0}S / ${scan.vt_undetected ?? 0}U</p>` : ""}
          </article>
          <article class="lane">
            <h2>SUSPICIOUS INDICATORS</h2>
            <p>${(scan?.threat_signals?.length || scan?.signals?.length || 0)} Signals</p>
            <p class="num">Score ${score}/100</p>
          </article>
        </div>

        <h4 style="font-size:12px;font-family:var(--mono);color:var(--muted);text-transform:uppercase;margin:12px 0 6px;">Detection Explanations:</h4>
        <ul class="list" style="margin-bottom:14px;">${reasons}</ul>

        ${heuristicList ? `
          <h4 style="font-size:12px;font-family:var(--mono);color:var(--muted);text-transform:uppercase;margin:12px 0 6px;">Relevant Heuristic Signals:</h4>
          <ul class="list" style="margin-bottom:14px;">${heuristicList}</ul>
        ` : ""}

        <p class="hint" style="font-size:11px;color:var(--dim);">
          Scan ID: ${escapeHtml(String(scan?.id || "N/A"))} · Technical Note: Chrome Manifest V3 extensions execute security verification as soon as navigation completes.
        </p>
      </div>

    </main>
  `;

  // Return to Safety
  document.getElementById("btn-back")?.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ type: "SAFE_RETURN" });
    window.close();
  });

  // Continue Anyway (for suspicious)
  document.getElementById("btn-continue")?.addEventListener("click", async () => {
    if (displayUrl && displayUrl !== "Unknown destination") {
      await chrome.runtime.sendMessage({ type: "CONTINUE_ANYWAY", url: displayUrl });
      window.location.href = displayUrl;
    }
  });

  // Report to Campus Security
  document.getElementById("btn-report")?.addEventListener("click", async () => {
    const btn = document.getElementById("btn-report") as HTMLButtonElement | null;
    const note = document.getElementById("report-feedback");
    if (btn) btn.disabled = true;
    if (note) note.textContent = "Submitting incident report to Campus Security Incident Response Team...";

    const scanId = scan?.id ? String(scan.id) : (requestedId || "unknown");
    const response = await chrome.runtime.sendMessage({
      type: "REPORT_URL",
      scanId,
      incidentType: malicious ? "malicious_url" : "suspicious_url",
    });

    if (note) {
      note.textContent = response.ok
        ? (response.state.reportStatus || "Incident report successfully filed with Campus IT Security.")
        : (response.error || "Unable to submit report.");
    }
  });

  // View Technical Details Accordion Toggle
  const techToggle = document.getElementById("btn-toggle-tech");
  const techDetails = document.getElementById("tech-details");
  techToggle?.addEventListener("click", () => {
    if (!techDetails) return;
    const isHidden = techDetails.style.display === "none";
    techDetails.style.display = isHidden ? "block" : "none";
    techToggle.textContent = isHidden ? "HIDE TECHNICAL DETAILS ▲" : "VIEW TECHNICAL DETAILS ▼";
  });
}

void (async () => {
  const params = new URLSearchParams(location.search);
  const scanId = params.get("scan");
  const urlParam = params.get("url");
  const riskParam = params.get("risk");
  const scan = await getLastScan();
  render(scan, scanId, urlParam, riskParam);
})();
