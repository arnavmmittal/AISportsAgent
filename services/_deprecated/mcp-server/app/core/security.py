"""
Security utilities for authentication and authorization.
Handles JWT token verification from NextAuth and custom tokens.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
from jwt import PyJWTError
from passlib.context import CryptContext

from .config import settings
from .logging import get_logger

logger = get_logger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class SecurityError(Exception):
    """Custom exception for security-related errors."""
    pass


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.

    Args:
        plain_password: Plain text password
        hashed_password: Hashed password

    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password.

    Args:
        password: Plain text password

    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: Data to encode in the token
        expires_delta: Optional expiration time delta

    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

    return encoded_jwt


def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify and decode a JWT token.

    Args:
        token: JWT token to verify

    Returns:
        Decoded token payload

    Raises:
        SecurityError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        raise SecurityError("Token has expired")
    except PyJWTError as e:
        logger.warning(f"Token verification failed: {str(e)}")
        raise SecurityError(f"Invalid token: {str(e)}")


def verify_nextauth_token(token: str) -> Dict[str, Any]:
    """
    Verify a JWT token from NextAuth.

    NextAuth uses a different secret and may have different claims.

    Args:
        token: JWT token from NextAuth

    Returns:
        Decoded token payload

    Raises:
        SecurityError: If token is invalid or expired
    """
    try:
        # Use NEXTAUTH_SECRET if available, otherwise fall back to JWT_SECRET_KEY
        secret = settings.NEXTAUTH_SECRET or settings.JWT_SECRET_KEY

        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256", "RS256"],  # NextAuth may use RS256
            options={"verify_exp": True}
        )

        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("NextAuth token has expired")
        raise SecurityError("Token has expired")
    except PyJWTError as e:
        logger.warning(f"NextAuth token verification failed: {str(e)}")
        raise SecurityError(f"Invalid NextAuth token: {str(e)}")


def extract_user_id_from_token(token: str, from_nextauth: bool = True) -> Optional[str]:
    """
    Extract user ID from a JWT token.

    Args:
        token: JWT token
        from_nextauth: Whether token is from NextAuth (default: True)

    Returns:
        User ID if found, None otherwise
    """
    try:
        if from_nextauth:
            payload = verify_nextauth_token(token)
            # NextAuth typically uses 'sub' for user ID
            return payload.get("sub") or payload.get("userId")
        else:
            payload = verify_token(token)
            return payload.get("user_id") or payload.get("sub")
    except SecurityError:
        return None


def get_bearer_token(authorization: str) -> Optional[str]:
    """
    Extract bearer token from Authorization header.

    Args:
        authorization: Authorization header value (e.g., "Bearer <token>")

    Returns:
        Token if found, None otherwise
    """
    if not authorization:
        return None

    parts = authorization.split()

    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    return parts[1]


def validate_role(user_role: str, required_role: str) -> bool:
    """
    Validate if user has required role.

    Role hierarchy: ADMIN > COACH > ATHLETE

    Args:
        user_role: User's current role
        required_role: Required role for access

    Returns:
        True if user has sufficient permissions
    """
    role_hierarchy = {
        "ADMIN": 3,
        "COACH": 2,
        "ATHLETE": 1,
    }

    user_level = role_hierarchy.get(user_role.upper(), 0)
    required_level = role_hierarchy.get(required_role.upper(), 0)

    return user_level >= required_level
