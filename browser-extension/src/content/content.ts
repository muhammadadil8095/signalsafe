import { OverlayPayload } from "../types";
import { mountWarningOverlay } from "./warning-overlay";

chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.id !== chrome.runtime.id) return;
  if (message?.type === "SHOW_OVERLAY" && message.payload) {
    const payload = message.payload as OverlayPayload;
    if (!payload.scanId || !payload.riskLevel) return;
    mountWarningOverlay(payload);
  }
});
