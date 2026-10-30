"""Incident report Pydantic schemas for campus security incident management."""

from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import PaginatedResponse
from app.schemas.user import UserResponse


class IncidentCreate(BaseModel):
    """Schema for creating a new incident report."""

    title: str = Field(..., min_length=5)
    description: str = Field(..., min_length=10)
    incident_type: str
    severity: str = Field(default="medium")
    related_scan_id: Optional[Any] = None


class EvidenceResponse(BaseModel):
    """Schema for evidence file metadata in API responses."""

    id: Any
    file_name: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class IncidentResponse(BaseModel):
    """Schema for complete incident report data in API responses."""

    id: Any
    reporter_id: Any
    title: str
    description: str
    incident_type: str
    severity: str
    status: str
    related_scan_id: Optional[Any] = None
    assigned_to: Optional[Any] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    reporter: Optional[UserResponse] = None
    evidence: List[EvidenceResponse] = []

    model_config = {"from_attributes": True}


class IncidentUpdate(BaseModel):
    """Schema for updating incident report fields (admin operations)."""

    status: Optional[str] = None
    severity: Optional[str] = None
    assigned_to: Optional[UUID] = None
    resolution_notes: Optional[str] = None


class IncidentListResponse(PaginatedResponse[IncidentResponse]):
    """Paginated response for incident report listings."""

    pass
