"""Common Pydantic schemas shared across the application."""

from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class MessageResponse(BaseModel):
    """Standard message response schema."""

    message: str
    detail: Optional[str] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response schema.

    Attributes:
        items: List of items for the current page.
        total: Total number of items across all pages.
        page: Current page number (1-indexed).
        size: Number of items per page.
        pages: Total number of pages.
    """

    items: List[T]
    total: int
    page: int
    size: int
    pages: int
