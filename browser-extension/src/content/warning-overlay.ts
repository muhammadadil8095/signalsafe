import { OverlayPayload } from "../types";

const HOST_ID = "signalsafe-guardian-overlay-host";

export function mountWarningOverlay(payload: OverlayPayload): void {
  const existing = document.getElementById(HOST_ID);
  if (existing) existing.remove();

  const host = document.createElement("div");
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: "closed" });

  const isSuspicious = payload.riskLevel.toLowerCase() === "suspicious";

  const wrap = document.createElement("div");
  wrap.setAttribute("role", "alertdialog");
  wrap.setAttribute("aria-labelledby", "ssg-title");
  wrap.innerHTML = `
    <style>
      :host { all: initial; }
      .veil {
        position: fixed; inset: 0; z-index: 2147483646;
        background: rgba(13, 31, 23, 0.75);
        backdrop-filter: blur(4px);
        display: grid; place-items: start center;
        padding: 40px 16px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .panel {
        width: min(540px, 100%);
        background: #E8E9E5;
        color: #0D1F17;
        border: 1px solid ${isSuspicious ? "#78350F" : "#7F1D1D"};
        box-shadow: none !important;
        padding: 24px 26px;
        border-radius: 2px;
      }
      @media (prefers-color-scheme: dark) {
        .panel {
          background: #121C16;
          color: #E8ECE9;
        }
      }
      .badge {
        display: inline-block;
        font-family: 'JetBrains Mono', Menlo, monospace;
        font-size: 9.5px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: ${isSuspicious ? "#78350F" : "#7F1D1D"};
        background: ${isSuspicious ? "#FDE68A" : "#FECACA"};
        border: 1px solid ${isSuspicious ? "#78350F" : "#7F1D1D"};
        padding: 2.5px 8px;
        border-radius: 2px;
        margin-bottom: 12px;
      }
      h1 {
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        font-size: 20px;
        font-weight: 700;
        margin: 0 0 10px;
        letter-spacing: -0.03em;
        color: ${isSuspicious ? "#78350F" : "#7F1D1D"};
      }
      p {
        margin: 0 0 12px;
        font-size: 13px;
        line-height: 1.5;
        color: inherit;
      }
      .domain-chip {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        color: ${isSuspicious ? "#78350F" : "#7F1D1D"};
        background: rgba(0,0,0,0.06);
        padding: 2px 6px;
        border-radius: 2px;
        border: 1px solid rgba(0,0,0,0.15);
      }
      ul {
        margin: 0 0 16px;
        padding-left: 20px;
        font-size: 12.5px;
        line-height: 1.45;
      }
      li { margin-bottom: 4px; }
      .actions-grid {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 18px;
      }
      button {
        font-family: 'Space Grotesk', sans-serif;
        cursor: pointer;
        border: 1px solid #1A231E;
        padding: 8px 14px;
        font-size: 11.5px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        border-radius: 2px;
        transition: all 0.15s ease;
      }
      .btn-safe {
        background: #0D1F17;
        color: #E8E9E5;
        border-color: #0D1F17;
      }
      .btn-safe:hover {
        background: #1B4530;
      }
      .btn-continue {
        background: #FFFFFF;
        color: #0D1F17;
        border-color: #1A231E;
      }
      .btn-continue:hover {
        background: #E8E9E5;
      }
      .btn-report {
        background: #E15A3E;
        color: #FFFFFF;
        border-color: #7F1D1D;
      }
      .btn-report:hover {
        filter: brightness(1.1);
      }
      .btn-details {
        background: transparent;
        color: inherit;
        border-color: #1A231E;
      }
      .btn-details:hover {
        background: rgba(0,0,0,0.05);
      }
      .note {
        margin-top: 10px;
        font-size: 11px;
        font-family: 'JetBrains Mono', monospace;
        color: #5A6B60;
      }
    </style>
    <div class="veil">
      <div class="panel">
        <span class="badge">${escapeHtml(isSuspicious ? "Caution! Suspicious Website" : "Danger! Malicious Website")}</span>
        <h1 id="ssg-title">${escapeHtml(isSuspicious ? "Caution: Potential Security Risk" : "Malicious Website Flagged")}</h1>
        <p>
          SignalSafe Guardian evaluated <span class="domain-chip">${escapeHtml(payload.domain)}</span>.
          ${isSuspicious 
            ? "Some security indicators suggest that this website may be unsafe. We recommend avoiding sensitive activities on this website."
            : "Serious threat indicators were detected. We recommend returning to safety immediately."
          }
        </p>

        ${payload.explanation && payload.explanation.length > 0 ? `
          <p style="font-weight:600;font-size:12px;color:#a2b7c4;margin-bottom:6px;">Detected Reasons:</p>
          <ul>${payload.explanation.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
        ` : ""}

        <div class="actions-grid">
          <button class="btn-safe" type="button" id="ssg-safe-return">Return to Safety</button>
          ${isSuspicious ? `<button class="btn-continue" type="button" id="ssg-continue">Continue Anyway</button>` : ""}
          <button class="btn-report" type="button" id="ssg-report">Report to Campus Security</button>
          <button class="btn-details" type="button" id="ssg-open-details">Full Report</button>
        </div>
        <p id="ssg-feedback" class="note"></p>
      </div>
    </div>
  `;

  shadow.append(wrap);
  document.documentElement.append(host);

  shadow.getElementById("ssg-safe-return")?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "SAFE_RETURN" });
  });

  shadow.getElementById("ssg-continue")?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "CONTINUE_ANYWAY", url: payload.url });
    host.remove();
  });

  shadow.getElementById("ssg-report")?.addEventListener("click", async () => {
    const feedback = shadow.getElementById("ssg-feedback");
    if (feedback) feedback.textContent = "Filing incident report with Campus Security...";
    const res = await chrome.runtime.sendMessage({
      type: "REPORT_URL",
      scanId: payload.scanId,
      incidentType: "suspicious_website",
    });
    if (feedback) {
      feedback.textContent = res.ok
        ? "Report filed successfully. Thank you for protecting the campus."
        : (res.error || "Failed to submit report.");
    }
  });

  shadow.getElementById("ssg-open-details")?.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: "OPEN_WARNING",
      scanId: payload.scanId,
      riskLevel: payload.riskLevel,
      url: payload.url,
    });
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
