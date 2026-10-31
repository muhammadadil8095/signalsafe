# SIGNALSAFE CAMPUS — IN-DEPTH SYSTEM ARCHITECTURE & TECHNICAL REPORT
> *"Your digital safety. One signal ahead."*

---

## TABLE OF CONTENTS
1. [Executive Summary & System Identity](#1-executive-summary--system-identity)
2. [Campus Cyber Threat Landscape & Problem Statement](#2-campus-cyber-threat-landscape--problem-statement)
3. [End-to-End System Topology & Architecture](#3-end-to-end-system-topology--architecture)
4. [Threat Detection & Inspection Engine](#4-threat-detection--inspection-engine)
   - 4.1 Lexical & Structural Heuristic Analyzer (17 Indicators)
   - 4.2 Machine Learning Inference Subsystem (27-Feature Vector)
   - 4.3 Threat Intelligence Aggregator (VirusTotal v3 Integration)
   - 4.4 Risk Fusion Engine & Mathematical Scoring Model
5. [Specialized Scanning Modules](#5-specialized-scanning-modules)
   - 5.1 QR Code Threat Scanner (Anti-Quishing Engine)
   - 5.2 Social Engineering & Message Analyzer
   - 5.3 Static Attachment Analysis Sandbox (PDF & HTML Non-Execution)
6. [SignalSafe Browser Guardian (Manifest V3 Extension)](#6-signalsafe-browser-guardian-manifest-v3-extension)
   - 6.1 Architectural Overview & MV3 Compliance
   - 6.2 Automatic Navigation Interception (`webNavigation.onCompleted`)
   - 6.3 Concurrency Control, Race Condition Prevention & Scan Deduplication
   - 6.4 In-Memory & Local Storage TTL/LRU Cache Subsystem
   - 6.5 Real-Time Threat Interstitial & Warning Surfaces
   - 6.6 DeclarativeNetRequest Dynamic Rules for Repeat-Visit Defense
   - 6.7 Student-Centric Security Dashboard & State Machine
7. [Incident Management & Security Operations Center (SOC) Workflows](#7-incident-management--security-operations-center-soc-workflows)
8. [Role-Based Access Control (RBAC) & Security Governance](#8-role-based-access-control-rbac--security-governance)
9. [Database Architecture & Entity-Relationship Specifications](#9-database-architecture--entity-relationship-specifications)
10. [Frontend Application Architecture & PWA Subsystem](#10-frontend-application-architecture--pwa-subsystem)
11. [Exhaustive REST API Reference](#11-exhaustive-rest-api-reference)
12. [DevOps, Cloud Deployment & Container Orchestration](#12-devops-cloud-deployment--container-orchestration)
13. [Verification, Testing & Quality Assurance](#13-verification-testing--quality-assurance)
14. [Security Guarantees, Privacy Boundaries & Limitations](#14-security-guarantees-privacy-boundaries--limitations)
15. [Operator Runbook, Troubleshooting & Maintenance](#15-operator-runbook-troubleshooting--maintenance)
16. [Future Technical Roadmap](#16-future-technical-roadmap)

---

# 1. EXECUTIVE SUMMARY & SYSTEM IDENTITY

**SignalSafe Campus** is an enterprise-grade, AI-powered cybersecurity defense platform engineered specifically to safeguard higher education institutions, academic research laboratories, student bodies, and faculty members from the expanding spectrum of digital threats. 

Modern academic campuses represent high-value, vulnerable targets for cyber adversaries. Thousands of transient students connect personal devices (BYOD) across open university Wi-Fi networks, interact with university registration portals, scan physical event posters, review syllabus attachments, and conduct financial aid transactions. SignalSafe Campus unifies proactive client-side protection, static heuristic verification, machine learning classification, and threat intelligence into a unified institutional defense umbrella.

### Live Production Deployments
- **Cloud Backend API & Detection Engine**: `https://signalsafe.onrender.com`
- **Interactive Web Platform & PWA**: `https://signalsafe.vercel.app`
- **Browser Protection Extension**: `SignalSafe Browser Guardian` (Chrome & Microsoft Edge Manifest V3)
- **Source Code Repository**: `https://github.com/muhammadadil8095/signalsafe`

```
           SIGNALSAFE CAMPUS PLATFORM
   ┌────────────────────────────────────────┐
   │ "Your digital safety, one signal ahead" │
   └────────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
┌──────────────┐┌──────────────┐┌──────────────┐
│  Vite React  ││ Browser MV3  ││   FastAPI    │
│  Web / PWA   ││   Guardian   ││ Backend Core │
└──────────────┘└──────────────┘└──────────────┘
```

---

# 2. CAMPUS CYBER THREAT LANDSCAPE & PROBLEM STATEMENT

Higher education cybersecurity environments face unique structural challenges that distinguish them from standard corporate networks:

1. **Decentralized Infrastructure & BYOD Saturation**:
   Campuses host tens of thousands of personal laptops, smartphones, and tablets connecting across unmanaged dorm Wi-Fi networks. Enforcing rigid endpoint agents (such as heavyweight enterprise EDR) across student-owned machines is legally and operationally unfeasible.

2. **Quishing (QR Code Phishing) on Physical Notice Boards**:
   Adversaries routinely paste malicious QR code stickers over legitimate university flyers, dining hall menus, parking payment meters, and campus library kiosks. Students scanning these codes are redirected to credential-harvesting portals impersonating university single sign-on (SSO) systems.

3. **Urgency-Driven Social Engineering**:
   Academic calendars create recurring high-stress windows (e.g., tuition deadlines, course registration drops, financial aid disbursement, exam schedules). Attackers deploy urgent phishing SMS and emails claiming: *"Your Student Account has a hold; verify credentials within 2 hours or face course deregistration."*

4. **Malicious Syllabus & Financial Aid Attachments**:
   Adversaries distribute weaponized PDF or HTML attachments disguised as scholarship application forms, syllabus revisions, or student employment invoices containing obfuscated JavaScript, launch actions, or embedded phishing redirects.

5. **Student Portal & Brand Impersonation**:
   Adversaries register typosquatted domains (e.g., `canvas-student-login.xyz`, `campus-sso-auth.tk`) designed to spoof institution branding, steal multi-factor authentication (MFA) tokens, or compromise institutional email addresses.

SignalSafe Campus resolves these vectors by providing a zero-trust inspection pipeline that evaluates digital artifacts *before* users interact with them, without executing malicious code on client endpoints.

---

# 3. END-TO-END SYSTEM TOPOLOGY & ARCHITECTURE

The SignalSafe Campus architecture is structured as a resilient, multi-tiered pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT TIER                                  │
│                                                                             │
│  ┌───────────────────────────────┐     ┌─────────────────────────────────┐  │
│  │   Vite + React 18 + TS PWA    │     │ SignalSafe Browser Guardian MV3 │  │
│  │  - URL / QR Scanner Page      │     │  - webNavigation Auto-Scan      │  │
│  │  - Message / Attachment Page  │     │  - Shadow-DOM Threat Shield     │  │
│  │  - Incident Management Page   │     │  - Local Interstitial Warning   │  │
│  │  - Admin Security Dashboard   │     │  - DNR Repeat-Visit Blocker     │  │
│  └───────────────┬───────────────┘     └────────────────┬────────────────┘  │
└──────────────────┼──────────────────────────────────────┼───────────────────┘
                   │ HTTPS / JSON (JWT Bearer Auth)       │
                   ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY & SECURITY LAYER                       │
│                                                                             │
│  FastAPI Routing Engine (`/api/v1`)                                         │
│  ├── CORS Access Control (Pre-approved web & extension origins)            │
│  ├── SlowAPI Rate Limiting (IP & identity throttling)                      │
│  ├── Pydantic Input Validation & Payload Sanitization                       │
│  └── JWT Authentication & Role-Based Access Control (RBAC)                  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       THREAT DETECTION & FUSION PIPELINE                    │
│                                                                             │
│   ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐  │
│   │  Heuristic Engine  │   │  ML Classification │   │ VirusTotal v3 API  │  │
│   │  (17 Lexical Rules)│   │ (27-Feature Model) │   │ (Intelligence Agg) │  │
│   └─────────┬──────────┘   └─────────┬──────────┘   └─────────┬──────────┘  │
│             │                        │                        │             │
│             └────────────────────────┼────────────────────────┘             │
│                                      ▼                                      │
│                         ┌────────────────────────┐                          │
│                         │   Risk Fusion Engine   │                          │
│                         │ (Mathematical Weighing)│                          │
│                         └────────────┬───────────┘                          │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PERSISTENCE & AUDIT TIER                            │
│                                                                             │
│  SQLAlchemy ORM + SQLite (Dev) / PostgreSQL (Prod)                          │
│  ├── Users & Passwords (bcrypt salt rounds = 12)                            │
│  ├── Scan Records & Associated Threat Signals                               │
│  ├── Security Incident Reports & Uploaded Evidence                          │
│  └── Immutable Security Audit Trail & System Telemetry                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 4. THREAT DETECTION & INSPECTION ENGINE

The core of SignalSafe Campus is its **Tri-Tier Risk Fusion Engine**, which combines static lexical heuristics, predictive machine learning, and global threat intelligence into an authoritative threat verdict.

```
       Input Target URL
              │
              ├──► [Static Heuristic Engine] ─────► Heuristic Signal List (0 - 100)
              │
              ├──► [27-Feature ML Predictor] ────► Model Probability (0.00 - 1.00)
              │
              └──► [VirusTotal v3 Intelligence] ─► Engine Detection Counts (M / S / U)
                                                        │
                                                        ▼
                                            [Mathematical Fusion Model]
                                                        │
                                                        ▼
                                            authoritative Verdict:
                                       SAFE | SUSPICIOUS | MALICIOUS
```

---

### 4.1 Lexical & Structural Heuristic Analyzer (17 Indicators)
Implemented in [`backend/app/analyzers/url_analyzer.py`](file:///e:/SignalSafe-Campus-main/backend/app/analyzers/url_analyzer.py), this module inspects the anatomy of a URL without triggering HTTP connections or server-side requests (preventing Server-Side Request Forgery - SSRF).

The 17 heuristic checks comprise:

1. **URL Length Verification**:
   Phishing URLs routinely embed deep token structures or lengthy paths to obscure malicious hostnames. URLs with length $> 75$ characters trigger a medium-severity flag; URLs $> 150$ characters trigger high-severity warnings.

2. **IPv4 / IPv6 Literal Host Detection**:
   Legitimate campus services utilize fully qualified domain names (FQDNs). IP addresses (e.g., `http://192.168.1.50/login` or `http://185.220.101.5/sso`) bypass DNS reputation systems and are flagged as high severity.

3. **HTTPS Encryption Enforcement**:
   Plaintext `http://` targets transmitting credentials over unencrypted channels are flagged with a medium-severity security violation.

4. **Suspicious Top-Level Domain (TLD) Filtering**:
   Maintains a blacklist of high-abuse, low-cost TLDs frequently registered by botnets and spam rings:
   `tk`, `ml`, `ga`, `cf`, `gq`, `xyz`, `top`, `buzz`, `club`, `work`, `date`, `racing`, `win`, `bid`, `stream`, `download`, `click`, `link`, `gdn`, `icu`, `monster`, `cam`.

5. **Excessive Subdomain Stacking**:
   Attackers stack subdomains to simulate legitimate services (e.g., `login.microsoft.com.account-update.tk`). When $\ge 3$ subdomain levels are detected via `tldextract`, a threat signal is raised.

6. **Embedded Authority '@' Symbol**:
   RFC 3986 allows userinfo credentials prior to the `@` character in URIs. Attackers leverage this to deceive users: `http://google.com@evil-attacker.com`. The browser ignores everything before the `@` and connects to `evil-attacker.com`. This is flagged as high severity.

7. **Brand Impersonation & Typosquatting Matcher**:
   Extracts root domain and subdomains, cross-referencing against major targets:
   `paypal`, `google`, `microsoft`, `apple`, `amazon`, `netflix`, `facebook`, `instagram`, `chase`, `citibank`, `bankofamerica`, `dropbox`, `icloud`, `outlook`, `office365`.
   If a brand keyword appears anywhere inside the subdomain or path while the registered domain does not match the official enterprise registrar, high-severity brand impersonation is recorded.

8. **Suspicious Path Keyword Density**:
   Inspects URL path segments for high-risk verbs:
   `login`, `signin`, `verify`, `secure`, `account`, `update`, `confirm`, `banking`, `password`, `credential`, `authenticate`, `wallet`, `suspend`, `billing`, `invoice`, `webscr`.
   Single keyword: low severity; multiple keywords: medium severity.

9. **Known URL Shortener Cloaking**:
   Detects URL shortening services (`bit.ly`, `tinyurl.com`, `t.co`, `goo.gl`, `is.gd`, `ow.ly`, `cutt.ly`, etc.) that mask the true destination.

10. **Punycode / Internationalized Domain Name (IDN) Homograph Detection**:
    Identifies `xn--` prefixes where lookalike Cyrillic or Greek glyphs replace Latin letters (e.g., Cyrillic 'а' replacing Latin 'a' to spoof `apple.com`).

11. **Non-Standard Port Execution**:
    Flags URLs specifying ports other than standard HTTP (80) or HTTPS (443) (e.g., `https://portal.edu:8443` or `http://site.com:8080`), common in rogue proxy listeners.

12. **Data URI Payload Injection**:
    Detects `data:` schemes containing base64 or plaintext script content attempting to evade browser sandboxes (critical severity).

13. **Excessive Query Parameter Obfuscation**:
    Flags URLs with $> 5$ query parameters, frequently employed to encode victim telemetry or exploit parameters.

14. **Double-Slash Open Redirect Patterns**:
    Detects `//` inside the URL path after the authority segment, indicating potential open-redirect exploits.

15. **Special Character Density Ratio**:
    Calculates the proportion of special characters (`-`, `_`, `.`, `~`, `:`, `/`, `?`, `#`, `[`, `]`, `@`, `!`, `$`, `&`, `*`, `+`, `=`, `%`) relative to URL length. A ratio $> 0.30$ indicates deliberate obfuscation.

16. **Numeric Digit Ratio**:
    Measures the ratio of numeric digits to total URL length. Automated phishing generators typically exhibit a digit ratio $> 0.30$.

17. **Shannon Entropy Calculation**:
    Measures the randomness and information density of characters across the URL string using Shannon's Entropy formula:
    $$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
    Where $P(x_i)$ represents the frequency of character $x_i$ divided by total length. URLs exhibiting $H(X) > 4.5$ indicate algorithmically generated domain names (DGA) or encrypted hex payloads.

---

### 4.2 Machine Learning Inference Subsystem (27-Feature Vector)
Implemented in [`ml/src/feature_extraction.py`](file:///e:/SignalSafe-Campus-main/ml/src/feature_extraction.py) and trained in [`ml/src/train.py`](file:///e:/SignalSafe-Campus-main/ml/src/train.py), the machine learning subsystem evaluates 27 numerical and categorical dimensions:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        27-DIMENSIONAL FEATURE VECTOR                   │
├────┬─────────────────────────────┬────┬────────────────────────────────┤
│ 1  │ url_length                  │ 15 │ has_https                      │
│ 2  │ domain_length               │ 16 │ has_www                        │
│ 3  │ path_length                 │ 17 │ subdomain_count                │
│ 4  │ num_dots                    │ 18 │ is_shortened                   │
│ 5  │ num_hyphens                 │ 19 │ suspicious_tld                 │
│ 6  │ num_underscores             │ 20 │ has_port                       │
│ 7  │ num_slashes                 │ 21 │ digit_ratio                    │
│ 8  │ num_query_params            │ 22 │ letter_ratio                   │
│ 9  │ num_fragments               │ 23 │ special_char_ratio             │
│ 10 │ num_digits                  │ 24 │ has_punycode                   │
│ 11 │ num_special_chars           │ 25 │ domain_has_digits              │
│ 12 │ has_ip_address              │ 26 │ path_has_suspicious_keywords   │
│ 13 │ has_at_symbol               │ 27 │ entropy (Shannon H)            │
│ 14 │ has_double_slash_redirect   │    │                                │
└────┴─────────────────────────────┴────┴────────────────────────────────┘
```

#### Training & Inference Architecture
- **Algorithm**: `RandomForestClassifier` (100 Estimators, max depth 15, balanced class weights, parallel execution `n_jobs=-1`).
- **Training Dataset (Mendeley LegitPhish Dataset `hx4m73v2sf/2`)**:
  - Trained on **100,872 verified URLs** (63,492 active malicious phishing URLs collected from URLHaus and verified threat feeds; 37,380 legitimate URLs sampled from high-reputation domains like Wikipedia, StackOverflow, and academic institutions).
  - High-speed parallel feature extraction pipeline (`extract_batch` with `n_jobs=-1`, batch size 500) processing $>1,600\text{ URLs/sec}$.
  - Supports automatic column mapping (`url`/`link`, `label`/`ClassLabel`), universal binary label conversion (`0` = phishing, `1` = legitimate), and optional stratified sampling (`--sample-size 25000`) for sub-3-minute training.
- **Model Evaluation Metrics (Test Set: 20,175 Samples)**:
  - **Accuracy**: **99.90%**
  - **Precision**: **99.90%** (Weighted)
  - **Recall**: **99.90%** (Weighted)
  - **F1-Score**: **99.90%** (Weighted)
  - **Confusion Matrix** (labels: `['legitimate', 'phishing']`):
    - True Negatives (TN): **7,459** | False Positives (FP): **17**
    - False Negatives (FN): **3** | True Positives (TP): **12,696**
- **Pipeline Packaging**: Features are extracted, scaled, and serialized using `joblib` into [`ml/models/url_phishing_model.joblib`](file:///e:/SignalSafe-Campus-main/ml/models/url_phishing_model.joblib) and [`ml/models/feature_pipeline.joblib`](file:///e:/SignalSafe-Campus-main/ml/models/feature_pipeline.joblib).
- **Fault-Tolerant Predictor**: The backend `MLPredictor` ([`backend/app/ml/predictor.py`](file:///e:/SignalSafe-Campus-main/backend/app/ml/predictor.py)) initializes at FastAPI application startup, structuring inference requests as labeled feature DataFrames to eliminate scikit-learn warnings, and gracefully falling back to heuristic evaluation if model artifacts are absent.

---

### 4.3 Threat Intelligence Aggregator (VirusTotal v3 Integration)
Implemented in [`backend/app/services/virustotal_service.py`](file:///e:/SignalSafe-Campus-main/backend/app/services/virustotal_service.py):

1. **URL Identifier Computation**:
   VirusTotal v3 requires a base64-encoded SHA-256 hash or standard base64 URL representation without padding:
   ```python
   import base64
   url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
   ```
2. **API Endpoint**:
   Queries `GET https://www.virustotal.com/api/v3/urls/{url_id}` with headers:
   `x-apikey: <VT_API_KEY>`.
3. **Engine Aggregation**:
   Parses `last_analysis_stats` returning:
   - `vt_malicious`: Number of security vendors flagging the URL as malware or phishing.
   - `vt_suspicious`: Number of vendors marking the URL as suspicious.
   - `vt_undetected`: Number of engines reporting clean or no intelligence.
4. **Rate Limit & Privacy Safeguards**:
   - Queries are cached to conserve API quotas.
   - If the API key is unconfigured or rate limits are reached (HTTP 429), the service returns `vt_available = False` without halting the scan pipeline.

---

### 4.4 abuse.ch URLhaus Threat Intelligence Engine (Sub-Millisecond Dual-Layer)
Implemented in [`backend/app/services/urlhaus_service.py`](file:///e:/SignalSafe-Campus-main/backend/app/services/urlhaus_service.py) with offline/active compressed indicators stored in [`backend/app/data/urlhaus_signatures.json.gz`](file:///e:/SignalSafe-Campus-main/backend/app/data/urlhaus_signatures.json.gz):

URLhaus is an open community cyber threat intelligence project operated by **abuse.ch** that tracks, verifies, and disseminates malicious URLs used for malware distribution, botnet command & control (C2), and credential-harvesting attacks.

```
┌────────────────────────────────────────────────────────────────────────┐
│               URLHAUS THREAT INTELLIGENCE INGESTION & PIPELINE         │
│                                                                        │
│   [LegitPhish Mendeley Dataset]     [abuse.ch Daily Syndication Feed] │
│     63,466 Malicious URLs             109,182 Active URLs              │
│     26,105 Malicious Domains           16,143 Active Domains           │
│                    │                                │                  │
│                    └────────────────┬───────────────┘                  │
│                                     ▼                                  │
│                     Compaction Pipeline (Gzip JSON)                    │
│                     170,903 URLs  |  43,993 Domains                    │
│                                     │                                  │
│                                     ▼                                  │
│                     Fast In-Memory Exact & Host Match                  │
│                        Lookup Time: < 20 microseconds                  │
│                                     │                                  │
│                     (Optional) abuse.ch Auth-Key API                   │
│                     GET https://urlhaus-api.abuse.ch/v1/url/          │
│                                     │                                  │
│                                     ▼                                  │
│                     Risk Engine Enforcement (Score >= 90)              │
└────────────────────────────────────────────────────────────────────────┘
```

#### Dual-Layer Architecture:
1. **Ultra-Fast Local Threat Database (Zero External Network Delay)**:
   - Compressed archive (`urlhaus_signatures.json.gz`, 4.13 MB) decompressed into Python `set` collections at service initialization.
   - Evaluates:
     - Exact normalized URL matches (including and excluding schemes `http://` / `https://` and trailing slashes).
     - Domain and root-host matches against 43,993 malicious domains.
   - Typical query latency: **$< 0.05 \text{ ms}$**, eliminating network bottlenecks during real-time web browsing inspection.
2. **Dynamic abuse.ch API Verification**:
   - For novel or recently registered indicators, queries `https://urlhaus-api.abuse.ch/v1/url/` using `URLHAUS_AUTH_KEY` when configured.
   - Cached locally in an LRU memory dictionary to prevent redundant external API calls.
3. **Deterministic Risk Override**:
   - A verified URLhaus match represents confirmed malware payload infrastructure. When detected:
     - Appends `urlhaus_malicious` critical signal.
     - Automatically clamps `risk_score = max(risk_score, 90.0)` (verdict: `malicious`).
     - Provides an authoritative audit link (`https://urlhaus.abuse.ch/browse/?search=...`).

---

### 4.5 Risk Fusion Engine & Mathematical Scoring Model
Implemented in [`backend/app/services/scan_service.py`](file:///e:/SignalSafe-Campus-main/backend/app/services/scan_service.py):

The final risk score $S \in [0, 100]$ is computed by synthesizing heuristic signals, machine learning confidence, and optional VirusTotal intelligence:

$$S = \min\left(100.0, \; \sum_{i \in \text{Signals}} W(i) + S_{\text{ML}} \right)$$

#### 1. Signal Severity Base Weights
- **Critical Severity Signal**: $+70.0$ points (e.g. data URI injection, explicit credential interception)
- **High Severity Signal**: $+45.0$ points (e.g. brand impersonation, embedded user authority `@` symbol)
- **Medium Severity Signal**: $+25.0$ points (e.g. suspicious TLDs, excessive subdomains $\ge 3$)
- **Low Severity Signal**: $+10.0$ points (e.g. non-standard port, minor structural anomalies)

#### 2. False Positive Damping for Long URLs (80% Weight Reduction)
Campus environments frequently generate exceptionally long legitimate URLs (e.g., Canvas LMS deep course modules, Google Drive share links, Zoom registration tokens, JSTOR academic citations). 
To prevent long URLs from causing false-positive warnings, SignalSafe implements an explicit **80% weight reduction** for length-related signals:
```python
if signal.get("signal_type") in ("long_url", "abnormal_url_length"):
    weight *= 0.2  # Retain only 20% of original severity weight
```

#### 3. Machine Learning Score Augmentation ($S_{\text{ML}}$)
- If model predicts **`phishing`** or **`malicious`**:
  $$S_{\text{ML}} = \text{confidence} \times 50.0$$
- If model predicts **`suspicious`**:
  $$S_{\text{ML}} = \text{confidence} \times 25.0$$
- If model predicts **`legitimate`**: $+0.0$ points (clean baseline verified).

#### 4. Final Verdict Boundaries
```
 0                     25                    60                   100
 ├──────────────────────┼─────────────────────┼─────────────────────┤
 │         SAFE         │     SUSPICIOUS      │      MALICIOUS      │
 └──────────────────────┴─────────────────────┴─────────────────────┘
```
- **SAFE ($0 \le S < 25$)**: Normal legitimate destination. All signals clear.
- **SUSPICIOUS ($25 \le S \le 60$)**: Elevated caution required. Multiple structural anomalies or moderate ML uncertainty.
- **MALICIOUS ($S > 60$)**: High-severity threat detected. Blocked by browser guardian and flagged for incident escalation.

---

# 5. SPECIALIZED SCANNING MODULES

In addition to direct URL scanning, SignalSafe Campus implements three specialized threat inspection engines:

---

### 5.1 QR Code Threat Scanner (Anti-Quishing Engine)
Implemented in [`frontend/src/pages/dashboard/QRScanner.tsx`](file:///e:/SignalSafe-Campus-main/frontend/src/pages/dashboard/QRScanner.tsx):

```
┌────────────────────────────────────────────────────────────────────────┐
│                        QUISHING DEFENSE PIPELINE                       │
│                                                                        │
│  [Campus Flyer / Sticker] ──► [Camera / Image File]                    │
│                                      │                                 │
│                                      ▼                                 │
│                       [Canvas 2D Context Processing]                   │
│                                      │                                 │
│                                      ▼                                 │
│                          [jsQR Algorithmic Decoder]                    │
│                                      │                                 │
│                                      ▼                                 │
│                    Decoded Target URL Extracted                        │
│                                      │                                 │
│                         NON-EXECUTION GATEWAY                          │
│                (Never auto-navigates browser to target)                │
│                                      │                                 │
│                                      ▼                                 │
│                 [POST /api/v1/scans/url Threat Inspection]             │
│                                      │                                 │
│                                      ▼                                 │
│           User Reviews Safety Verdict BEFORE Visiting Destination       │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Dual Ingestion Channels**:
   - **Active Live Video Scanner**: Connects directly to hardware camera streams via `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })`. Incorporates automated stream attachment hooks with `<video autoPlay playsInline muted>` and `onLoadedMetadata` event listeners, eliminating white/blank screen freezes. Includes camera orientation toggles, video track management, and fallback canvas polling at 30 fps.
   - **Direct Image File Upload Processor**: Ingests uploaded PNG, JPEG, or WebP files, rendering image bitmaps onto a high-DPI canvas context and processing byte buffers through `jsQR`.
2. **Deterministic Barcode Decoding**:
   Utilizes `jsQR` to locate finder patterns, extract timing lines, and decode Reed-Solomon error-corrected byte streams without browser navigation.
3. **Transparent Destination Inspection & Zero Auto-Navigation**:
   - The application **never auto-redirects or launches the browser** to decoded QR destinations.
   - Decoded results are rendered in a dedicated Destination Inspection Card displaying:
     - Full extracted URL and resolved root domain.
     - Categorical risk badge (`SAFE`, `SUSPICIOUS`, `MALICIOUS`).
     - Real-time threat signal tags (e.g. `known_url_shortener`, `brand_impersonation`, `suspicious_tld`).
     - Plain-language risk explanations and actionable campus recommendations before any user action.

---

### 5.2 Social Engineering & Message Analyzer
Implemented in [`backend/app/analyzers/message_analyzer.py`](file:///e:/SignalSafe-Campus-main/backend/app/analyzers/message_analyzer.py):

Examines unstructured communication text (SMS, WhatsApp, emails, Discord messages) for cognitive manipulation patterns:

1. **Urgency Markers**:
   Regex detection of artificial deadlines: `immediately`, `urgent`, `asap`, `within 24 hours`, `act now`, `final warning`, `deadline`.
2. **Untraceable Financial Channels**:
   Flags requests for untraceable funds common in campus job scams: `gift card`, `bitcoin`, `cryptocurrency`, `western union`, `venmo`, `zelle`, `itunes card`, `steam card`.
3. **Credential Harvesting Inquiries**:
   Flags solicitation of sensitive identity parameters: `password`, `social security`, `ssn`, `bank account`, `pin number`, `cvv`, `date of birth`.
4. **Institutional Authority Impersonation**:
   Matches patterns spoofing university departments:
   `IT support`, `helpdesk alert`, `system administrator`, `registrar notice`, `financial aid office`, `campus police`.
5. **Punitive Threats**:
   Matches coercion tactics: `suspend your account`, `account will be closed`, `legal action`, `expel`, `terminate access`, `permanently delete`.

---

### 5.3 Static Attachment Analysis Sandbox (PDF & HTML Non-Execution)
Implemented in [`backend/app/analyzers/attachment_analyzer.py`](file:///e:/SignalSafe-Campus-main/backend/app/analyzers/attachment_analyzer.py):

Examines uploaded document attachments without triggering operating system execution:

#### PDF Inspection (via PyPDF2)
- Inspects PDF object dictionaries for interactive execution tags:
  - `/JavaScript` and `/JS`: Embedded ECMAScript code designed to execute inside PDF readers.
  - `/Launch`: Shell execution triggers attempting to spawn local binaries.
  - `/OpenAction`: Automated actions executed immediately when the document is opened.
  - `/EmbeddedFiles`: Hidden files or executables packed into PDF streams.
  - `/URI`: Embedded hyperlinks targeting suspicious external domains.

#### HTML Attachment Inspection (via BeautifulSoup)
- Parses DOM structures of `.html` and `.htm` attachments:
  - `<form action="...">`: Verifies whether forms post credentials to external untrusted domains.
  - `<input type="password">`: Flags password inputs embedded directly in email attachments.
  - `<iframe>` and `<frame>`: Detects hidden iframes loading external exploit kits.
  - `<script>`: Identifies base64 `eval()` statements, unescape obfuscation, or external script inclusions.

---

# 6. SIGNALSAFE BROWSER GUARDIAN (MANIFEST V3 EXTENSION)

**SignalSafe Browser Guardian** is a Chrome and Microsoft Edge extension located in [`browser-extension/`](file:///e:/SignalSafe-Campus-main/browser-extension). It serves as the real-time client for SignalSafe Campus.

```
┌────────────────────────────────────────────────────────────────────────┐
│               SIGNALSAFE BROWSER GUARDIAN ARCHITECTURE                │
│                                                                        │
│   [Browser Tab Navigation]                                             │
│              │                                                         │
│              ▼                                                         │
│   [service-worker.ts] ◄── chrome.webNavigation.onCompleted (frameId 0) │
│              │                                                         │
│              ├──► Validate Protocol & Host Eligibility                 │
│              ├──► Check In-Flight Concurrency Map                      │
│              ├──► Query In-Memory / chrome.storage.local TTL Cache     │
│              │                                                         │
│              ▼                                                         │
│   [POST /api/v1/scans/url] (signalsafe.onrender.com)                   │
│              │                                                         │
│              ├──► MALICIOUS ──► [Replace Tab with warning.html]        │
│              │             └──► [Register DNR Dynamic Redirect Rule]   │
│              │                                                         │
│              ├──► SUSPICIOUS ─► [Inject Closed Shadow-DOM Overlay]     │
│              │             └──► [Provide "Continue Anyway" Bypass]    │
│              │                                                         │
│              └──► SAFE ───────► [Silent Pass + Update Popup State]     │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 6.1 Architectural Overview & MV3 Compliance
1. **Zero Manifest V2 Dependencies**: Operates entirely within Manifest V3 specifications.
2. **Declarative & Event-Driven**: Runs inside an ephemeral Background Service Worker that activates on navigation events and suspends when idle.
3. **No Unrestricted WebRequest Interception**: Strictly adheres to Chrome privacy guidelines, avoiding arbitrary network body interception.

---

### 6.2 Automatic Navigation Interception (`webNavigation.onCompleted`)
Automatic scanning hooks into `chrome.webNavigation.onCompleted`:
```typescript
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId !== 0) return; // Top-level main frame only
  void handleAutoScan(details.tabId, details.url);
});
```

#### Pre-Scan Eligibility Gate
Before dispatching a remote analysis, the extension evaluates five boundary conditions:
1. `getAutoProtection()`: Is the automatic protection toggle switched ON?
2. `getAuthState()`: Is the user authenticated with an active session token?
3. `validateScanUrl()`: Is the destination a public `http:` or `https:` address? Excludes `chrome://`, `edge://`, `chrome-extension://`, `about:`, `file:`.
4. `isSelfUrl()`: Is the URL the SignalSafe backend or frontend itself? Prevents recursive scan loops.
5. `isUrlBypassed()`: Did the user previously click "Continue Anyway" on this suspicious destination?

---

### 6.3 Concurrency Control, Race Condition Prevention & Scan Deduplication
In high-speed browsing environments, users frequently click multiple links or close tabs rapidly. SignalSafe Guardian implements four defensive concurrency controls:

1. **In-Flight Concurrency Lock**:
   Maintains an active in-memory map: `activeTabScans = Map<number, string>` (mapping `tabId` to `targetUrl`). If a navigation event triggers for a tab where a scan is already running for that exact URL, redundant execution is dropped immediately.

2. **Race Condition & Navigation Cancellation**:
   Remote API scans require network roundtrips. During this interval, a student might click a link or hit Back. Before applying any verdict, the service worker verifies:
   ```typescript
   const currentTab = await chrome.tabs.get(tabId);
   if (!currentTab || currentTab.url !== targetUrl) {
     return; // Tab navigated elsewhere; drop stale result!
   }
   ```

3. **Multi-Tab Isolation**:
   Scan verdicts are persisted per tab ID in `chrome.storage.local` under `ssg.tabScans`. Tab 1 visiting `google.com` and Tab 2 visiting `github.com` maintain distinct, isolated security states.

4. **Lifecycle Garbage Collection**:
   When a tab is closed, `chrome.tabs.onRemoved` purges the corresponding entries from `activeTabScans` and storage, preventing memory leakage.

---

### 6.4 In-Memory & Local Storage TTL/LRU Cache Subsystem
Implemented in [`src/storage/storage.ts`](file:///e:/SignalSafe-Campus-main/browser-extension/src/storage/storage.ts):

To avoid redundant server load and stay within network quotas:
- **TTL Window**: Scan results are cached for **10 minutes** (`CACHE_TTL_MS = 600,000 ms`).
- **LRU Ceiling**: The cache is bounded to a maximum of **100 entries** (`MAX_CACHE_ENTRIES`). When capacity is reached, the entry with the oldest timestamp is automatically evicted.
- **Normalization**: URLs are normalized (stripping fragments `#section` while preserving query parameters) to ensure consistent cache hits.

---

### 6.5 Real-Time Threat Interstitial & Warning Surfaces

#### 1. Malicious Threat Interstitial (`src/pages/warning.html`)
When a scan returns `MALICIOUS`, the service worker immediately redirects the affected tab:
```typescript
const warningUrl = chrome.runtime.getURL(
  `src/pages/warning.html?scan=${scanId}&url=${encodeURIComponent(url)}&risk=malicious`
);
await chrome.tabs.update(tabId, { url: warningUrl });
```

The warning page enforces a strict security hierarchy:
- **Red Danger Theme**: Shield icon, high-contrast crimson borders (`#ff4d61`).
- **Plain-Language Explanation**: *"SignalSafe Guardian detected serious security risks associated with this website. This website may be designed to steal your passwords, personal information, or campus login credentials."*
- **Action Buttons**:
  - **RETURN TO SAFETY**: Invokes `chrome.tabs.goBack()` or navigates to `chrome://newtab/`.
  - **REPORT TO CAMPUS SECURITY**: Automatically submits an incident report to `POST /api/v1/reports/` with the scan ID attached.
  - **VIEW TECHNICAL DETAILS**: Collapsible accordion displaying raw heuristic signals, ML prediction probability, and VirusTotal statistics.

#### 2. Suspicious Caution Overlay (`src/content/warning-overlay.ts`)
For `SUSPICIOUS` destinations, the extension injects a Shadow-DOM alert overlay:
- **Closed Shadow Root**: Utilizes `attachShadow({ mode: "closed" })`, preventing host page scripts from reading, modifying, or disabling the warning elements.
- **Actions**:
  - **Return to Safety**: Navigates away from the host.
  - **Continue Anyway**: Registers the URL in `ssg.bypassedUrls`, dismisses the overlay, and allows the student to proceed.
  - **Report to Campus Security**: Files an incident report.

---

### 6.6 DeclarativeNetRequest Dynamic Rules for Repeat-Visit Defense
Implemented in [`src/services/dnr.ts`](file:///e:/SignalSafe-Campus-main/browser-extension/src/services/dnr.ts):

#### Technical Honesty on MV3 Limitations
Chrome Manifest V3 extensions cannot pause an initial TCP connection while awaiting an asynchronous remote API response. Therefore, the first visit to an unknown URL is evaluated as navigation completes.

However, to provide **instant, hardware-level blocking on repeat visits**, confirmed malicious domains are registered as dynamic redirect rules via `chrome.declarativeNetRequest`:
```typescript
const newRule: chrome.declarativeNetRequest.Rule = {
  id: nextId,
  priority: 1,
  action: {
    type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
    redirect: { url: warningRedirectUrl },
  },
  condition: {
    urlFilter: `||${cleanedDomain}^`,
    resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
  },
};
```
If the student or an automated script attempts to access that domain again, the browser redirects immediately to `warning.html` without sending a single network packet to the adversary host.

---

### 6.7 Student-Centric Security Dashboard & Design System Parity
The toolbar popup (`src/popup/Popup.tsx`) and scanning result views are built in visual parity with the main SignalSafe web platform:

- **Unified Visual Identity**: Formatted using the web platform's modern dark theme tokens (`#0a0f1d` deep canvas, `#1e293b` frosted borders, emerald safe indicators `#10b981`, amber caution `#f59e0b`, and crimson threat badges `#ef4444`).
- **Dynamic Risk Gauge**: Renders an animated score bar matching the backend risk categorization ($0-100$).
- **Micro-Badges & Telemetry Cards**: Clean card layouts displaying AI Security classification (e.g. 99% confidence), VirusTotal engine consensus, and specific heuristic threat flags.

```
┌──────────────────────────────────────────┐
│ [Shield] SignalSafe Guardian   [SAFE]    │
│ Your Campus Web Protection               │
├──────────────────────────────────────────┤
│ Automatic Protection       [ ON / OFF ]  │
│ Active · Auto-scans every page           │
├──────────────────────────────────────────┤
│ CURRENT DESTINATION                      │
│ wikipedia.org                            │
│ https://en.wikipedia.org/wiki/Main_Page  │
├──────────────────────────────────────────┤
│ SAFE DESTINATION                         │
│ No known threats detected by security    │
├──────────────────────────────────────────┤
│ [============= Risk Score: 5/100 ======] │
├──────────────────────────────────────────┤
│ ┌──────────────┐┌──────────────┐┌───────┐│
│ │ AI SECURITY  ││ THREAT INTEL ││HEURIS.││
│ │ Active (99%) ││ Clean (0/70) ││ Clean ││
│ └──────────────┘└──────────────┘└───────┘│
├──────────────────────────────────────────┤
│ [    Scan Current Website (Manual)     ] │
│                                          │
│ ▼ View Technical Details                 │
├──────────────────────────────────────────┤
│ student@campus.edu  API: onrender.com ⚙ │
│                                [Sign Out]│
└──────────────────────────────────────────┘
```

#### 9 Distinct State Phases
1. `unauthenticated`: Clean login interface with configurable API base URL.
2. `authenticated`: Confirmed student identity, live status indicators.
3. `idle`: Ready for manual or automated inspection.
4. `scanning`: Animated pulse scanner indicating in-flight API analysis.
5. `safe`: Electric-green shield confirming verified safety.
6. `suspicious`: Amber warning banner with prompt to review caution factors.
7. `malicious`: Crimson alert card with direct links to incident reporting and safe return.
8. `backend_unavailable`: Transparent offline indicator with one-click server settings.
9. `auth_expired`: Session expired notification prompting re-authentication.

---

# 7. INCIDENT MANAGEMENT & SECURITY OPERATIONS CENTER (SOC) WORKFLOWS

SignalSafe Campus bridges end-user threat detection with administrative incident response:

```
 [Student / Extension Detects Threat]
                 │
                 ▼
      [POST /api/v1/reports/]
                 │
   Status: "submitted" (Severity: High/Medium/Low)
                 │
                 ▼
  [Admin Incident Management Console]
  (Filter by Severity, Status, Reporter)
                 │
                 ├──► Move to "under_review"
                 ├──► Assign to Security Analyst UUID
                 ├──► Move to "investigating"
                 │
                 ▼
       Resolution & Remediation
  (Add resolution notes, block campus firewall)
                 │
                 ▼
   Status: "resolved" or "rejected"
                 │
                 ▼
    [Immutable Audit Log Generated]
```

1. **Submission**:
   Students or the Guardian extension submit incident reports with:
   - `title`: Short summary of the threat.
   - `description`: Detailed threat context including URL, domain, and heuristic findings.
   - `incident_type`: `phishing`, `malware`, `impersonation`, `financial_scam`, `quishing`.
   - `severity`: `low`, `medium`, `high`, `critical`.
   - `related_scan_id`: Foreign key UUID linking back to the exact scan record.
2. **Investigation & Triage**:
   Campus security officers access [`frontend/src/pages/admin/IncidentManagement.tsx`](file:///e:/SignalSafe-Campus-main/frontend/src/pages/admin/IncidentManagement.tsx):
   - Review submitted telemetry and evidence files.
   - Assign incident investigation to specific staff members.
   - Update lifecycle status (`submitted` $\to$ `under_review` $\to$ `investigating` $\to$ `resolved` / `rejected`).
3. **Audit Trail**:
   Every status change, assignment, or note generation produces an immutable record in the `audit_logs` table capturing timestamp, user ID, IP address, and resource diff.

---

# 8. ROLE-BASED ACCESS CONTROL (RBAC) & SECURITY GOVERNANCE

SignalSafe Campus implements strict Role-Based Access Control enforced at the FastAPI dependency injection layer:

```
               USER ROLES & PERMISSIONS
┌─────────────────────────────────────────────────────────┐
│ STUDENT ROLE                                            │
│  - Execute URL, QR Code, Message & Attachment Scans     │
│  - View Personal Scan History & Personal Incident Files │
│  - Submit New Incident Reports                          │
├─────────────────────────────────────────────────────────┤
│ FACULTY ROLE                                            │
│  - All Student Permissions                              │
│  - Departmental Security Alerts & Advisory Feeds        │
├─────────────────────────────────────────────────────────┤
│ ADMIN (SECURITY OFFICER) ROLE                           │
│  - Executive SOC Dashboard & Analytics                  │
│  - Manage All Institutional Incident Reports            │
│  - User Management (Modify Roles & Suspend Accounts)    │
│  - Inspect Complete System Audit Logs                   │
└─────────────────────────────────────────────────────────┘
```

#### JWT Cryptographic Security
- **Access Tokens**: Short-lived (30 minutes), signed with `HS256` containing `sub` (User UUID), `role`, `type: "access"`, and `exp`.
- **Refresh Tokens**: Long-lived (7 days), signed with `type: "refresh"`, used exclusively against `POST /api/v1/auth/refresh`.
- **Password Storage**: Passwords are never stored in plaintext. They are salted and hashed using `passlib` with `bcrypt` (12 rounds).

---

# 9. DATABASE ARCHITECTURE & ENTITY-RELATIONSHIP SPECIFICATIONS

The database tier is designed via SQLAlchemy ORM with full migration support via Alembic.

```
┌─────────────────────┐       ┌──────────────────────┐
│        users        │       │        scans         │
├─────────────────────┤       ├──────────────────────┤
│ id (PK, String)     │◄──┐   │ id (PK, String)      │◄──┐
│ email (Unique)      │   └───│ user_id (FK)         │   │
│ username (Unique)   │       │ scan_type            │   │
│ hashed_password     │       │ original_input       │   │
│ full_name           │       │ normalized_url       │   │
│ role (Enum)         │       │ domain               │   │
│ is_active (Boolean) │       │ risk_score (Float)   │   │
│ created_at          │       │ risk_level           │   │
│ updated_at          │       │ prediction           │   │
└──────────┬──────────┘       │ ml_available         │   │
           │                  │ vt_available         │   │
           │                  │ scanned_at           │   │
           │                  └──────────┬───────────┘   │
           │                             │ 1             │
           │                             ▼ *             │
           │                  ┌──────────────────────┐   │
           │                  │    threat_signals    │   │
           │                  ├──────────────────────┤   │
           │                  │ id (PK, String)      │   │
           │                  │ scan_id (FK) ────────┘   │
           │                  │ signal_type          │   │
           │                  │ description          │   │
           │                  │ severity             │   │
           │                  │ source               │   │
           │                  └──────────────────────┘   │
           │                                             │
           │ 1                                           │
           ▼ *                                           │
┌─────────────────────┐                                  │
│  incident_reports   │                                  │
├─────────────────────┤                                  │
│ id (PK, String)     │                                  │
│ reporter_id (FK)    │                                  │
│ assigned_to (FK)    │                                  │
│ related_scan_id(FK)─┼──────────────────────────────────┘
│ title               │
│ description         │
│ incident_type       │
│ severity            │
│ status              │
│ resolution_notes    │
│ created_at          │
└──────────┬──────────┘
           │ 1
           ▼ *
┌─────────────────────┐       ┌──────────────────────┐
│  incident_evidence  │       │      audit_logs      │
├─────────────────────┤       ├──────────────────────┤
│ id (PK, String)     │       │ id (PK, String)      │
│ incident_id (FK)    │       │ user_id (FK)         │
│ file_name           │       │ action               │
│ file_type           │       │ resource_type        │
│ file_size           │       │ resource_id          │
│ file_path           │       │ details (JSON)       │
│ uploaded_at         │       │ timestamp            │
└─────────────────────┘       └──────────────────────┘
```

---

# 10. FRONTEND APPLICATION ARCHITECTURE & PWA SUBSYSTEM

Implemented in [`frontend/`](file:///e:/SignalSafe-Campus-main/frontend) using React 18, TypeScript, Vite, and Tailwind CSS.

### 1. Progressive Web App (PWA) Capabilities
- **Web App Manifest (`manifest.webmanifest`)**: Provides native installation banners on mobile devices and desktop operating systems.
- **Service Worker Lifecycle**: Caches core shell assets (HTML, CSS, JS, fonts) enabling instant loading and offline educational guidance.
- **InstallPwaButton Component**: Prompts students to add SignalSafe to their home screens for instant QR scanning and emergency security reporting.

### 2. Multi-Theme Engine & Real-Time Sync
- **ThemeContext Subsystem**: Multi-theme architecture allowing instantaneous switching between **Dark** and **Light** modes.
- **Theme Persistence**: User preferences are automatically persisted to `localStorage` and synchronized across tabs without page reloads.
- **Visual Palette**:
  - *Dark Mode*: High-contrast obsidian canvas (`#0a0f1d`) with glowing emerald, cyan, amber, and crimson telemetry badges.
  - *Light Mode*: Clean zinc/slate surfaces (`#f8fafc`) with subtle borders and balanced contrast ratios meeting WCAG AA standards.

### 3. Production Data Architecture (Zero Dummy Data)
All placeholder and mock arrays across the platform were eliminated and replaced with live backend telemetry:
- **Student Dashboard**: Live scan history, personalized threat alerts, and real-time statistics fetched directly from `/api/v1/scans/history`.
- **Faculty Dashboard**: Live department scan metrics, incident reporting feeds, and verified URL status tracking.
- **Security Admin Portal**: Real-time user management, live database audit logs (`/api/v1/admin/audit-logs`), and dynamic security incident state triage.

### 4. Typography & Accessibility
- **Typography**: Inter and JetBrains Mono / Red Hat Mono font pairings for high technical legibility.
- **ARIA Compliance**: Role attributes, live regions (`aria-live="polite"`), and focus management for screen reader accessibility.

---

# 11. EXHAUSTIVE REST API REFERENCE

All protected endpoints require `Authorization: Bearer <access_token>`.

### Authentication Endpoints
| Method | Endpoint | Request Payload | Success Code | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | `{ email, username, password, full_name }` | `201 Created` | Creates a new user account |
| `POST` | `/api/v1/auth/login` | `{ email, password }` | `200 OK` | Authenticates credentials, returns tokens & profile |
| `POST` | `/api/v1/auth/refresh` | `{ refresh_token }` | `200 OK` | Exchanges valid refresh token for new access token |
| `GET` | `/api/v1/auth/me` | None | `200 OK` | Returns current user profile |

### Threat Scan Endpoints
| Method | Endpoint | Request Payload | Success Code | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/scans/url` | `{ url: string, scan_type?: "url" }` | `201 Created` | Executes heuristic, ML, and VT threat analysis |
| `GET` | `/api/v1/scans/history` | Query params: `page=1&size=20` | `200 OK` | Returns paginated scan history for user |
| `GET` | `/api/v1/scans/{scan_id}` | Path param: `scan_id` | `200 OK` | Retrieves detailed results for specific scan |

### Specialized Analysis Endpoints
| Method | Endpoint | Request Payload | Success Code | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/analyze/message` | `{ content: string }` | `200 OK` | Evaluates message for urgency, scam, and social engineering |
| `POST` | `/api/v1/analyze/attachment` | Multipart Form: `file` | `200 OK` | Static structural parsing of PDF/HTML attachment (max 10MB) |

### Incident Reporting Endpoints
| Method | Endpoint | Request Payload | Success Code | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/reports/` | `{ title, description, incident_type, severity, related_scan_id? }` | `201 Created` | Submits security incident report |
| `GET` | `/api/v1/reports/` | Query params: `page=1&size=20` | `200 OK` | Lists reports (users see own; admins see all) |
| `GET` | `/api/v1/reports/{id}` | Path param: `id` | `200 OK` | Returns incident report details & evidence metadata |
| `PUT` | `/api/v1/reports/{id}/status` | `{ status, severity, assigned_to, resolution_notes }` | `200 OK` | Admin updates incident investigation status |

### Admin Endpoints
| Method | Endpoint | Access | Success Code | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/admin/dashboard` | Admin Only | `200 OK` | System-wide statistics and telemetry |
| `GET` | `/api/v1/admin/users` | Admin Only | `200 OK` | Paginated user management table |
| `PUT` | `/api/v1/admin/users/{id}/role` | Admin Only | `200 OK` | Updates user authorization role |
| `GET` | `/api/v1/admin/audit-logs` | Admin Only | `200 OK` | Immutable system audit logs |

### Diagnostic & Health Probes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Operational status of database, ML model, and VirusTotal |
| `GET` | `/api/v1/ml/health` | Public | Status and latency of Random Forest inference pipeline |

---

# 12. DEVOPS, CLOUD DEPLOYMENT & CONTAINER ORCHESTRATION

### Cloud Deployment Topology
- **Backend (Render)**: Containerized web service running FastAPI via Uvicorn workers on `https://signalsafe.onrender.com`.
- **Frontend (Vercel)**: Global CDN hosting optimized Vite React production build on `https://signalsafe.vercel.app`.

### Docker Containerization
```dockerfile
# Multi-stage Backend Dockerfile
FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose Multi-Service Stack
To run the complete system locally:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - SECRET_KEY=dev-secret-key-change-in-production
      - CORS_ORIGINS=http://localhost:5173,http://localhost:8000
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on:
      - backend
```

---

# 13. VERIFICATION, TESTING & QUALITY ASSURANCE

### Automated Test Suites

#### 1. Browser Extension Vitest Suite (35 Tests Passing)
Located in [`browser-extension/src/`](file:///e:/SignalSafe-Campus-main/browser-extension/src/):
```bash
cd browser-extension
npm test
```
- `src/background/navigation.test.ts` (7 tests): Automatic scanning execution, in-flight deduplication, multi-tab isolation, stale cancellation during navigation.
- `src/utils/url.test.ts` (10 tests): Protocol verification, self-URL filtering, fragment normalization, risk predicates.
- `src/storage/storage.test.ts` (8 tests): Auto-protection toggle persistence, tab scan storage, TTL cache expiry, LRU eviction, bypass list.
- `src/services/scanner.test.ts` (3 tests): Scan classification thresholds, incident report payload creation.
- `src/services/auth.test.ts` (5 tests): Login credential validation, base URL formatting.
- `src/services/api.test.ts` (2 tests): HTTP error mapping, timeout detection, offline detection.

#### 2. Backend Pytest Suite
Located in [`backend/tests/`](file:///e:/SignalSafe-Campus-main/backend/tests/):
```bash
cd backend
pytest
```
- `test_scans.py`: URL threat analyzer verification, history pagination.
- `test_auth.py`: User registration, password hashing, JWT token generation, refresh rotation.
- `test_url_analyzer.py`: 17 lexical rules against malicious and benign datasets.
- `test_message_analyzer.py`: Social engineering and urgency detection.
- `test_attachment_analyzer.py`: Static PDF and HTML sandbox parsing.
- `test_reports.py`: Incident creation, admin triage status transitions.

---

# 14. SECURITY GUARANTEES, PRIVACY BOUNDARIES & LIMITATIONS

### Core Security Commitments
1. **Zero Client-Side Token Exposure**:
   JWT authentication tokens reside strictly within trusted extension contexts (`chrome.storage.local` / background service worker). Page content scripts and host DOMs can never access access tokens.
2. **Zero Form Data or Credential Harvesting**:
   The extension and web application never read passwords, keystrokes, input fields, or cookies from visited websites.
3. **Non-Execution Sandbox**:
   Attachments and submitted URLs are analyzed statically. Uploaded files are never executed by the operating system.

### Technical Honesty Regarding Manifest V3
Google Chrome and Microsoft Edge Manifest V3 do not allow extensions to pause initial TCP connections while awaiting an asynchronous remote API scan. 
- SignalSafe Guardian inspects URLs as navigation completes (typically $< 1.5$ seconds) and replaces the tab with `warning.html` if malicious.
- For repeat visits, Manifest V3 `declarativeNetRequest` dynamic rules provide immediate hardware-level redirection before any connection is made.

---

# 15. OPERATOR RUNBOOK, TROUBLESHOOTING & MAINTENANCE

### Local Development Setup
1. **Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python -m app.database.seed
   uvicorn app.main:app --port 8000 --reload
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. **Browser Extension**:
   ```bash
   cd browser-extension
   npm install
   npm run build
   ```
   Load `browser-extension/dist` as an unpacked extension in `chrome://extensions`.
4. **Machine Learning Model Training Pipeline**:
   ```bash
   # Train on full 100,872 verified Mendeley LegitPhish dataset
   python -m ml.src.train --dataset ml/datasets/legitphish_mendeley.csv --output ml/models/

   # Fast-train mode with stratified downsampling (25,000 samples, ~2-3 minutes)
   python -m ml.src.train --dataset ml/datasets/legitphish_mendeley.csv --sample-size 25000 --output ml/models/
   ```

### Default Seed Accounts
- **Administrator**: `admin@signalsafe.edu` / `admin123`
- **Student**: `student@campus.edu` / `student123`
- **Faculty**: `faculty@campus.edu` / `faculty123`

### Common Troubleshooting Procedures
- **Render Backend Cold Starts**:
  Render free tier instances sleep after 15 minutes of inactivity. The first API request may take up to 45 seconds to spin up. The extension includes a 28-second timeout and retry indicator.
- **CORS Violations**:
  If connecting a custom frontend or local extension, verify that the origin is included in `CORS_ORIGINS` in `backend/app/core/config.py`.
- **Extension Reloading**:
  After making code changes in `browser-extension/src/`, re-run `npm run build` and click the **Reload** button on the extension card in `chrome://extensions`.

---

# 16. FUTURE TECHNICAL ROADMAP

1. **Lightweight WebAssembly (WASM) ML Model**:
   Port the 27-feature Random Forest model to ONNX Web runtime running directly inside the extension service worker for 0ms sub-millisecond local pre-filtering.
2. **Enterprise SIEM / Syslog Integration**:
   Provide automated export connectors for Splunk, Elastic, and Microsoft Sentinel to stream campus threat incidents directly into institutional Security Operations Centers.
3. **Multi-Factor Authentication (MFA / WebAuthn)**:
   Implement FIDO2 / WebAuthn hardware security keys and TOTP authenticator app support for administrative accounts.
4. **Mobile Browser Extension Support**:
   Package the extension for Firefox Mobile and Kiwi Browser to bring automated protection to Android and iOS mobile web users.

---

*SignalSafe Campus Architecture & Engineering Report — Version 2.4.0 — Maintained by the SignalSafe Security Team.*


---

# 17. APPENDIX A: MATHEMATICAL SPECIFICATIONS OF THE 27 ML FEATURE VECTORS

The machine learning subsystem extracts a continuous and discrete numerical feature vector $\vec{x} \in \mathbb{R}^{27}$ from every input URL $U$:

### Feature Index 1: `url_length`
$$\phi_1(U) = |U|$$
Measures total character count of the URL string. Phishing URLs frequently exceed 75 characters to hide subdomains or include base64 payload strings.

### Feature Index 2: `domain_length`
$$\phi_2(U) = |\text{FQDN}(U)|$$
Measures the length of the fully qualified domain name extracted via `tldextract`.

### Feature Index 3: `path_length`
$$\phi_3(U) = |\text{Path}(U)|$$
Length of the URL path component following the authority and port.

### Feature Index 4 to 7: Delimiter Counts
- $\phi_4(U) = \text{count}(U, \text{'.'})$
- $\phi_5(U) = \text{count}(U, \text{'-'})$
- $\phi_6(U) = \text{count}(U, \text{'\_'})$
- $\phi_7(U) = \text{count}(U, \text{'/'})$
Excessive hyphens and dots are common indicators of domain impersonation (e.g., `login-portal-auth.campus-service.com`).

### Feature Index 8: `num_query_params`
$$\phi_8(U) = |\text{keys}(\text{parse\_qs}(\text{Query}(U)))|$$
Number of discrete parameter keys parsed from the query string.

### Feature Index 9: `num_fragments`
$$\phi_9(U) = \begin{cases} 1 & \text{if } \text{Fragment}(U) \neq \emptyset \\ 0 & \text{otherwise} \end{cases}$$
Identifies hash targets frequently utilized in single-page client-side credential stealers.

### Feature Index 10: `num_digits`
$$\phi_{10}(U) = \sum_{c \in U} \mathbb{I}(c \in [0, 9])$$
Total count of numeric digit characters.

### Feature Index 11: `num_special_chars`
$$\phi_{11}(U) = \sum_{c \in U} \mathbb{I}(c \in \{-,\_,\.,\sim,:,/,?,\#,[,\,],@,!,$,\&,',\*,\,+,,,;,=,\%\})$$

### Feature Index 12: `has_ip_address`
$$\phi_{12}(U) = \begin{cases} 1 & \text{if Host}(U) \text{ is IPv4 or IPv6} \\ 0 & \text{otherwise} \end{cases}$$

### Feature Index 13: `has_at_symbol`
$$\phi_{13}(U) = \begin{cases} 1 & \text{if '@'} \in \text{Authority}(U) \\ 0 & \text{otherwise} \end{cases}$$

### Feature Index 14: `has_double_slash_redirect`
$$\phi_{14}(U) = \begin{cases} 1 & \text{if '//'} \in \text{Path}(U) \\ 0 & \text{otherwise} \end{cases}$$

### Feature Index 15: `has_https`
$$\phi_{15}(U) = \begin{cases} 1 & \text{if Scheme}(U) = \text{"https"} \\ 0 & \text{otherwise} \end{cases}$$

### Feature Index 16: `has_www`
$$\phi_{16}(U) = \begin{cases} 1 & \text{if "www."} \in \text{Host}(U) \\ 0 & \text{otherwise} \end{cases}$$

### Feature Index 17: `subdomain_count`
$$\phi_{17}(U) = \begin{cases} \text{len}(\text{split}(\text{Subdomain}(U), \text{'.' })) & \text{if Subdomain}(U) \neq \emptyset \\ 0 & \text{otherwise} \end{cases}$$

### Feature Index 18: `is_shortened`
$$\phi_{18}(U) = \mathbb{I}(\text{RegisteredDomain}(U) \in \text{SHORTENERS})$$

### Feature Index 19: `suspicious_tld`
$$\phi_{19}(U) = \mathbb{I}(\text{TLD}(U) \in \text{SUSPICIOUS\_TLDS})$$

### Feature Index 20: `has_port`
$$\phi_{20}(U) = \begin{cases} 1 & \text{if Port}(U) \notin \{\emptyset, 80, 443\} \\ 0 & \text{otherwise} \end{cases}$$

### Feature Index 21: `digit_ratio`
$$\phi_{21}(U) = \frac{\phi_{10}(U)}{|U|}$$

### Feature Index 22: `letter_ratio`
$$\phi_{22}(U) = \frac{\sum_{c \in U} \mathbb{I}(c \in [a-zA-Z])}{|U|}$$

### Feature Index 23: `special_char_ratio`
$$\phi_{23}(U) = \frac{\phi_{11}(U)}{|U|}$$

### Feature Index 24: `has_punycode`
$$\phi_{24}(U) = \begin{cases} 1 & \text{if "xn--" } \in \text{Host}(U) \\ 0 & \text{otherwise} \end{cases}$$

### Feature Index 25: `domain_has_digits`
$$\phi_{25}(U) = \begin{cases} 1 & \text{if } \exists c \in \text{Host}(U) \text{ s.t. } c \in [0, 9] \\ 0 & \text{otherwise} \end{cases}$$

### Feature Index 26: `path_has_suspicious_keywords`
$$\phi_{26}(U) = \sum_{w \in \text{KEYWORDS}} \mathbb{I}(w \in \text{Path}(U))$$

### Feature Index 27: `entropy` (Shannon Information Entropy)
$$\phi_{27}(U) = -\sum_{k \in \Sigma} P(k) \log_2 P(k)$$
Where $\Sigma$ is the alphabet of unique characters in $U$, and $P(k) = \frac{\text{count}(U, k)}{|U|}$.

---

# 18. APPENDIX B: COMPLETE JSON SCHEMAS & WIRE FORMATS

### 1. URL Threat Scan Response (`POST /api/v1/scans/url`)
```json
{
  "id": "7f8b9a1c-3456-42d8-9123-abcdef012345",
  "scan_type": "url",
  "original_input": "https://auth-campus-portal.tk/sso/login.php",
  "normalized_url": "https://auth-campus-portal.tk/sso/login.php",
  "domain": "auth-campus-portal.tk",
  "risk_score": 88.5,
  "risk_level": "malicious",
  "prediction": "phishing",
  "ml_available": true,
  "ml_prediction": "malicious",
  "ml_confidence": 0.9642,
  "vt_available": true,
  "vt_malicious": 14,
  "vt_suspicious": 3,
  "vt_undetected": 55,
  "signals": [
    {
      "signal_type": "suspicious_tld",
      "description": "Domain uses the '.tk' TLD, frequently associated with phishing campaigns.",
      "severity": "medium",
      "source": "heuristic"
    },
    {
      "signal_type": "brand_impersonation",
      "description": "URL contains brand keywords 'campus-portal' on an untrusted domain.",
      "severity": "high",
      "source": "heuristic"
    },
    {
      "signal_type": "suspicious_path_keywords",
      "description": "URL path contains suspicious authentication keywords: login.",
      "severity": "medium",
      "source": "heuristic"
    }
  ],
  "explanation": [
    "High-confidence phishing indicators detected across lexical heuristics and VirusTotal intelligence.",
    "Multiple security vendors flagged this host as malicious."
  ],
  "recommendations": [
    "WARNING: This destination is classified as MALICIOUS.",
    "Do NOT enter passwords or campus single-sign-on credentials.",
    "Report this URL immediately to Campus IT Security."
  ],
  "threat_signals": [
    {
      "signal_type": "suspicious_tld",
      "description": "Domain uses the '.tk' TLD, frequently associated with phishing campaigns.",
      "severity": "medium",
      "source": "heuristic"
    }
  ],
  "scanned_at": "2026-10-31T03:30:00.000000Z"
}
```

### 2. Message Analysis Response (`POST /api/v1/analyze/message`)
```json
{
  "risk_level": "malicious",
  "risk_score": 85,
  "indicators": [
    {
      "signal_type": "high_urgency",
      "description": "Message uses multiple urgency markers: immediately, within 24 hours.",
      "severity": "high",
      "source": "rule_based"
    },
    {
      "signal_type": "impersonation",
      "description": "Message appears to impersonate IT or administrative authority.",
      "severity": "high",
      "source": "rule_based"
    },
    {
      "signal_type": "credential_request",
      "description": "Message asks for sensitive information: password.",
      "severity": "critical",
      "source": "rule_based"
    }
  ],
  "explanation": [
    "Artificial urgency combined with authority impersonation and password requests indicates a credential harvesting attack."
  ],
  "recommendations": [
    "Legitimate campus IT staff will NEVER ask for your password via text or email.",
    "Do not reply to this message or click any included links."
  ]
}
```

### 3. Attachment Static Analysis Response (`POST /api/v1/analyze/attachment`)
```json
{
  "risk_level": "malicious",
  "risk_score": 90,
  "file_name": "scholarship_application.pdf",
  "file_type": "application/pdf",
  "file_size": 245760,
  "indicators": [
    {
      "signal_type": "pdf_embedded_javascript",
      "description": "PDF contains embedded JavaScript (/JavaScript or /JS object).",
      "severity": "high",
      "source": "static_pdf"
    },
    {
      "signal_type": "pdf_open_action",
      "description": "PDF specifies an automated /OpenAction executed on document load.",
      "severity": "high",
      "source": "static_pdf"
    }
  ],
  "explanation": [
    "PDF file contains interactive execution structures that violate campus security policy."
  ],
  "recommendations": [
    "Do not open this attachment. It contains executable script components."
  ]
}
```

### 4. Incident Report Creation Response (`POST /api/v1/reports/`)
```json
{
  "id": "e4a2d810-7b24-4f51-b842-123456789abc",
  "reporter_id": "c1f7b889-14a5-4813-8be8-2e0f49c06129",
  "title": "SignalSafe Alert: auth-campus-portal.tk",
  "description": "Submitted automatically via SignalSafe Browser Guardian.\nTarget URL: https://auth-campus-portal.tk/sso/login.php\nRisk Level: MALICIOUS\nRisk Score: 88.5/100",
  "incident_type": "phishing",
  "severity": "high",
  "status": "submitted",
  "related_scan_id": "7f8b9a1c-3456-42d8-9123-abcdef012345",
  "assigned_to": null,
  "resolution_notes": null,
  "created_at": "2026-10-31T03:31:00.000000Z",
  "updated_at": "2026-10-31T03:31:00.000000Z",
  "evidence": []
}
```

---

# 19. APPENDIX C: INCIDENT RESPONSE TRIAGE PLAYBOOK FOR CAMPUS SOC TEAMS

This operational playbook guides university security analysts investigating reports submitted via SignalSafe Campus:

```
                      INCIDENT TRIAGE DECISION TREE
                                    │
                                    ▼
                     [Incident Status: SUBMITTED]
                                    │
            ┌───────────────────────┴───────────────────────┐
            ▼                                               ▼
   [High / Critical Severity]                       [Medium / Low Severity]
            │                                               │
   1. Assign within 15 mins                         1. Review within 4 hours
   2. Status -> "under_review"                      2. Status -> "under_review"
            │                                               │
            ▼                                               ▼
 [Examine Related Scan Record]                    [Examine Signals & Context]
            │                                               │
 ├── Domain matches known campaign?               ├── False positive from classroom?
 ├── Multiple student reports?                    │   └── If benign: Status -> "rejected"
 └── Active credential submission?                │
            │                                     └── If valid: Status -> "investigating"
            ▼
  [Status: INVESTIGATING]
  Actions:
  - Add malicious domain to Campus DNS Blocklist (Pi-hole / Bind / Palo Alto)
  - Issue campus-wide bulletin if impersonating university SSO
  - Invalidate active student sessions if credentials were submitted
            │
            ▼
  [Status: RESOLVED]
  - Document remediation notes in Incident Report
  - Record resolution in immutable Audit Trail
```

### Standard Operating Procedures by Attack Vector
1. **Quishing (QR Codes on Campus Physical Notice Boards)**:
   - Dispatch campus security / facilities staff to physically locate and remove malicious sticker overlays.
   - Cross-reference decoded URL against the campus proxy logs to detect students who connected prior to the report.
2. **Tuition / Financial Aid Phishing**:
   - Alert the university Bursar and Financial Aid departments.
   - Trigger password resets for any user account reporting credential entry.
3. **Faculty / Professor Impersonation**:
   - Verify if faculty institutional email was compromised or merely spoofed via external free email providers (e.g., `professor.smith.edu@gmail.com`).
   - If spoofed, configure mail gateway header filters (`SPF`/`DKIM`/`DMARC`).

---

# 20. APPENDIX D: EXTENSION INTERNAL MESSAGING PROTOCOL SPECIFICATION

Communication between popup, background service worker, and content scripts utilizes strictly typed JSON messaging:

| Message `type` | Direction | Payload Arguments | Background Response Structure | Purpose |
|---|---|---|---|---|
| `GET_STATE` | Popup $\to$ Worker | `{ tabId?: number }` | `{ ok: boolean, state: GuardianState }` | Retrieves current phase, user, tab, and verdict |
| `SET_AUTO_PROTECTION` | Popup $\to$ Worker | `{ enabled: boolean }` | `{ ok: boolean, state: GuardianState }` | Toggles automated background scanning |
| `SCAN_CURRENT_TAB` | Popup $\to$ Worker | None | `{ ok: boolean, state: GuardianState }` | Triggers immediate manual scan of active tab |
| `LOGIN` | Popup $\to$ Worker | `{ email, password, baseUrl }` | `{ ok: boolean, state: GuardianState }` | Authenticates against configured API |
| `LOGOUT` | Popup $\to$ Worker | None | `{ ok: boolean, state: GuardianState }` | Clears tokens, active scans, and DNR rules |
| `SET_BASE_URL` | Popup $\to$ Worker | `{ baseUrl: string }` | `{ ok: boolean, state: GuardianState }` | Updates target API host |
| `REPORT_URL` | Any $\to$ Worker | `{ scanId: string, incidentType?: string }` | `{ ok: boolean, state: GuardianState }` | Submits incident to `/api/v1/reports/` |
| `OPEN_WARNING` | Overlay $\to$ Worker | `{ scanId: string, riskLevel?: string, url?: string }` | `{ ok: boolean }` | Spawns dedicated warning tab |
| `CONTINUE_ANYWAY` | Overlay $\to$ Worker | `{ url: string, tabId?: number }` | `{ ok: boolean }` | Adds URL to bypass list, unblocks session |
| `SAFE_RETURN` | Warning $\to$ Worker | `{ tabId?: number }` | `{ ok: boolean }` | Navigates tab back or to `chrome://newtab/` |
| `SHOW_OVERLAY` | Worker $\to$ Content | `{ payload: OverlayPayload }` | None | Injects closed Shadow-DOM caution dialog |

---

# 21. APPENDIX E: DATABASE DDL & SCHEMA CONSTRAINTS SPECIFICATION

```sql
-- Users Table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'student',
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_users_email ON users(email);
CREATE INDEX ix_users_username ON users(username);

-- Scans Table
CREATE TABLE scans (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    scan_type VARCHAR(20) NOT NULL DEFAULT 'url',
    original_input TEXT NOT NULL,
    normalized_url TEXT,
    domain VARCHAR(255),
    risk_score FLOAT NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    prediction VARCHAR(50) NOT NULL,
    ml_available BOOLEAN NOT NULL DEFAULT 0,
    ml_prediction VARCHAR(50),
    ml_confidence FLOAT,
    vt_available BOOLEAN NOT NULL DEFAULT 0,
    vt_malicious INTEGER,
    vt_suspicious INTEGER,
    vt_undetected INTEGER,
    scanned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX ix_scans_user_id ON scans(user_id);
CREATE INDEX ix_scans_domain ON scans(domain);

-- Threat Signals Table
CREATE TABLE threat_signals (
    id VARCHAR(36) PRIMARY KEY,
    scan_id VARCHAR(36) NOT NULL,
    signal_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    source VARCHAR(50) NOT NULL,
    FOREIGN KEY(scan_id) REFERENCES scans(id) ON DELETE CASCADE
);
CREATE INDEX ix_threat_signals_scan_id ON threat_signals(scan_id);

-- Incident Reports Table
CREATE TABLE incident_reports (
    id VARCHAR(36) PRIMARY KEY,
    reporter_id VARCHAR(36) NOT NULL,
    assigned_to VARCHAR(36),
    related_scan_id VARCHAR(36),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(30) NOT NULL DEFAULT 'submitted',
    resolution_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY(related_scan_id) REFERENCES scans(id) ON DELETE SET NULL
);
CREATE INDEX ix_incidents_reporter ON incident_reports(reporter_id);
CREATE INDEX ix_incidents_status ON incident_reports(status);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(36) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX ix_audit_logs_user ON audit_logs(user_id);
CREATE INDEX ix_audit_logs_action ON audit_logs(action);
```

---

*SignalSafe Campus Architecture & Engineering Report — Version 2.4.0 — Certified for Academic Institutional Deployment.*
