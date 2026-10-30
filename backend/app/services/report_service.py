"""Incident report service for creating, viewing, and managing security reports."""

import math
from typing import Optional
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.incident import IncidentReport
from app.models.evidence import ReportEvidence
from app.schemas.incident import IncidentCreate, IncidentUpdate


def create_report(
    db: Session, user_id: UUID, data: IncidentCreate
) -> IncidentReport:
    """Create a new incident report.

    Args:
        db: Active database session.
        user_id: UUID of the user filing the report.
        data: Validated incident creation data.

    Returns:
        The newly created IncidentReport ORM instance.
    """
    report = IncidentReport(
        id=str(uuid4()),
        reporter_id=str(user_id),
        title=data.title,
        description=data.description,
        incident_type=data.incident_type,
        severity=data.severity,
        status="submitted",
        related_scan_id=str(data.related_scan_id) if data.related_scan_id else None,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_report(
    db: Session, report_id: UUID, user_id: UUID, user_role: str
) -> IncidentReport:
    """Retrieve a single incident report by ID.

    Regular users can only view their own reports; admins can view any report.

    Args:
        db: Active database session.
        report_id: UUID of the report to retrieve.
        user_id: UUID of the requesting user.
        user_role: Role string of the requesting user.

    Returns:
        The IncidentReport ORM instance.

    Raises:
        HTTPException: 404 if the report is not found.
        HTTPException: 403 if a non-admin user tries to access another user's report.
    """
    report = db.query(IncidentReport).filter(IncidentReport.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident report not found",
        )
    if user_role != "admin" and report.reporter_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this report",
        )
    return report


def list_reports(
    db: Session,
    user_id: UUID,
    user_role: str,
    page: int = 1,
    size: int = 20,
) -> dict:
    """List incident reports with pagination.

    Regular users see only their own reports; admins see all reports.

    Args:
        db: Active database session.
        user_id: UUID of the requesting user.
        user_role: Role string of the requesting user.
        page: Page number (1-indexed).
        size: Number of items per page.

    Returns:
        Dictionary with 'items', 'total', 'page', 'size', and 'pages' keys.
    """
    query = db.query(IncidentReport)
    if user_role != "admin":
        query = query.filter(IncidentReport.reporter_id == user_id)

    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    offset = (page - 1) * size
    items = (
        query.order_by(IncidentReport.created_at.desc())
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


def update_report_status(
    db: Session, report_id: UUID, update_data: IncidentUpdate
) -> IncidentReport:
    """Update the status and metadata of an incident report (admin only).

    Only non-None fields in update_data are applied.

    Args:
        db: Active database session.
        report_id: UUID of the report to update.
        update_data: Validated update data with optional fields.

    Returns:
        The updated IncidentReport ORM instance.

    Raises:
        HTTPException: 404 if the report is not found.
    """
    report = db.query(IncidentReport).filter(IncidentReport.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident report not found",
        )

    if update_data.status is not None:
        report.status = update_data.status
    if update_data.severity is not None:
        report.severity = update_data.severity
    if update_data.assigned_to is not None:
        report.assigned_to = update_data.assigned_to
    if update_data.resolution_notes is not None:
        report.resolution_notes = update_data.resolution_notes

    db.commit()
    db.refresh(report)
    return report


def add_evidence(
    db: Session,
    report_id: UUID,
    file_name: str,
    file_path: str,
    file_type: str,
    file_size: int,
) -> ReportEvidence:
    """Attach an evidence file to an incident report.

    Args:
        db: Active database session.
        report_id: UUID of the report to attach evidence to.
        file_name: Original name of the uploaded file.
        file_path: Server-side storage path of the file.
        file_type: MIME type of the file.
        file_size: Size of the file in bytes.

    Returns:
        The newly created ReportEvidence ORM instance.

    Raises:
        HTTPException: 404 if the parent report is not found.
    """
    report = db.query(IncidentReport).filter(IncidentReport.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident report not found",
        )

    evidence = ReportEvidence(
        id=str(uuid4()),
        report_id=str(report_id),
        file_name=file_name,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return evidence
