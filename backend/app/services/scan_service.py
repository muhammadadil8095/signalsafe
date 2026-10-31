"""Scan orchestration service for URL threat analysis.

Coordinates heuristic analysis, ML prediction, and VirusTotal lookups
to produce a comprehensive threat assessment for submitted URLs.
"""

import logging
import math
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.scan import ScanHistory
from app.models.threat_signal import ThreatSignal

logger = logging.getLogger(__name__)


def _normalize_url(url: str) -> str:
    """Normalize a URL by ensuring it has a scheme and stripping fragments.

    Args:
        url: The raw URL string to normalize.

    Returns:
        The normalized URL string.
    """
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    parsed = urlparse(url)
    normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
    if parsed.query:
        normalized += f"?{parsed.query}"
    return normalized.rstrip("/")


def _extract_domain(url: str) -> str:
    """Extract the registered domain from a URL using tldextract (offline snapshot)."""
    try:
        import tldextract

        extractor = tldextract.TLDExtract(suffix_list_urls=())
        extracted = extractor(url)
        if extracted.suffix:
            domain = f"{extracted.domain}.{extracted.suffix}"
        else:
            domain = extracted.domain
        return domain
    except Exception:
        logger.warning("tldextract not available, falling back to urlparse")
        parsed = urlparse(url)
        return parsed.netloc.split(":")[0]


def _compute_risk_level(score: float) -> str:
    """Map a numeric risk score to a categorical risk level.

    Args:
        score: Risk score between 0 and 100.

    Returns:
        Risk level string: 'safe', 'suspicious', or 'malicious'.
    """
    if score < 25:
        return "safe"
    elif score <= 60:
        return "suspicious"
    else:
        return "malicious"


def _generate_explanations(signals: List[Dict[str, Any]]) -> List[str]:
    """Generate human-readable explanations from detected threat signals.

    Args:
        signals: List of signal dictionaries with 'description' keys.

    Returns:
        List of explanation strings describing each detected signal.
    """
    explanations: List[str] = []
    if not signals:
        explanations.append("No threat signals were detected for this URL.")
        return explanations

    for signal in signals:
        description = signal.get("description", "Unknown signal detected")
        severity = signal.get("severity", "low")
        source = signal.get("source", "heuristic")
        explanations.append(
            f"[{severity.upper()}] {description} (source: {source})"
        )

    return explanations


def _generate_recommendations(
    risk_level: str, signals: List[Dict[str, Any]]
) -> List[str]:
    """Generate actionable security recommendations based on the risk assessment.

    Args:
        risk_level: The computed risk level ('safe', 'suspicious', 'malicious').
        signals: List of detected signal dictionaries.

    Returns:
        List of recommendation strings.
    """
    recommendations: List[str] = []

    if risk_level == "safe":
        recommendations.append(
            "This URL appears safe. Always remain cautious with unfamiliar links."
        )
        recommendations.append(
            "Verify the sender if this link was received via email or message."
        )

    elif risk_level == "suspicious":
        recommendations.append(
            "Exercise caution — this URL shows some suspicious characteristics."
        )
        recommendations.append(
            "Do not enter personal information or credentials on this site."
        )
        recommendations.append(
            "Verify the URL with the official source before proceeding."
        )
        recommendations.append(
            "Report this URL to your campus IT security team if unsure."
        )

    elif risk_level == "malicious":
        recommendations.append(
            "WARNING: This URL is flagged as malicious. Do NOT visit this site."
        )
        recommendations.append(
            "If you have already visited, change any passwords you may have entered."
        )
        recommendations.append(
            "Report this URL immediately to campus IT security."
        )
        recommendations.append(
            "Run a malware scan on your device if you interacted with this site."
        )

    # Add signal-specific recommendations
    signal_types = {s.get("signal_type", "") for s in signals}
    if "ip_address_url" in signal_types:
        recommendations.append(
            "The URL uses an IP address instead of a domain — a common phishing tactic."
        )
    if "suspicious_tld" in signal_types:
        recommendations.append(
            "The domain uses an unusual top-level domain often associated with phishing."
        )
    if "excessive_subdomains" in signal_types:
        recommendations.append(
            "The URL contains excessive subdomains, which may be used to impersonate legitimate sites."
        )
    if "urlhaus_malicious" in signal_types:
        recommendations.append(
            "CRITICAL: This address is verified in the abuse.ch URLhaus malware database. Do NOT visit."
        )

    return recommendations


