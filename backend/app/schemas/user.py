"""User-related Pydantic schemas for authentication and user management."""

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field
import email_validator

# Disable DNS MX lookup for offline / sandbox environments
email_validator.TEST_ENVIRONMENT = True


class UserCreate(BaseModel):
    """Schema for user registration requests."""

    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    """Schema for user login requests."""

    email: str
    password: str


class UserResponse(BaseModel):
    """Schema for user data returned in API responses."""

    id: Any
    email: str
    username: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """Schema for updating user profile information."""

    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class Token(BaseModel):
    """Schema for JWT token pair response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for decoded JWT token payload data."""

    sub: str
    role: str
    type: str


class TokenRefresh(BaseModel):
    """Schema for token refresh requests."""

    refresh_token: str
