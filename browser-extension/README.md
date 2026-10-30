# SignalSafe Guardian — Browser Security Extension

Manifest V3 extension for Google Chrome and Microsoft Edge. SignalSafe Guardian is an automated, real-time website threat detection client designed for the SignalSafe Campus security platform.

It communicates with the deployed FastAPI backend at `https://signalsafe.onrender.com` (or a custom local/self-hosted instance) without requiring local backend setup or storing API keys or user credentials in the extension bundle.

---

## What It Does

1. **Automatic Navigation Detection**: Listens to top-level page navigations via `chrome.webNavigation.onCompleted` (`frameId === 0`).
2. **Real-Time Threat Analysis**: Automatically submits completed HTTP/HTTPS URLs to the FastAPI backend (`POST /api/v1/scans/url`) using stored JWT authentication.
3. **Immediate Threat Interstitial**:
   - **Malicious**: Immediately redirects the affected tab to the SignalSafe warning page (`src/pages/warning.html`) with red danger alert, threat score, explanations, safe return action, and incident reporting.
   - **Suspicious**: Mounts a prominent caution banner and shadow-DOM overlay with "Return to Safety", "Continue Anyway", and "Report to Campus Security".
   - **Safe**: Allows browsing without interruption, updating the toolbar popup badge with green clean telemetry.
   - **Inconclusive / Offline**: Displays transparent verification status without falsely certifying safety.
4. **Repeat-Visit Protection**: Automatically registers Manifest V3 `declarativeNetRequest` dynamic rules for previously confirmed malicious domains, redirecting repeat visits directly to the warning screen.
5. **Configurable Protection Toggle**: Enables one-click toggling between **Protection ON** (real-time automated scanning) and **Protection OFF** (manual scan only).

---

## Installation (Unpacked)

### Step 1: Build the Extension
```bash
cd browser-extension
npm install
npm test
npm run typecheck
npm run build
```
The production bundle is generated in `browser-extension/dist`.

### Step 2: Load in Chrome
1. Open Chrome and navigate to `chrome://extensions`.
2. Turn on **Developer mode** (toggle in upper right).
3. Click **Load unpacked** (upper left button).
4. Select the folder: `browser-extension/dist`.

### Step 3: Load in Microsoft Edge
1. Open Edge and navigate to `edge://extensions`.
2. Turn on **Developer mode** (left sidebar).
3. Click **Load unpacked**.
4. Select the folder: `browser-extension/dist`.

---

## Backend Configuration

### Production Deployed Server (Default)
The extension defaults to the deployed production backend:
```
https://signalsafe.onrender.com
```

### Local Development Server (Optional)
If running the backend locally:
```
http://127.0.0.1:8000
```
Open the Guardian popup, click the ⚙ icon in the footer, update the **Backend Base URL**, and save.

---

## Architecture & Automated Scanning Workflow

```
[User Navigates in Tab] 
       │
       ▼
[chrome.webNavigation.onCompleted] (frameId === 0)
       │
       ├── Check: Automatic Protection Enabled? ──(No)──► [Exit]
       ├── Check: User Authenticated? ────────────(No)──► [Exit]
       ├── Check: Eligible HTTP/HTTPS URL? ───────(No)──► [Exit (chrome://, extension://, etc.)]
       ├── Check: In Bypassed URLs List? ─────────(Yes)─► [Exit (user clicked Continue Anyway)]
       └── Check: Duplicate In-Flight Scan? ──────(Yes)─► [Exit (already scanning)]
       │
       ▼
[Check Local Scan Cache (TTL 10m)] ──(Hit)──► [Use Cached Verdict]
       │ (Miss)
       ▼
[POST /api/v1/scans/url] (with Bearer Token & 28s timeout)
       │
       ▼
[Race Condition Check: Did tab navigate elsewhere?] ──(Yes)──► [Discard Stale Result]
       │ (No, tab still on target URL)
       ▼
   Verdict:
   ├── MALICIOUS ──► [Replace Tab with warning.html] & [Add DNR Dynamic Rule]
   ├── SUSPICIOUS ─► [Mount Shadow-DOM Caution Overlay] & [Offer Continue Anyway]
   ├── SAFE ───────► [No Interruption, update Tab State to SAFE]
   └── OFFLINE ────► [Record Unverified Status, Never Certify as Safe]
```

---

## Permissions Explained

| Permission | Purpose |
|---|---|
| `webNavigation` | Detects completed top-level frame navigations on HTTP/HTTPS websites (`frameId === 0`). |
| `storage` | Persists session tokens, backend URL, protection toggle setting, tab scan cache, and bypass list in `chrome.storage.local`. |
| `tabs` | Reads active tab URL, redirects flagged malicious tabs to warning page, and executes safe return. |
| `scripting` | Mounts shadow-DOM caution overlay for suspicious websites without exposing tokens to page DOM. |
| `activeTab` | Grants temporary execution permission on the user-active tab. |
| `declarativeNetRequest` | Enforces instant redirect rules on subsequent or repeated visits to previously confirmed malicious destinations. |
| Host: `https://signalsafe.onrender.com/*` | Pre-approved origin permission for the production campus backend. |
| Host: `http://127.0.0.1:8000/*`, `http://localhost:8000/*` | Pre-approved origin permissions for local backend debugging. |

---

## Security Model

- **Zero Credential Exposure**: Tokens (`access_token`, `refresh_token`) reside strictly in trusted extension background storage (`chrome.storage.local`). Content scripts and page DOMs never receive or access JWT tokens.
- **No Content Harvesting**: The extension never reads form fields, passwords, cookies, or page DOM contents.
- **Closed Shadow-DOM**: Threat overlays use `mode: "closed"` to prevent host pages from tampering with security alerts.
- **HTML Sanitization**: All backend responses and URLs are escaped before rendering.
- **No First-Request False Claims**: Manifest V3 cannot pause the initial TCP connection before an async API scan completes. The extension honestly redirects as soon as the verdict arrives, and registers DNR rules for repeat-visit protection.

---

## Testing & Quality Assurance

To execute the automated test suite:
```bash
npm test
```
To run TypeScript strict type checking:
```bash
npm run typecheck
```
To build production artifacts:
```bash
npm run build
```

Unit tests cover:
- Automatic navigation scanning triggers & eligibility
- Duplicate scan prevention for concurrent in-flight requests
- Multi-tab isolation and per-tab scan storage
- Fast navigation race conditions & stale response discarding
- Scan cache TTL expiry and LRU bounds
- URL scheme sanitization & self-URL filtering
- Bypassed URL tracking for "Continue Anyway"
- Incident reporting payloads
- Authentication inputs & API error status parsing
