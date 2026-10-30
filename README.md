# SignalSafe Campus
> *"Your digital safety. One signal ahead."*

SignalSafe Campus is an AI-powered cybersecurity platform that protects students, faculty, and academic institutions against phishing URLs, QR-code attacks (quishing), malicious attachments, deceptive financial requests, and impersonation scams.

---

## Key Features

- **URL Threat Scanner**: Multi-signal detection engine fusing static heuristic indicators, machine learning classifications (27 extracted features), and optional VirusTotal v3 intelligence.
- **QR Code Security Scanner (Quishing)**: Decode campus poster QR codes via live camera or image file upload, and inspect destination safety without auto-navigating.
- **Message Analyzer**: Identifies urgency markers, credential harvesting phrases, fake IT department alerts, and fraudulent payment channels.
- **Attachment Static Inspector**: Safe structural parsing of PDF and HTML attachments detecting embedded scripts, launch actions, hidden iframes, and credential inputs.
- **Incident Management**: End-to-end incident submission, status tracking, and severity resolution for campus security officers.
- **Role-Based Portals**: Dedicated experiences for Students, Faculty, and Security Administrators.
- **Progressive Web App (PWA)**: Installable, responsive mobile/desktop app with offline safety instructions.

---

## Architecture Overview

```
SignalSafe-Campus/
├── frontend/             # Vite + React 18 + TypeScript + Tailwind CSS PWA
├── backend/              # FastAPI + SQLAlchemy + SQLite/Postgres + JWT
├── ml/                   # Machine learning pipelines, dataset loaders & training
├── docs/                 # API documentation, architecture & deployment specs
└── docker-compose.yml    # Containerized multi-service deployment
```

---

## Quickstart

### 1. Prerequisites
- Node.js 20+
- Python 3.10+
- (Optional) Docker & Docker Compose

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m app.database.seed
uvicorn app.main:app --port 8000 --reload
```
API Documentation available at: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`

### 4. Demo Login Credentials
- **Admin**: `admin@signalsafe.edu` / `admin123`
- **Student**: `student@campus.edu` / `student123`
- **Faculty**: `faculty@campus.edu` / `faculty123`

---

## ML Model Training & Pipeline

Train the URL phishing detection classifier using the built-in dataset:
```bash
python -m ml.src.train --dataset ml/datasets/sample_urls.csv --output ml/models/
```
Evaluate performance:
```bash
python -m ml.src.evaluate --test-data ml/datasets/sample_urls.csv
```
Classify any URL directly from CLI:
```bash
python -m ml.src.predict --url "http://paypal-security-update.tk/login"
```

---

## Security Guarantees & Non-Execution
- Uploaded attachments are statically inspected and never executed.
- External URLs submitted for analysis are parsed through lexical and reputation metadata without executing client code or triggering arbitrary SSRF loops.
- All administrative operations are guarded by backend RBAC and logged to the audit trail.

