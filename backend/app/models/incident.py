import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.database.session import Base


class IncidentReport(Base):
    """User-submitted incident report for cybersecurity events."""

    __tablename__ = "incident_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reporter_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    incident_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False, default="medium")
    status = Column(String(30), nullable=False, default="submitted")
    related_scan_id = Column(
        String(36), ForeignKey("scan_history.id"), nullable=True
    )
    assigned_to = Column(String(36), ForeignKey("users.id"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    reporter = relationship(
        "User", back_populates="reports", foreign_keys=[reporter_id]
    )
    assigned_admin = relationship("User", foreign_keys=[assigned_to])
    evidence = relationship(
        "ReportEvidence", back_populates="report", cascade="all, delete-orphan"
    )
    related_scan = relationship("ScanHistory", foreign_keys=[related_scan_id])
