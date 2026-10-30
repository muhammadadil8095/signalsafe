"""Authentication service for user registration, login, and token management."""

from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.user import User
from app.schemas.user import Token, UserCreate


def register_user(db: Session, user_data: UserCreate) -> User:
    """Register a new user account.

    Validates that the email and username are not already taken, hashes the
    password, creates the User record, and commits it to the database.

    Args:
        db: Active database session.
        user_data: Validated user registration data.

    Returns:
        The newly created User ORM instance.

    Raises:
        HTTPException: 400 if the email or username is already registered.
    """
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    existing_username = (
        db.query(User).filter(User.username == user_data.username).first()
    )
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    hashed_password = get_password_hash(user_data.password)

    user = User(
        id=str(uuid4()),
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role="student",
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    """Authenticate a user by email and password.

    Args:
        db: Active database session.
        email: The user's email address.
        password: The plain-text password to verify.

    Returns:
        The authenticated User ORM instance.

    Raises:
        HTTPException: 401 if the email is not found or the password is wrong.
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )
    return user


def create_tokens(user: User) -> Token:
    """Generate an access/refresh JWT token pair for the given user.

    Args:
        user: The User ORM instance to create tokens for.

    Returns:
        A Token schema containing access_token, refresh_token, and token_type.
    """
    token_data = {"sub": str(user.id), "role": user.role}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


def refresh_access_token(db: Session, refresh_token: str) -> Token:
    """Validate a refresh token and issue a new token pair.

    Args:
        db: Active database session.
        refresh_token: The JWT refresh token to validate.

    Returns:
        A new Token schema with fresh access and refresh tokens.

    Raises:
        HTTPException: 401 if the refresh token is invalid, expired, or
            not of type "refresh", or if the associated user no longer exists.
    """
    payload = decode_token(refresh_token)

    token_type = payload.get("type")
    if token_type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type: expected refresh token",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    return create_tokens(user)
