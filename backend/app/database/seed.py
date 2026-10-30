"""Database seed script — creates demo users and sample data.

Usage:
    cd backend
    python -m app.database.seed
"""

from uuid import uuid4
from datetime import datetime, timezone, timedelta

from app.core.security import get_password_hash
from app.database.session import Base, engine, SessionLocal
from app.models.user import User
from app.models.scan import ScanHistory
from app.models.incident import IncidentReport
from app.models.audit import AuditLog


def seed():
    """Seed database with demo users and sample data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@signalsafe.edu").first():
            print("Database already seeded. Skipping.")
            return

        now = datetime.now(timezone.utc)

        # --- Users ---
        admin = User(
            id=str(uuid4()),
            email="admin@signalsafe.edu",
            username="admin",
            hashed_password=get_password_hash("admin123"),
            full_name="Admin User",
            role="admin",
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        student = User(
            id=str(uuid4()),
            email="student@campus.edu",
            username="student",
            hashed_password=get_password_hash("student123"),
            full_name="Demo Student",
            role="student",
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        faculty = User(
            id=str(uuid4()),
            email="faculty@campus.edu",
            username="faculty",
            hashed_password=get_password_hash("faculty123"),
            full_name="Demo Faculty",
            role="faculty",
            is_active=True,
            created_at=now,
            updated_at=now,
        )

        db.add_all([admin, student, faculty])
        db.flush()

        # --- Sample Scans ---
        sample_scans = [
            {
                "url": "https://google.com",
                "domain": "google.com",
                "risk_score": 0.0,
                "risk_level": "safe",
                "prediction": "safe",
                "signals": [],
                "explanation": ["[Demo] No threat signals detected."],
                "recommendations": ["This URL appears safe."],
            },
            {
                "url": "http://paypal-secure-login.tk/verify",
                "domain": "paypal-secure-login.tk",
                "risk_score": 85.0,
                "risk_level": "malicious",
                "prediction": "malicious",
                "signals": [
                    {"signal_type": "brand_impersonation", "description": "[Demo] Impersonates PayPal", "severity": "high", "source": "heuristic"},
                    {"signal_type": "suspicious_tld", "description": "[Demo] Uses .tk TLD", "severity": "medium", "source": "heuristic"},
                ],
                "explanation": ["[Demo] Brand impersonation detected.", "[Demo] Suspicious TLD."],
                "recommendations": ["Do NOT visit this URL."],
            },
            {
                "url": "https://github.com/features",
                "domain": "github.com",
                "risk_score": 0.0,
                "risk_level": "safe",
                "prediction": "safe",
                "signals": [],
                "explanation": ["[Demo] No threats detected."],
                "recommendations": ["URL appears safe."],
            },
            {
                "url": "http://192.168.1.1/login.php",
                "domain": "192.168.1.1",
                "risk_score": 55.0,
                "risk_level": "suspicious",
                "prediction": "suspicious",
                "signals": [
                    {"signal_type": "ip_address_url", "description": "[Demo] Uses IP address", "severity": "high", "source": "heuristic"},
                    {"signal_type": "no_https", "description": "[Demo] No HTTPS", "severity": "medium", "source": "heuristic"},
                ],
                "explanation": ["[Demo] IP-based URL detected."],
                "recommendations": ["Exercise caution."],
            },
            {
                "url": "https://bit.ly/3xY9abc",
                "domain": "bit.ly",
                "risk_score": 30.0,
                "risk_level": "suspicious",
                "prediction": "suspicious",
                "signals": [
                    {"signal_type": "url_shortener", "description": "[Demo] URL shortener detected", "severity": "medium", "source": "heuristic"},
                ],
                "explanation": ["[Demo] Shortened URL hides destination."],
                "recommendations": ["Expand the URL before visiting."],
            },
            {
                "url": "https://wikipedia.org",
                "domain": "wikipedia.org",
                "risk_score": 0.0,
                "risk_level": "safe",
                "prediction": "safe",
                "signals": [],
                "explanation": ["[Demo] No threats."],
                "recommendations": ["URL appears safe."],
            },
            {
                "url": "http://xn--pple-43d.com/account",
                "domain": "xn--pple-43d.com",
                "risk_score": 72.0,
                "risk_level": "malicious",
                "prediction": "malicious",
                "signals": [
                    {"signal_type": "punycode_domain", "description": "[Demo] Punycode domain", "severity": "high", "source": "heuristic"},
                    {"signal_type": "suspicious_path_keyword", "description": "[Demo] Contains 'account'", "severity": "low", "source": "heuristic"},
                ],
                "explanation": ["[Demo] Punycode used to disguise domain."],
                "recommendations": ["Likely a phishing attempt."],
            },
            {
                "url": "https://stackoverflow.com/questions",
                "domain": "stackoverflow.com",
                "risk_score": 0.0,
                "risk_level": "safe",
                "prediction": "safe",
                "signals": [],
                "explanation": ["[Demo] No threats."],
                "recommendations": ["URL appears safe."],
            },
            {
                "url": "https://secure-amazon.account-verify.xyz/login",
                "domain": "account-verify.xyz",
                "risk_score": 92.0,
                "risk_level": "malicious",
                "prediction": "malicious",
                "signals": [
                    {"signal_type": "brand_impersonation", "description": "[Demo] Impersonates Amazon", "severity": "high", "source": "heuristic"},
                    {"signal_type": "suspicious_tld", "description": "[Demo] .xyz TLD", "severity": "medium", "source": "heuristic"},
                    {"signal_type": "suspicious_path_keywords", "description": "[Demo] login keyword", "severity": "medium", "source": "heuristic"},
                ],
                "explanation": ["[Demo] Multiple phishing indicators."],
                "recommendations": ["Do NOT interact with this URL."],
            },
            {
                "url": "https://microsoft.com/en-us/security",
                "domain": "microsoft.com",
                "risk_score": 0.0,
                "risk_level": "safe",
                "prediction": "safe",
                "signals": [],
                "explanation": ["[Demo] No threats."],
                "recommendations": ["URL appears safe."],
            },
        ]

        for i, data in enumerate(sample_scans):
            scan = ScanHistory(
                id=str(uuid4()),
                user_id=str(student.id),
                scan_type="url",
                original_input=data["url"],
                normalized_url=data["url"],
                domain=data["domain"],
                risk_score=data["risk_score"],
                risk_level=data["risk_level"],
                prediction=data["prediction"],
                ml_available=False,
                vt_available=False,
                signals=data["signals"],
                explanation=data["explanation"],
                recommendations=data["recommendations"],
                scanned_at=now - timedelta(days=i),
            )
            db.add(scan)

        # --- Sample Incident Reports ---
        incidents = [
            {
                "title": "[Demo] Phishing email from IT department",
                "description": "[Demo] Received an email claiming to be from IT asking to reset my password through a suspicious link.",
                "incident_type": "phishing",
                "severity": "high",
                "status": "investigating",
            },
            {
                "title": "[Demo] Suspicious QR code on campus poster",
                "description": "[Demo] Found a QR code on a poster in the library that redirects to a non-university URL.",
                "incident_type": "phishing",
                "severity": "medium",
                "status": "under_review",
            },
            {
                "title": "[Demo] Scam scholarship offer",
                "description": "[Demo] Received a text message about a scholarship that requires a processing fee payment via gift cards.",
                "incident_type": "scam",
                "severity": "high",
                "status": "submitted",
            },
            {
                "title": "[Demo] Malware in shared drive",
                "description": "[Demo] Downloaded a PDF from the shared class drive that triggered antivirus warnings.",
                "incident_type": "malware",
                "severity": "critical",
                "status": "resolved",
            },
            {
                "title": "[Demo] Threatening messages from unknown sender",
                "description": "[Demo] Receiving threatening direct messages from an account impersonating a professor.",
                "incident_type": "harassment",
                "severity": "high",
                "status": "investigating",
            },
        ]

        for i, data in enumerate(incidents):
            report = IncidentReport(
                id=str(uuid4()),
                reporter_id=str(student.id),
                title=data["title"],
                description=data["description"],
                incident_type=data["incident_type"],
                severity=data["severity"],
                status=data["status"],
                created_at=now - timedelta(days=i * 2),
                updated_at=now - timedelta(days=i),
            )
            db.add(report)

        db.commit()
        print("Database seeded successfully!")
        print(f"  Admin:   admin@signalsafe.edu / admin123")
        print(f"  Student: student@campus.edu / student123")
        print(f"  Faculty: faculty@campus.edu / faculty123")
        print(f"  {len(sample_scans)} sample scans created")
        print(f"  {len(incidents)} sample incidents created")

    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

