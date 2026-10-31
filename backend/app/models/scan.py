import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship

from app.database.session import Base


class ScanHistory(Base):
    """Record of URL/QR/message/attachment scans performed by users."""

    __tablename__ = "scan_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    scan_type = Column(String(20), nullable=False)
    original_input = Column(Text, nullable=False)
    normalized_url = Column(String(2048), nullable=True)
    domain = Column(String(255), nullable=True)
    risk_score = Column(Float, nullable=False, default=0.0)
    risk_level = Column(String(20), nullable=False, default="inconclusive")
    prediction = Column(String(50), nullable=True)
    ml_available = Column(Boolean, nullable=False, default=False)
    ml_prediction = Column(String(50), nullable=True)
    ml_confidence = Column(Float, nullable=True)
    vt_available = Column(Boolean, nullable=False, default=False)
    vt_malicious = Column(Integer, nullable=False, default=0)
    vt_suspicious = Column(Integer, nullable=False, default=0)
    vt_undetected = Column(Integer, nullable=False, default=0)
    urlhaus_detected = Column(Boolean, nullable=False, default=False)
    urlhaus_reference = Column(String(512), nullable=True)
    signals = Column(JSON, nullable=True)
    explanation = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    scanned_at = Column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = relationship("User", back_populates="scans")
    threat_signals = relationship(
        "ThreatSignal", back_populates="scan", cascade="all, delete-orphan"
    )