def create_url_scan(db: Session, user_id: UUID, url: str) -> ScanHistory:
    """Orchestrate a complete URL threat analysis scan.

    Performs heuristic analysis, attempts ML prediction and VirusTotal lookup
    (with graceful fallbacks), combines all signals into a final risk assessment,
    and persists the results to the database.

    Args:
        db: Active database session.
        user_id: UUID of the user requesting the scan.
        url: The URL string to analyze.

    Returns:
        The created ScanHistory ORM instance with related ThreatSignal records.
    """
    # Step 1: Normalize URL and extract domain
    normalized_url = _normalize_url(url)
    domain = _extract_domain(normalized_url)

    # Step 2: Run heuristic URL analysis
    all_signals: List[Dict[str, Any]] = []
    try:
        from app.analyzers.url_analyzer import URLAnalyzer

        analyzer = URLAnalyzer()
        heuristic_signals = analyzer.analyze(normalized_url)
        all_signals.extend(heuristic_signals)
    except ImportError:
        logger.warning("URLAnalyzer not available, skipping heuristic analysis")
    except Exception as e:
        logger.error(f"Heuristic analysis failed: {e}")

    # Step 3: Try ML prediction (graceful fallback)
    ml_available = False
    ml_prediction: Optional[str] = None
    ml_confidence: Optional[float] = None
    try:
        from app.ml.predictor import MLPredictor

        predictor = MLPredictor()
        ml_result = predictor.predict(normalized_url)
        ml_available = True
        ml_prediction = ml_result.get("prediction", "unknown")
        ml_confidence = ml_result.get("confidence")
        if ml_confidence is not None:
            ml_confidence = round(float(ml_confidence), 4)

        if ml_prediction in ("phishing", "malicious"):
            all_signals.append({
                "signal_type": "ml_phishing_detected",
                "description": f"AI Phishing Classifier flagged this URL with {(ml_confidence or 0) * 100:.1f}% confidence",
                "severity": "critical" if (ml_confidence or 0) > 0.85 else "high",
                "source": "ml",
            })
    except ImportError:
        logger.info("MLPredictor not available, ML prediction disabled")
    except Exception as e:
        logger.warning(f"ML prediction failed (non-critical): {e}")

    # Step 3.5: Try URLhaus threat intel lookup (abuse.ch verified malware database)
    urlhaus_detected = False
    urlhaus_reference: Optional[str] = None
    try:
        from app.services.urlhaus_service import URLhausService

        uh_service = URLhausService()
        if uh_service.is_enabled:
            uh_result = uh_service.lookup_url(url)
            if not uh_result and normalized_url != url:
                uh_result = uh_service.lookup_url(normalized_url)

            if uh_result and uh_result.get("detected"):
                urlhaus_detected = True
                urlhaus_reference = uh_result.get("reference")
                threat_desc = uh_result.get("details") or f"URLhaus: Active malware payload detected ({uh_result.get('threat', 'malware')})"
                all_signals.append(
                    {
                        "signal_type": "urlhaus_malicious",
                        "description": threat_desc,
                        "severity": "critical",
                        "source": "urlhaus",
                    }
                )
    except ImportError:
        logger.info("URLhausService not available, skipping URLhaus check")
    except Exception as e:
        logger.warning(f"URLhaus threat lookup failed (non-critical): {e}")

    # Step 4: Try VirusTotal lookup (if enabled, graceful fallback)
    vt_available = False
    vt_malicious: Optional[int] = None
    vt_suspicious: Optional[int] = None
    vt_undetected: Optional[int] = None
    try:
        if settings.VT_ENABLED and settings.VT_API_KEY:
            from app.services.virustotal_service import VirusTotalService

            vt_service = VirusTotalService()
            vt_result = vt_service.lookup_url(normalized_url)
            if vt_result:
                vt_available = True
                vt_malicious = vt_result.get("malicious", 0)
                vt_suspicious = vt_result.get("suspicious", 0)
                vt_undetected = vt_result.get("undetected", 0)

                # Add VT signals if malicious/suspicious detections found
                if vt_malicious and vt_malicious > 0:
                    all_signals.append(
                        {
                            "signal_type": "virustotal_malicious",
                            "description": f"VirusTotal: {vt_malicious} engines flagged this URL as malicious",
                            "severity": "critical" if vt_malicious >= 5 else "high",
                            "source": "virustotal",
                        }
                    )
                if vt_suspicious and vt_suspicious > 0:
                    all_signals.append(
                        {
                            "signal_type": "virustotal_suspicious",
                            "description": f"VirusTotal: {vt_suspicious} engines flagged this URL as suspicious",
                            "severity": "medium",
                            "source": "virustotal",
                        }
                    )
    except ImportError:
        logger.info("VirusTotalService not available, VT lookup disabled")
    except Exception as e:
        logger.warning(f"VirusTotal lookup failed (non-critical): {e}")

    # Step 5: Compute final risk score
    risk_score = 0.0
    severity_weights = {
        "low": 10.0,
        "medium": 25.0,
        "high": 45.0,
        "critical": 70.0,
    }
    for signal in all_signals:
        severity = signal.get("severity", "low")
        weight = severity_weights.get(severity, 10.0)
        # Reduce weightage given to long URLs by 80% (retain 20%)
        if signal.get("signal_type") in ("long_url", "abnormal_url_length"):
            weight *= 0.2
        risk_score += weight

    # Factor in ML confidence if available
    if ml_available and ml_prediction in ("phishing", "malicious") and ml_confidence is not None:
        risk_score += ml_confidence * 50.0
    elif ml_available and ml_prediction == "suspicious" and ml_confidence is not None:
        risk_score += ml_confidence * 25.0

    # Definite threat override if verified in abuse.ch URLhaus malware database
    if urlhaus_detected:
        risk_score = max(risk_score, 90.0)

    # Cap the score at 100
    risk_score = min(round(risk_score, 2), 100.0)

    # Step 6: Determine risk level and prediction
    risk_level = _compute_risk_level(risk_score)
    prediction = risk_level

    # Step 7: Generate explanations and recommendations
    explanations = _generate_explanations(all_signals)
    recommendations = _generate_recommendations(risk_level, all_signals)

    # Step 8: Save ScanHistory to the database
    scan_id = str(uuid4())
    scan = ScanHistory(
        id=scan_id,
        user_id=str(user_id),
        scan_type="url",
        original_input=url,
        normalized_url=normalized_url,
        domain=domain,
        risk_score=risk_score,
        risk_level=risk_level,
        prediction=prediction,
        ml_available=ml_available,
        ml_prediction=ml_prediction,
        ml_confidence=ml_confidence,
        vt_available=vt_available,
        vt_malicious=vt_malicious,
        vt_suspicious=vt_suspicious,
        vt_undetected=vt_undetected,
        urlhaus_detected=urlhaus_detected,
        urlhaus_reference=urlhaus_reference,
        signals=all_signals,
        explanation=explanations,
        recommendations=recommendations,
    )
    db.add(scan)

    # Step 9: Create ThreatSignal records for each detected signal
    for signal_data in all_signals:
        threat_signal = ThreatSignal(
            id=str(uuid4()),
            scan_id=scan_id,
            signal_type=signal_data.get("signal_type", "unknown"),
            description=signal_data.get("description", ""),
            severity=signal_data.get("severity", "low"),
            source=signal_data.get("source", "heuristic"),
        )
        db.add(threat_signal)

    db.commit()
    db.refresh(scan)
    return scan


