import { OverlayPayload } from "../types";

const HOST_ID = "signalsafe-guardian-overlay-host";

export function mountWarningOverlay(payload: OverlayPayload): void {
  const existing = document.getElementById(HOST_ID);
  if (existing) existing.remove();

  const host = document.createElement("div");
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: "closed" });

  const wrap = document.createElement("div");
  wrap.setAttribute("role", "alertdialog");
  wrap.setAttribute("aria-labelledby", "ssg-title");
  wrap.innerHTML = `
    <style>
      :host { all: initial; }
      .veil {
        position: fixed; inset: 0; z-index: 2147483646;
        background: rgba(6, 10, 15, 0.82);
        backdrop-filter: blur(4px);
        display: grid; place-items: start center;
        padding: 32px 16px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      .panel {
        width: min(480px, 100%);
        background: #0d141e;
        color: #e8f4ee;
        border: 1px solid #ff4d61;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65);
        padding: 24px;
        border-radius: 4px;
      }
      .badge {
        display: inline-block;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #ff4d61;
        background: rgba(255, 77, 97, 0.12);
        border: 1px solid #ff4d61;
        padding: 2px 7px;
        border-radius: 2px;
        margin-bottom: 10px;
      }
      h1 { font-size: 19px; margin: 0 0 8px; letter-spacing: -0.02em; color: #ffffff; }
      p { margin: 0 0 12px; font-size: 13px; line-height: 1.5; color: #b8ccd2; }
      ul { margin: 0 0 16px; padding-left: 18px; color: #e8f4ee; font-size: 12.5px; line-height: 1.4; }
      .row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
      button {
        font: inherit; cursor: pointer; border: 0; padding: 9px 14px; font-size: 13px; font-weight: 600;
        border-radius: 2px; transition: all 0.15s ease;
      }
      .primary { background: #3dff9a; color: #08110c; }
      .primary:hover { filter: brightness(1.1); }
      .danger { background: #ff4d61; color: #ffffff; }
      .danger:hover { filter: brightness(1.1); }
      .ghost { background: transparent; color: #8da4b0; border: 1px solid #233448; }
      .ghost:hover { color: #ffffff; border-color: #556c80; }
    </style>
    <div class="veil">
      <div class="panel">
        <span class="badge">${escapeHtml(payload.riskLevel === "malicious" ? "Critical Malicious Threat" : "High-Risk Suspicious URL")}</span>
        <h1 id="ssg-title">SignalSafe Threat Shield</h1>
        <p><strong>${escapeHtml(payload.domain)}</strong> was classified as dangerous by the SignalSafe Campus inspection pipeline. This user-triggered warning cannot undo initial network requests already made to this server.</p>
        <ul>${payload.explanation.map((line) => `<li>${escapeHtml(line)}</li>`).join("") || "<li>Flagged by campus heuristic threat rules.</li>"}</ul>
        <div class="row">
          <button class="danger" type="button" id="ssg-return">Return to Safety</button>
          <button class="primary" type="button" id="ssg-open">Full Warning Report</button>
          <button class="ghost" type="button" id="ssg-dismiss">Dismiss</button>
        </div>
      </div>
    </div>
  `;

  shadow.append(wrap);
  document.documentElement.append(host);

  shadow.getElementById("ssg-dismiss")?.addEventListener("click", () => host.remove());
  shadow.getElementById("ssg-open")?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "OPEN_WARNING", scanId: payload.scanId });
  });
  shadow.getElementById("ssg-return")?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "SAFE_RETURN", tabId: -1 });
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
