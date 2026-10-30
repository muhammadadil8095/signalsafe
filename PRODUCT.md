# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Chrome/Edge Manifest V3 extension, TypeScript, React, Vite (user specified stack in the master prompt).

## Users

Campus students and faculty who already hold SignalSafe Campus accounts. They open a website in Chrome or Edge, click the extension, and need a trustworthy classification of that tab’s URL before they continue interacting with it.

## Product Purpose

SignalSafe Browser Guardian is the browser-side client of SignalSafe Campus. It authenticates against the existing FastAPI API, sends the current tab URL to `POST /api/v1/scans/url`, and displays the backend’s real scan result (risk level, score, ML, VirusTotal, heuristics, recommendations). Success is a correct, attributable classification with a clear warning path for high-risk results—not fabricated scores and not first-request network blocking.

## Positioning

The extension does not run its own VirusTotal key or ML model. It is a trusted campus client of the existing JWT-authenticated scan pipeline, so every result is the same institutional verdict the web app would return.

## Operating Context

- Users already have a campus account (`POST /api/v1/auth/login`).
- They configure the SignalSafe backend base URL in the popup.
- Typical flow: open a site → click the toolbar icon → review the tab URL → Scan Current Website → read classification.
- High-risk results open an extension warning page (interstitial after scan). Safe return goes backward or to a new tab; the extension never auto-navigates to a URL the user submitted for scanning.
- Reporting a flagged URL uses the existing incident API `POST /api/v1/reports/`.

## Capabilities and Constraints

- Manifest V3 only. No Manifest V2 APIs. No unrestricted `webRequest` interception.
- JWT access and refresh tokens live in `chrome.storage.local`, readable only by extension pages and the service worker. Content scripts never receive tokens.
- No credentials, VirusTotal keys, or demo passwords in source.
- User-triggered current-tab scan for the initial release. Asynchronous VirusTotal/API analysis cannot block the first network request to a site.
- Optional later: `declarativeNetRequest` dynamic rules for previously identified malicious URLs, with documented limitations.
- Do not rewrite the existing React frontend or FastAPI backend unless an essential integration gap is found; smallest compatible change only, after reporting.
- Display only fields from the real `ScanResponse` schema. Do not invent results.
- Minimum permissions: `storage`, `activeTab`, `tabs`, `scripting`, plus host permission for the configured backend origin.

## Brand Commitments

- Product name: SIGNALSAFE BROWSER GUARDIAN, part of SignalSafe Campus.
- Binding visual constraints from the brief: deep charcoal/navy, electric green or cyan accents, clean typography, compact technical status indicators, clear risk visualization, professional warning states, compact popup.
- Popup states: not authenticated, authenticated, idle, scanning, safe, suspicious, malicious, backend unavailable, authentication expired.
- Tagline in the platform: “Your digital safety, one signal ahead.”

## Evidence on Hand

- Backend schemas: `backend/app/schemas/scan.py` (`ScanResponse`), `backend/app/schemas/user.py` (login/token), `backend/app/schemas/incident.py` (`IncidentCreate`).
- Endpoints: `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `GET /api/v1/auth/me`, `POST /api/v1/scans/url`, `POST /api/v1/reports/`.
- No fabricated scan results, customer logos, or third-party endorsements.

## Product Principles

- Institutional truth over local heuristics: show what the campus API returned.
- Least privilege: tokens stay in trusted extension contexts; pages never see them.
- Honest capability: user-triggered scan and post-scan warning, never claimed first-hit blocking.
- Calm, high-signal security UI: risk is readable in one glance; warnings are serious without panic theater.
- Fail closed on auth, fail clearly on network: expired tokens and unavailable backend are first-class states.

## Accessibility & Inclusion

Keyboard-operable popup and warning page, visible focus, sufficient contrast on charcoal grounds, text (not color alone) for risk level, and no motion that obscures scan status.
