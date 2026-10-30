"""Admin API endpoints for dashboard, user management, and audit logs."""

import math
from uuid import uuid4

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.database.session import get_db
from app.models.audit import AuditLog
from app.models.incident import IncidentReport
from app.models.scan import ScanHistory
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["Admin"])
admin_only = require_role(["admin"])


@router.get("/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    """Get admin dashboard statistics."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_scans = db.query(func.count(ScanHistory.id)).scalar() or 0
    malicious_scans = (
        db.query(func.count(ScanHistory.id))
        .filter(ScanHistory.risk_level == "malicious")
        .scalar() or 0
    )
    suspicious_scans = (
        db.query(func.count(ScanHistory.id))
        .filter(ScanHistory.risk_level == "suspicious")
        .scalar() or 0
    )
    open_reports = (
        db.query(func.count(IncidentReport.id))
        .filter(IncidentReport.status.in_(["submitted", "under_review", "investigating"]))
        .scalar() or 0
    )
    total_reports = db.query(func.count(IncidentReport.id)).scalar() or 0

    # Threat category distribution
    category_counts = (
        db.query(ScanHistory.risk_level, func.count(ScanHistory.id))
        .group_by(ScanHistory.risk_level)
        .all()
    )
    threat_distribution = {level: count for level, count in category_counts}

    # Scan type distribution
    type_counts = (
        db.query(ScanHistory.scan_type, func.count(ScanHistory.id))
        .group_by(ScanHistory.scan_type)
        .all()
    )
    scan_types = {stype: count for stype, count in type_counts}

    # Recent incidents
    recent_incidents = (
        db.query(IncidentReport)
        .order_by(IncidentReport.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "total_users": total_users,
        "total_scans": total_scans,
        "malicious_detections": malicious_scans,
        "suspicious_detections": suspicious_scans,
        "open_reports": open_reports,
        "total_reports": total_reports,
        "threat_distribution": threat_distribution,
        "scan_types": scan_types,
        "recent_incidents": [
            {
                "id": str(r.id),
                "title": r.title,
                "severity": r.severity,
                "status": r.status,
                "incident_type": r.incident_type,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in recent_incidents
        ],
    }


@router.get("/users")
def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query("", max_length=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    """List all users with pagination and search."""
    query = db.query(User)
    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%"))
            | (User.username.ilike(f"%{search}%"))
            | (User.full_name.ilike(f"%{search}%"))
        )

    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    offset = (page - 1) * size
    items = query.order_by(User.created_at.desc()).offset(offset).limit(size).all()

    return {
        "items": [
            {
                "id": str(u.id),
                "email": u.email,
                "username": u.username,
                "full_name": u.full_name,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in items
        ],
        "total": total,
        "page": page,
        "size": size,
        "pages": pages,
    }


@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    role: str = Query(..., pattern="^(student|faculty|admin)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    """Update a user's role (admin only)."""
    from fastapi import HTTPException, status

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    old_role = user.role
    user.role = role
    db.commit()

    audit = AuditLog(
        id=str(uuid4()),
        user_id=str(current_user.id),
        action="update_user_role",
        resource_type="user",
        resource_id=user_id,
        details={"old_role": old_role, "new_role": role},
    )
    db.add(audit)
    db.commit()

    return {"message": f"User role updated to {role}", "user_id": user_id}


@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    is_active: bool = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    """Activate or deactivate a user account (admin only)."""
    from fastapi import HTTPException, status

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = is_active
    db.commit()

    audit = AuditLog(
        id=str(uuid4()),
        user_id=str(current_user.id),
        action="update_user_status",
        resource_type="user",
        resource_id=user_id,
        details={"is_active": is_active},
    )
    db.add(audit)
    db.commit()

    status_text = "activated" if is_active else "deactivated"
    return {"message": f"User {status_text}", "user_id": user_id}


@router.get("/audit-logs")
def list_audit_logs(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only),
):
    """List audit logs with pagination."""
    query = db.query(AuditLog)
    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    offset = (page - 1) * size
    items = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(size).all()

    return {
        "items": [
            {
                "id": str(a.id),
                "user_id": str(a.user_id),
                "action": a.action,
                "resource_type": a.resource_type,
                "resource_id": a.resource_id,
                "details": a.details,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in items
        ],
        "total": total,
        "page": page,
        "size": size,
        "pages": pages,
    }

