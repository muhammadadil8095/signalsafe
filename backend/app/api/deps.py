"""FastAPI dependency injection functions for authentication and authorization."""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.database.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    """Extract and validate the current user from the JWT bearer token.

    Args:
        token: JWT access token extracted from the Authorization header.
        db: Database session dependency.

    Returns:
        The authenticated User ORM instance.

    Raises:
        HTTPException: 401 if the token is invalid or the user does not exist.
    """
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure the authenticated user account is active.

    Args:
        current_user: The authenticated user from get_current_user.

    Returns:
        The active User ORM instance.

    Raises:
        HTTPException: 403 if the user account is inactive.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return current_user


class RoleChecker:
    """Callable dependency that enforces role-based access control.

    Usage:
        allow_admin = RoleChecker(allowed_roles=["admin"])

        @router.get("/admin-only")
        def admin_endpoint(user: User = Depends(allow_admin)):
            ...
    """

    def __init__(self, allowed_roles: list[str]) -> None:
        self.allowed_roles = allowed_roles

    def __call__(
        self, user: User = Depends(get_current_active_user)
    ) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user


def require_role(allowed_roles: list[str]) -> RoleChecker:
    """Factory function to create a RoleChecker dependency.

    Args:
        allowed_roles: List of role strings that are permitted access.

    Returns:
        A RoleChecker callable dependency instance.
    """
    return RoleChecker(allowed_roles)
