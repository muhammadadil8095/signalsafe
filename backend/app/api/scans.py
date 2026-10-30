"""Scan API endpoints for URL threat analysis and scan history."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.scan import ScanResponse, ScanURLRequest
from app.services.scan_service import create_url_scan, get_scan_by_id, get_user_scans

router = APIRouter(prefix="/scans", tags=["Scans"])


@router.post("/url", response_model=ScanResponse, status_code=201)
def scan_url(
    request: ScanURLRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Submit a URL for comprehensive threat analysis."""
    scan = create_url_scan(db, current_user.id, str(request.url))
    return scan


@router.get("/history")
def get_scan_history(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get the current user's scan history with pagination."""
    return get_user_scans(db, current_user.id, page, size)


@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get details of a specific scan by ID."""
    return get_scan_by_id(db, scan_id, current_user.id)

