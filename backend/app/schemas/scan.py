"""Scan-related Pydantic schemas for URL/QR/message threat analysis."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, HttpUrl, Field

from app.schemas.common import PaginatedResponse


class ScanURLRequest(BaseModel):
    """Schema for URL scan requests."""

    url: HttpUrl
    scan_type: str = Field(default="url")


class ThreatSignalResponse(BaseModel):
    """Schema for individual threat signal details."""

    signal_type: str
    description: str
    severity: str
    source: str

    model_config = {"from_attributes": True}


class ScanResponse(BaseModel):
    """Schema for complete scan result responses."""

    id: Any
    scan_type: str
    original_input: str
    normalized_url: Optional[str] = None
    domain: Optional[str] = None
    risk_score: float
    risk_level: str
    prediction: str
    ml_available: bool
    ml_prediction: Optional[str] = None
    ml_confidence: Optional[float] = None
    vt_available: bool
    vt_malicious: Optional[int] = None
    vt_suspicious: Optional[int] = None
    vt_undetected: Optional[int] = None
    signals: List[Dict[str, Any]] = []
    explanation: List[str] = []
    recommendations: List[str] = []
    threat_signals: List[ThreatSignalResponse] = []
    scanned_at: datetime

    model_config = {"from_attributes": True}


class ScanHistoryResponse(PaginatedResponse[ScanResponse]):
    """Paginated response for scan history listings."""

    pass
