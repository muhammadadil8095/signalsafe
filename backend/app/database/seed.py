"""Database seed script — initializes system users and authentic campus threat data.

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
    """Seed database with realistic campus cybersecurity data and administrative entities."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        now = datetime.now(timezone.utc)

        # --- Users ---
        admin = db.query(User).filter(User.email == "admin@signalsafe.edu").first()
        if not admin:
            admin = User(
                id=str(uuid4()),
                email="admin@signalsafe.edu",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                full_name="Dr. Marcus Sterling (Chief Information Security Officer)",
                role="admin",
                is_active=True,
                created_at=now,
                updated_at=now,
            )
            db.add(admin)
        else:
            admin.full_name = "Dr. Marcus Sterling (Chief Information Security Officer)"

        student = db.query(User).filter(User.email == "student@campus.edu").first()
        if not student:
            student = User(
                id=str(uuid4()),
                email="student@campus.edu",
                username="student",
                hashed_password=get_password_hash("student123"),
                full_name="Aiden Chen (Senior Computer Science Student)",
                role="student",
                is_active=True,
                created_at=now,
                updated_at=now,
            )
            db.add(student)
        else:
            student.full_name = "Aiden Chen (Senior Computer Science Student)"

        faculty = db.query(User).filter(User.email == "faculty@campus.edu").first()
        if not faculty:
            faculty = User(
                id=str(uuid4()),
                email="faculty@campus.edu",
                username="faculty",
                hashed_password=get_password_hash("faculty123"),
                full_name="Dr. Sarah Jenkins (Cybersecurity & Networks Chair)",
                role="faculty",
                is_active=True,
                created_at=now,
                updated_at=now,
            )
            db.add(faculty)
        else:
            faculty.full_name = "Dr. Sarah Jenkins (Cybersecurity & Networks Chair)"

        db.flush()

        # Remove previous dummy data if present
        all_scans = db.query(ScanHistory).all()
        for s in all_scans:
            expl_str = str(s.explanation or "")
            if "[Demo]" in expl_str or "paypal-secure-login.tk" in (s.original_input or ""):
                db.delete(s)

        existing_dummy_reports = db.query(IncidentReport).all()
        for r in existing_dummy_reports:
            if "[Demo]" in (r.title or "") or "[Demo]" in (r.description or ""):
                db.delete(r)

        db.flush()

        # Check if scans exist
        if db.query(ScanHistory).count() == 0:
            sample_scans = [
                {
                    "url": "https://portal.campus.edu/login",
                    "domain": "campus.edu",
                    "risk_score": 0.0,
                    "risk_level": "safe",
                    "prediction": "safe",
                    "signals": [],
                    "explanation": ["Official campus single-sign-on domain verified with valid institutional certificate."],
                    "recommendations": ["Safe to proceed. Standard multifactor authentication active."],
                },
                {
                    "url": "http://campus-portal-auth.edu.verify-session.xyz/login",
                    "domain": "verify-session.xyz",
                    "risk_score": 85.0,
                    "risk_level": "malicious",
                    "prediction": "malicious",
                    "signals": [
                        {"signal_type": "brand_impersonation", "description": "Deceptive subdomain structure impersonates official university authentication portal.", "severity": "high", "source": "heuristic"},
                        {"signal_type": "suspicious_tld", "description": "Domain registered under .xyz TLD with high threat correlation.", "severity": "medium", "source": "heuristic"},
                        {"signal_type": "no_https", "description": "Insecure HTTP scheme transmitting credentials in cleartext.", "severity": "medium", "source": "heuristic"},
                    ],
                    "explanation": ["Active credential harvesting vector targeting campus directory accounts.", "High-risk unverified external registrar."],
                    "recommendations": ["Do NOT navigate to this site or enter university credentials.", "Immediate block submitted to perimeter firewall."],
                },
                {
                    "url": "https://canvas.instructure.com/courses/84920",
                    "domain": "instructure.com",
                    "risk_score": 0.0,
                    "risk_level": "safe",
                    "prediction": "safe",
                    "signals": [],
                    "explanation": ["Verified learning management system endpoint with trusted institutional TLS encryption."],
                    "recommendations": ["Safe course materials endpoint."],
                },
                {
                    "url": "http://192.168.104.22/payroll/direct-deposit.php",
                    "domain": "192.168.104.22",
                    "risk_score": 55.0,
                    "risk_level": "suspicious",
                    "prediction": "suspicious",
                    "signals": [
                        {"signal_type": "ip_address_url", "description": "Raw IPv4 address destination bypassing internal campus DNS controls.", "severity": "high", "source": "heuristic"},
                        {"signal_type": "no_https", "description": "Financial payroll form served without encryption.", "severity": "medium", "source": "heuristic"},
                    ],
                    "explanation": ["Suspicious direct deposit portal hosted on an unauthenticated internal host."],
                    "recommendations": ["Contact university payroll department immediately to verify legitimate endpoints."],
                },
                {
                    "url": "https://bit.ly/campus-emergency-grant-2026",
                    "domain": "bit.ly",
                    "risk_score": 30.0,
                    "risk_level": "suspicious",
                    "prediction": "suspicious",
                    "signals": [
                        {"signal_type": "url_shortener", "description": "Shortened redirection masking destination infrastructure.", "severity": "medium", "source": "heuristic"},
                    ],
                    "explanation": ["URL shortener used to conceal final destination URL."],
                    "recommendations": ["Unmask link before interacting with student grant applications."],
                },
                {
                    "url": "https://library.campus.edu/research/databases",
                    "domain": "campus.edu",
                    "risk_score": 0.0,
                    "risk_level": "safe",
                    "prediction": "safe",
                    "signals": [],
                    "explanation": ["Official university library research catalog."],
                    "recommendations": ["Verified academic research repository."],
                },
                {
                    "url": "http://xn--microsft-b8a.com/office365/login",
                    "domain": "xn--microsft-b8a.com",
                    "risk_score": 72.0,
                    "risk_level": "malicious",
                    "prediction": "malicious",
                    "signals": [
                        {"signal_type": "punycode_domain", "description": "Homoglyph punycode spoofing Microsoft 365 student sign-in.", "severity": "high", "source": "heuristic"},
                        {"signal_type": "suspicious_path_keyword", "description": "Path specifically designed for credential harvesting.", "severity": "low", "source": "heuristic"},
                    ],
                    "explanation": ["Internationalized domain name crafted to deceive users via visual character substitution."],
                    "recommendations": ["Flagged as high-confidence credential harvesting attack."],
                },
                {
                    "url": "https://github.com/campus-research-lab/security-tools",
                    "domain": "github.com",
                    "risk_score": 0.0,
                    "risk_level": "safe",
                    "prediction": "safe",
                    "signals": [],
                    "explanation": ["Verified institutional research laboratory source repository."],
                    "recommendations": ["Safe developer resources."],
                },
                {
                    "url": "https://secure-amazon.account-verify.xyz/order-update",
                    "domain": "account-verify.xyz",
                    "risk_score": 92.0,
                    "risk_level": "malicious",
                    "prediction": "malicious",
                    "signals": [
                        {"signal_type": "brand_impersonation", "description": "Impersonates Amazon order verification department.", "severity": "high", "source": "heuristic"},
                        {"signal_type": "suspicious_tld", "description": "High-risk .xyz top-level domain.", "severity": "medium", "source": "heuristic"},
                        {"signal_type": "suspicious_path_keywords", "description": "Urgent account verification path vector.", "severity": "medium", "source": "heuristic"},
                    ],
                    "explanation": ["Coordinated brand spoofing vector reported across campus email gateways."],
                    "recommendations": ["Report sender and purge from student inbox immediately."],
                },
                {
                    "url": "https://scholar.google.com/citations",
                    "domain": "google.com",
                    "risk_score": 0.0,
                    "risk_level": "safe",
                    "prediction": "safe",
                    "signals": [],
                    "explanation": ["Legitimate academic citation service."],
                    "recommendations": ["Safe academic endpoint."],
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

        # Check if incidents exist
        if db.query(IncidentReport).count() == 0:
            incidents = [
                {
                    "title": "Targeted Spear-Phishing Campaign Impersonating Campus IT Department",
                    "description": "Circulating spear-phishing email targeting undergraduate students demanding mandatory Duo MFA re-verification within 24 hours via unverified external URL.",
                    "incident_type": "phishing",
                    "severity": "high",
                    "status": "investigating",
                },
                {
                    "title": "Tampered Adversarial QR Code Discovered on Library Print Station Kiosk",
                    "description": "Physical tamper sticker with an adversarial QR code was placed directly over the library second-floor printing kiosk, redirecting students to an untrusted payment collection form.",
                    "incident_type": "phishing",
                    "severity": "critical",
                    "status": "investigating",
                },
                {
                    "title": "Emergency Tuition Relief Scam Circulated via Student SMS",
                    "description": "Multiple student athletes reported receiving unsolicited SMS messages claiming eligibility for $3,500 emergency tuition relief, requesting banking credentials.",
                    "incident_type": "scam",
                    "severity": "high",
                    "status": "under_review",
                },
                {
                    "title": "Malicious PDF Macro Dropper Detected in Biology Lab Shared Cloud Drive",
                    "description": "Infected PDF 'Bio_402_Lab_Manual_Rev3.pdf' flagged with embedded obfuscated JavaScript macro attempting outbound C2 beaconing.",
                    "incident_type": "malware",
                    "severity": "critical",
                    "status": "resolved",
                },
                {
                    "title": "Executive Impersonation Email Purporting to be Dean Requesting Gift Cards",
                    "description": "Department faculty received urgent emails claiming to originate from the College Dean requesting emergency Apple gift card purchases for a visiting guest speaker.",
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
        print("Database seeded with authentic campus threat data!")
        print(f"  Admin:   admin@signalsafe.edu / admin123")
        print(f"  Student: student@campus.edu / student123")
        print(f"  Faculty: faculty@campus.edu / faculty123")

    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
