"""Notification Pydantic schemas for user alert and notification management."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import PaginatedResponse


class NotificationResponse(BaseModel):
    """Schema for notification data in API responses."""

    id: UUID
    title: str
    message: str
    notification_type: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListResponse(PaginatedResponse[NotificationResponse]):
    """Paginated response for notification listings."""

    pass
