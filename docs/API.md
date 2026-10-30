# SignalSafe Campus — API Documentation

Interactive Swagger documentation is available at `http://localhost:8000/docs` and ReDoc at `http://localhost:8000/redoc`.

All protected endpoints require an `Authorization: Bearer <access_token>` header.

---

## Base URL
`/api/v1`

---

## 1. Authentication (`/api/v1/auth`)

### `POST /auth/register`
Create a new user account.
- **Request Body:**
  ```json
  {
    "email": "student@campus.edu",
    "username": "student1",
    "password": "securepassword123",
    "full_name": "Jane Doe"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "c1f7b889-14a5-4813-8be8-2e0f49c06129",
    "email": "student@campus.edu",
    "username": "student1",
    "full_name": "Jane Doe",
    "role": "student",
    "is_active": true,
    "created_at": "2026-10-30T17:00:00Z",
    "updated_at": "2026-10-30T17:00:00Z"
  }
  ```

### `POST /auth/login`
Authenticate user credentials and retrieve access/refresh tokens.
- **Request Body:**
  ```json
  {
    "email": "student@campus.edu",
    "password": "securepassword123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": { ... }
  }
  ```

### `GET /auth/me`
Retrieve currently logged-in user profile.

---

## 2. Threat Scans (`/api/v1/scans`)

### `POST /scans/url`
Scan and analyze a suspicious URL.
- **Request Body:**
  ```json
  {
    "url": "http://paypal-security-update.tk/login"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "scan_id": "90e1bc0d-71b3-46fa-a83a-86fa0d1d6438",
    "url": "http://paypal-security-update.tk/login",
    "domain": "paypal-security-update.tk",
    "risk_score": 85.0,
    "risk_level": "malicious",
    "prediction": "malicious",
    "ml": {
      "available": true,
      "prediction": "phishing",
      "confidence": 0.9412
    },
    "virustotal": {
      "available": false,
      "malicious": 0,
      "suspicious": 0,
      "undetected": 0
    },
    "signals": [
      {
        "signal_type": "brand_impersonation",
        "description": "URL contains brand name 'paypal' but domain is 'paypal-security-update.tk'",
        "severity": "high",
        "source": "heuristic"
      }
    ],
    "explanation": [
      "[HIGH] Brand impersonation detected."
    ],
    "recommendations": [
      "WARNING: This URL is flagged as malicious. Do NOT visit this site."
    ],
    "scanned_at": "2026-10-30T17:05:00Z"
  }
  ```

### `GET /scans/history`
List previous scans for current user with pagination (`?page=1&size=20`).

---

## 3. Message Analysis (`/api/v1/analyze/message`)

### `POST /analyze/message`
Analyze a suspicious message for urgent phishing, impersonation, or financial scam indicators.
- **Request Body:**
  ```json
  {
    "content": "URGENT: Campus IT Support. Verify your password immediately or account will be suspended."
  }
  ```

---

## 4. Attachment Analysis (`/api/v1/analyze/attachment`)

### `POST /analyze/attachment`
Upload a PDF or HTML attachment (up to 10MB) for static risk inspection.
- **Form Data:**
  - `file`: binary attachment

---

## 5. Incident Reports (`/api/v1/reports`)

### `POST /reports`
Submit an incident report.
- **Request Body:**
  ```json
  {
    "title": "Suspicious login attempt reported",
    "description": "Found a phishing link shared in the student discord channel.",
    "incident_type": "phishing",
    "severity": "high"
  }
  ```

### `GET /reports`
List incidents (student sees their own; admins see all).

### `PUT /reports/{id}/status` *(Admin only)*
Update incident status (`submitted`, `under_review`, `investigating`, `resolved`, `rejected`).

---

## 6. Administration (`/api/v1/admin`)

- `GET /admin/dashboard`: Metrics and overview statistics.
- `GET /admin/users`: User management with pagination and search.
- `PUT /admin/users/{id}/role`: Elevate or update user roles.
- `PUT /admin/users/{id}/status`: Activate or suspend user accounts.
- `GET /admin/audit-logs`: Audit trail for security actions.

