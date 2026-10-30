"""Incident report API endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, require_role
from app.database.session import get_db
from app.models.user import User
from app.schemas.incident import IncidentCreate, IncidentResponse, IncidentUpdate

router = APIRouter(prefix="/reports", tags=["Incident Reports"])


@router.post("/", response_model=IncidentResponse, status_code=201)
def create_report(
    data: IncidentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Submit a new incident report."""
    from app.services.report_service import create_report as _create
    return _create(db, current_user.id, data)


@router.get("/")
def list_reports(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List incident reports. Users see their own; admins see all."""
    from app.services.report_service import list_reports as _list
    return _list(db, current_user.id, current_user.role, page, size)


@router.get("/{report_id}", response_model=IncidentResponse)
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get details of a specific incident report."""
    from app.services.report_service import get_report as _get
    return _get(db, report_id, current_user.id, current_user.role)


@router.put("/{report_id}/status", response_model=IncidentResponse)
def update_status(
    report_id: str,
    update_data: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
):
    """Update incident report status (admin only)."""
    from app.services.report_service import update_report_status
    from app.models.audit import AuditLog
    from uuid import uuid4

    report = update_report_status(db, report_id, update_data)

    audit = AuditLog(
        id=str(uuid4()),
        user_id=str(current_user.id),
        action="update_report_status",
        resource_type="incident_report",
        resource_id=report_id,
        details={"new_status": update_data.status, "notes": update_data.resolution_notes},
    )
    db.add(audit)
    db.commit()
    return report

