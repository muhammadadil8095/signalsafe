"""Authentication API endpoints for registration, login, and token management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.user import (
    Token,
    TokenRefresh,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.auth_service import (
    authenticate_user,
    create_tokens,
    refresh_access_token,
    register_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    user = register_user(db, user_data)
    return user


@router.post("/login", response_model=dict)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate and receive JWT tokens."""
    user = authenticate_user(db, credentials.email, credentials.password)
    tokens = create_tokens(user)
    return {
        "access_token": tokens.access_token,
        "refresh_token": tokens.refresh_token,
        "token_type": tokens.token_type,
        "user": UserResponse.model_validate(user).model_dump(),
    }


@router.post("/refresh", response_model=Token)
def refresh_token(body: TokenRefresh, db: Session = Depends(get_db)):
    """Refresh an expired access token using a valid refresh token."""
    return refresh_access_token(db, body.refresh_token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Get the current authenticated user's profile."""
    return current_user

