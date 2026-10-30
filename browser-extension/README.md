# SignalSafe Browser Guardian

Manifest V3 extension for Chrome and Microsoft Edge. It is a trusted client of the existing SignalSafe Campus FastAPI backend. It does **not** run VirusTotal or the ML model locally, and it does **not** block the first network request to a website.

## What it does

1. Sign in with a SignalSafe Campus account (`POST /api/v1/auth/login`).
2. Read the current tab URL after you click the toolbar icon.
3. Send that URL to `POST /api/v1/scans/url` with `Authorization: Bearer <access_token>`.
4. Display the backend `ScanResponse` fields as returned.
5. If the result is `suspicious` or `malicious`, open an extension warning page and optionally overlay the tab.

It never auto-navigates to a URL you submitted for scanning.

## Install (unpacked)

Build first (see below), then load `browser-extension/dist`.

### Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select `browser-extension/dist`.

### Microsoft Edge

1. Open `edge://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select `browser-extension/dist`.

After code changes, run `npm run build` again and click **Reload** on the extension card.

## Development

```bash
cd browser-extension
npm install
python scripts/make-icons.py
npm test
npm run build
```

`npm run dev` starts the CRX/Vite watch build. Reload the unpacked extension after it rebuilds.

## Backend configuration

Default base URL: `http://127.0.0.1:8000` (API prefix `/api/v1` is appended by the extension).

1. Start SignalSafe Campus (typically `docker compose up` or the FastAPI app on port 8000).
2. Open the popup.
3. Set **Backend base URL** to your API origin (no trailing `/api`).
4. Sign in with a real campus account. Demo passwords are not bundled in the extension.

If you point at a non-localhost origin, Chrome will prompt for extra host permission for that origin only.

### Endpoints used

| Action | Method | Path |
|---|---|---|
| Login | POST | `/api/v1/auth/login` |
| Refresh | POST | `/api/v1/auth/refresh` |
| Session check | GET | `/api/v1/auth/me` |
| URL scan | POST | `/api/v1/scans/url` body `{ "url": "https://..." }` |
| Report URL | POST | `/api/v1/reports/` |

Scan display fields come from `ScanResponse` in `backend/app/schemas/scan.py`: `original_input`, `normalized_url`, `domain`, `risk_level`, `risk_score`, `ml_available`, `ml_prediction`, `ml_confidence`, `vt_available`, `vt_malicious`, `vt_suspicious`, `vt_undetected`, `signals`, `explanation`, `recommendations`, `scanned_at`.

## Authentication

- Tokens are stored in `chrome.storage.local` and used only by the service worker, popup, and extension warning page.
- Content scripts never receive JWTs and never read token keys.
- On HTTP 401 the extension tries `POST /api/v1/auth/refresh`. Failure shows the **authentication expired** state.
- Sign out clears tokens and the last scan.

## Permissions

| Permission | Why |
|---|---|
| `storage` | Backend URL, session tokens, last scan (trusted contexts only). |
| `activeTab` | Current tab URL and optional overlay injection after you click the action. |
| `tabs` | Open the warning page; safe-return (`tabs.goBack` / New Tab). Does not grant reading every site’s content. |
| `scripting` | Inject the warning overlay into the scanned tab after a high-risk result. |
| Host: `http://127.0.0.1:8000/*`, `http://localhost:8000/*` | Default local FastAPI origin. |
| Optional host permissions | Requested only when you set a different backend origin. |

The extension does **not** use `webRequest` blocking or Manifest V2 APIs.

## Security model

- No secrets, VirusTotal keys, or demo credentials in the bundle.
- No collection of page passwords, form fields, or arbitrary DOM content.
- Overlay payload is a sanitized subset: risk level, domain, URL, explanations, scan id.
- Input validation rejects `chrome:`, `edge:`, `file:`, and non-http(s) URLs.
- API calls use a timeout (28s) and typed error states (`backend unavailable`, `authentication expired`).
- The warning page reads the stored `ScanResponse`; it does not fetch the submitted site.

## Current limitations

- **User-triggered only.** Opening a site still loads it. Clicking Scan runs after the fact.
- Asynchronous VirusTotal / ML work on the server cannot intercept the first HTTP request.
- Overlay injection can fail on some Chrome-restricted pages; the extension warning page is the guaranteed surface.
- `activeTab` access is tied to invoking the extension. Reload the popup on the tab you intend to scan.
- Access tokens follow the backend TTL (default 30 minutes) with refresh-token renewal.

## Future proactive blocking (roadmap)

If you add blocking later, use Manifest V3 `declarativeNetRequest` **dynamic rules** for URLs already classified malicious by SignalSafe:

1. After a malicious `ScanResponse`, add a `block` or `redirect` rule for that exact URL or hostname.
2. Persist a small allow/block list in `chrome.storage.local`.
3. Redirect matches to the extension warning page — still after at least one prior classification.

Limitations to keep in the product copy:

- Rules cannot classify a brand-new URL before the first visit.
- `declarativeNetRequest` cannot wait on an async API call during the request.
- Broad `<all_urls>` blocking is easy to get wrong and is not enabled in this release.

## Tests

```bash
npm test
```

Unit tests cover URL allow/deny rules and high-risk mapping. Manual checks: login, logout, expired token, current-tab URL, safe scan, malicious/suspicious scan, API stopped, warning page, no auto-navigation to the submitted URL.
