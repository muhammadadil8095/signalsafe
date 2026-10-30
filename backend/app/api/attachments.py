"""Attachment analysis API endpoint."""

import os
import tempfile
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.core.config import settings
from app.database.session import get_db
from app.models.user import User
from app.models.scan import ScanHistory
from app.analyzers.attachment_analyzer import AttachmentAnalyzer

router = APIRouter(prefix="/analyze", tags=["Analysis"])


ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/html",
    "application/xhtml+xml",
}


@router.post("/attachment")
async def analyze_attachment(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Upload and analyze a PDF or HTML file for suspicious indicators."""
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}",
        )

    # Validate MIME type
    content_type = file.content_type or ""
    if content_type and content_type not in ALLOWED_MIME_TYPES:
        # Allow if extension is valid even if MIME is generic
        if content_type != "application/octet-stream":
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported content type '{content_type}'",
            )

    # Read file with size limit
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE // (1024*1024)} MB",
        )

    # Analyze
    analyzer = AttachmentAnalyzer()
    result = analyzer.analyze(content, file.filename, content_type or ext)

    # Persist as scan record
    scan = ScanHistory(
        id=str(uuid4()),
        user_id=str(current_user.id),
        scan_type="attachment",
        original_input=file.filename,
        risk_score=result["risk_score"],
        risk_level=result["risk_level"],
        prediction=result["risk_level"],
        ml_available=False,
        vt_available=False,
        signals=result["indicators"],
        explanation=result["explanation"],
        recommendations=result["recommendations"],
    )
    db.add(scan)
    db.commit()

    result["scan_id"] = str(scan.id)
    return result