def get_scan_by_id(
    db: Session, scan_id: UUID, user_id: UUID
) -> ScanHistory:
    """Retrieve a specific scan record by its ID.

    Args:
        db: Active database session.
        scan_id: UUID of the scan to retrieve.
        user_id: UUID of the requesting user (for ownership verification).

    Returns:
        The ScanHistory ORM instance.

    Raises:
        HTTPException: 404 if the scan is not found or does not belong to the user.
    """
    from fastapi import HTTPException, status

    scan = (
        db.query(ScanHistory)
        .filter(ScanHistory.id == scan_id, ScanHistory.user_id == user_id)
        .first()
    )
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan not found",
        )
    return scan


def get_user_scans(
    db: Session, user_id: UUID, page: int = 1, size: int = 20
) -> dict:
    """Retrieve paginated scan history for a user.

    Args:
        db: Active database session.
        user_id: UUID of the user whose scans to retrieve.
        page: Page number (1-indexed).
        size: Number of items per page.

    Returns:
        Dictionary with 'items', 'total', 'page', 'size', and 'pages' keys.
    """
    query = db.query(ScanHistory).filter(ScanHistory.user_id == user_id)
    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    offset = (page - 1) * size
    items = (
        query.order_by(ScanHistory.scanned_at.desc())
        .offset(offset)
        .limit(size)
        .all()
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages,
    }
