# SignalSafe Campus — System Architecture

## Overview
SignalSafe Campus is an AI-powered campus cybersecurity platform structured around a multi-tier threat detection pipeline and role-based incident reporting framework.

```
       ┌─────────────────────────────────────────────────────────┐
       │                   Vite + React PWA                      │
       │     (TypeScript, Tailwind CSS, Framer Motion, Recharts) │
       └────────────────────────────┬────────────────────────────┘
                                    │ HTTPS / REST (JWT)
       ┌────────────────────────────▼────────────────────────────┐
       │                   FastAPI Backend Core                  │
       │    (RBAC, Rate Limiting, Input Validation, Security)   │
       └─────┬──────────────────────┬──────────────────────┬─────┘
             │                      │                      │
   ┌─────────▼────────┐   ┌─────────▼────────┐   ┌─────────▼────────┐
   │ Heuristic Engine │   │ ML Predictor     │   │ VirusTotal v3    │
   │ (Lexical rules,  │   │ (RandomForest /  │   │ (Intelligence    │
   │  domain traits)  │   │  XGBoost 27-feat)│   │  aggregation)    │
   └─────────┬────────┘   └─────────┬────────┘   └─────────┬────────┘
             └──────────────────────┼──────────────────────┘
                                    │
                          ┌─────────▼────────┐
                          │   Risk Fusion    │
                          │     Engine       │
                          └─────────┬────────┘
                                    │
       ┌────────────────────────────▼────────────────────────────┐
       │                 Database & Audit Store                  │
       │        (SQLAlchemy, SQLite / PostgreSQL, Alembic)       │
       └─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Risk Fusion Architecture
The risk fusion engine synthesizes signals across three distinct sources:
- **Heuristic Engine**: Safe static inspection evaluating URL length, IP literals, punycode/homographs, deceptive subdomains, suspicious TLDs, and path anomalies.
- **Machine Learning Predictor**: An isolated 27-feature pipeline evaluating Shannon entropy, digit ratios, token distributions, and structural variance using Scikit-Learn / XGBoost.
- **Threat Intelligence (VirusTotal v3)**: Asynchronous reputation queries with graceful fallback and rate-limiting safeguards.

### 2. Multi-Role RBAC
- **Student**: Scan URLs, QR codes, messages, attachments; submit security incidents; view personal scan/report history.
- **Faculty**: Department alerts and student protections with faculty privileges.
- **Admin**: Executive cybersecurity overview, user role modifications, incident resolution workflows, and immutable audit logs.

### 3. Static Attachment Sandbox
Attachment inspection enforces:
- Safe, non-executing static parsing (PyPDF2 for PDF structural tags `/JavaScript`, `/Launch`, `/OpenAction`, BeautifulSoup for HTML form actions and script obfuscation).
- Strict 10MB limits, MIME checking, and zero direct execution or external downloads.

