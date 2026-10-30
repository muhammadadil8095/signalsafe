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
        background: rgba(8, 12, 16, 0.72);
        display: grid; place-items: start center;
        padding: 24px 16px;
        font-family: "Red Hat Text", "Segoe UI", sans-serif;
      }
      .panel {
        width: min(440px, 100%);
        background: #0c1218;
        color: #e8f4ee;
        border: 1px solid #3a2430;
        box-shadow: 0 18px 40px rgba(0,0,0,0.45);
        padding: 20px 20px 16px;
      }
      h1 { font-size: 18px; margin: 0 0 8px; letter-spacing: -0.02em; color: #ff6b7a; }
      p { margin: 0 0 10px; font-size: 13px; line-height: 1.45; color: #c5d4cc; }
      ul { margin: 0 0 14px; padding-left: 18px; color: #e8f4ee; font-size: 12px; }
      .row { display: flex; gap: 8px; }
      button {
        font: inherit; cursor: pointer; border: 0; padding: 9px 12px; font-size: 13px;
      }
      .primary { background: #3dff9a; color: #08110c; font-weight: 700; }
      .ghost { background: transparent; color: #9eb0a8; text-decoration: underline; }
    </style>
    <div class="veil">
      <div class="panel">
        <h1 id="ssg-title">${escapeHtml(payload.riskLevel === "malicious" ? "Malicious URL" : "High-risk URL")}</h1>
        <p>${escapeHtml(payload.domain)} was flagged by SignalSafe Campus after a user-triggered scan. This overlay does not unwind the first request already made to the site.</p>
        <ul>${payload.explanation.map((line) => `<li>${escapeHtml(line)}</li>`).join("") || "<li>See the Guardian warning page for the full scan.</li>"}</ul>
        <div class="row">
          <button class="primary" type="button" id="ssg-open">Open warning details</button>
          <button class="ghost" type="button" id="ssg-dismiss">Dismiss overlay</button>
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
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
