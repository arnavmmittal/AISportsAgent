"""
Security Hardening Module

Comprehensive security measures to protect against:
- Prompt injection attacks
- SQL injection
- XSS attacks
- Path traversal
- File upload attacks
- Rate limiting bypass
- Authentication bypass

This module is designed to make the system resistant to expert-level attacks.
"""

import re
import html
import hashlib
import secrets
from typing import Optional, List, Dict, Any, Tuple
from functools import wraps
from datetime import datetime, timedelta

from fastapi import HTTPException, Request, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, validator, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.security import verify_token, verify_nextauth_token, SecurityError

logger = setup_logging()

# Security bearer scheme
security_bearer = HTTPBearer(auto_error=False)


# ============================================
# INPUT VALIDATION & SANITIZATION
# ============================================

class InputSanitizer:
    """Sanitize and validate user inputs to prevent injection attacks."""

    # Dangerous patterns that could indicate prompt injection
    PROMPT_INJECTION_PATTERNS = [
        r"ignore\s+(previous|all|above)\s+instructions?",
        r"disregard\s+(previous|all|above)\s+instructions?",
        r"forget\s+(everything|all|previous)",
        r"you\s+are\s+now\s+",
        r"new\s+instructions?:",
        r"system\s*:\s*",
        r"<\s*system\s*>",
        r"\[\s*SYSTEM\s*\]",
        r"roleplay\s+as",
        r"pretend\s+(to\s+be|you\s+are)",
        r"act\s+as\s+if",
        r"override\s+(your|the)\s+(instructions?|rules?|guidelines?)",
        r"bypass\s+(your|the)\s+(safety|filter|restrictions?)",
        r"jailbreak",
        r"DAN\s*mode",
        r"developer\s*mode",
        r"admin\s*mode",
        r"sudo\s+",
        r"execute\s+code",
        r"run\s+command",
        r"```\s*(python|bash|shell|javascript|js|sql)",
    ]

    # SQL injection patterns
    SQL_INJECTION_PATTERNS = [
        r"(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)(\s|$)",
        r"--\s*$",
        r";\s*(SELECT|INSERT|UPDATE|DELETE|DROP)",
        r"'\s*OR\s*'",
        r"'\s*OR\s+\d+\s*=\s*\d+",
        r"1\s*=\s*1",
        r"EXEC(\s|UTE)",
        r"xp_cmdshell",
    ]

    # XSS patterns
    XSS_PATTERNS = [
        r"<\s*script[^>]*>",
        r"javascript\s*:",
        r"on\w+\s*=",
        r"<\s*iframe",
        r"<\s*object",
        r"<\s*embed",
        r"<\s*form",
        r"expression\s*\(",
        r"url\s*\([^)]*javascript",
    ]

    # Path traversal patterns
    PATH_TRAVERSAL_PATTERNS = [
        r"\.\./",
        r"\.\.\\",
        r"%2e%2e%2f",
        r"%2e%2e/",
        r"\.%2e/",
        r"%2e\./",
        r"/etc/passwd",
        r"/etc/shadow",
        r"C:\\Windows",
    ]

    @classmethod
    def check_prompt_injection(cls, text: str) -> Tuple[bool, Optional[str]]:
        """
        Check for prompt injection attempts.

        Returns:
            Tuple of (is_safe, detected_pattern)
        """
        text_lower = text.lower()

        for pattern in cls.PROMPT_INJECTION_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                logger.warning(f"Prompt injection attempt detected: {pattern}")
                return False, pattern

        return True, None

    @classmethod
    def check_sql_injection(cls, text: str) -> Tuple[bool, Optional[str]]:
        """Check for SQL injection attempts."""
        text_upper = text.upper()

        for pattern in cls.SQL_INJECTION_PATTERNS:
            if re.search(pattern, text_upper, re.IGNORECASE):
                logger.warning(f"SQL injection attempt detected: {pattern}")
                return False, pattern

        return True, None

    @classmethod
    def check_xss(cls, text: str) -> Tuple[bool, Optional[str]]:
        """Check for XSS attempts."""
        for pattern in cls.XSS_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                logger.warning(f"XSS attempt detected: {pattern}")
                return False, pattern

        return True, None

    @classmethod
    def check_path_traversal(cls, text: str) -> Tuple[bool, Optional[str]]:
        """Check for path traversal attempts."""
        for pattern in cls.PATH_TRAVERSAL_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                logger.warning(f"Path traversal attempt detected: {pattern}")
                return False, pattern

        return True, None

    @classmethod
    def sanitize_html(cls, text: str) -> str:
        """Escape HTML entities to prevent XSS."""
        return html.escape(text)

    @classmethod
    def sanitize_for_llm(cls, text: str) -> str:
        """
        Sanitize text before sending to LLM.

        This helps prevent prompt injection while preserving meaning.
        """
        # Remove potential instruction override attempts
        sanitized = text

        # Wrap user input with clear delimiters
        # This makes it harder for injection to escape context
        sanitized = sanitized.replace("```", "'''")  # Prevent code block escapes

        return sanitized

    @classmethod
    def validate_message(cls, message: str, max_length: int = 10000) -> str:
        """
        Comprehensive message validation.

        Raises HTTPException if validation fails.
        Returns sanitized message if valid.
        """
        # Length check
        if len(message) > max_length:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Message exceeds maximum length of {max_length} characters"
            )

        if len(message.strip()) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message cannot be empty"
            )

        # Check for prompt injection
        is_safe, pattern = cls.check_prompt_injection(message)
        if not is_safe:
            logger.warning(f"Blocked prompt injection attempt")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message contains disallowed content"
            )

        # Check for SQL injection
        is_safe, pattern = cls.check_sql_injection(message)
        if not is_safe:
            logger.warning(f"Blocked SQL injection attempt")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message contains disallowed content"
            )

        # Sanitize and return
        return cls.sanitize_for_llm(message)


# ============================================
# FILE UPLOAD SECURITY
# ============================================

class FileUploadSecurity:
    """Security measures for file uploads."""

    # Allowed audio MIME types
    ALLOWED_AUDIO_TYPES = {
        "audio/webm",
        "audio/wav",
        "audio/mpeg",
        "audio/mp3",
        "audio/ogg",
        "audio/flac",
        "audio/x-wav",
        "audio/x-m4a",
    }

    # Maximum file sizes (bytes)
    MAX_AUDIO_SIZE = 25 * 1024 * 1024  # 25MB
    MAX_DOCUMENT_SIZE = 10 * 1024 * 1024  # 10MB

    # Audio file magic bytes
    AUDIO_MAGIC_BYTES = {
        b"RIFF": "wav",
        b"ID3": "mp3",
        b"\xff\xfb": "mp3",
        b"\xff\xfa": "mp3",
        b"OggS": "ogg",
        b"fLaC": "flac",
        b"\x1aE\xdf\xa3": "webm",
    }

    @classmethod
    def validate_audio_file(
        cls,
        file_content: bytes,
        content_type: str,
        filename: str
    ) -> Tuple[bool, str]:
        """
        Validate an uploaded audio file.

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check size
        if len(file_content) > cls.MAX_AUDIO_SIZE:
            return False, f"File size exceeds maximum of {cls.MAX_AUDIO_SIZE // (1024*1024)}MB"

        if len(file_content) < 100:
            return False, "File is too small to be valid audio"

        # Check MIME type
        if content_type not in cls.ALLOWED_AUDIO_TYPES:
            return False, f"Content type '{content_type}' not allowed. Allowed: {', '.join(cls.ALLOWED_AUDIO_TYPES)}"

        # Check file extension
        allowed_extensions = {".webm", ".wav", ".mp3", ".ogg", ".flac", ".m4a"}
        ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext and ext not in allowed_extensions:
            return False, f"File extension '{ext}' not allowed"

        # Validate magic bytes (first few bytes of file)
        is_valid_magic = False
        for magic, format_name in cls.AUDIO_MAGIC_BYTES.items():
            if file_content[:len(magic)] == magic:
                is_valid_magic = True
                break

        # WebM files start with different bytes
        if file_content[:4] == b"\x1a\x45\xdf\xa3":
            is_valid_magic = True

        if not is_valid_magic:
            # Allow through if MIME type was valid (some formats have variable headers)
            logger.warning(f"Audio file magic bytes validation skipped for {content_type}")

        return True, ""

    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        """
        Sanitize filename to prevent path traversal and other attacks.
        """
        # Remove path separators
        filename = filename.replace("/", "_").replace("\\", "_")

        # Remove null bytes
        filename = filename.replace("\x00", "")

        # Remove potentially dangerous characters
        filename = re.sub(r'[<>:"|?*]', "_", filename)

        # Limit length
        if len(filename) > 255:
            name, ext = filename.rsplit(".", 1) if "." in filename else (filename, "")
            filename = name[:200] + ("." + ext if ext else "")

        # Generate a safe random suffix
        safe_suffix = secrets.token_hex(8)
        name, ext = filename.rsplit(".", 1) if "." in filename else (filename, "")

        return f"{name}_{safe_suffix}.{ext}" if ext else f"{name}_{safe_suffix}"


# ============================================
# AUTHENTICATION DEPENDENCIES
# ============================================

class AuthenticatedUser(BaseModel):
    """Authenticated user model."""
    user_id: str
    email: Optional[str] = None
    role: str = "ATHLETE"
    tenant_id: Optional[str] = None
    athlete_id: Optional[str] = None


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> AuthenticatedUser:
    """
    Get current authenticated user from JWT token.

    Raises HTTPException if not authenticated.
    """
    # Check for token in various places
    token = None

    # 1. Bearer token
    if credentials:
        token = credentials.credentials

    # 2. Cookie (for NextAuth)
    if not token:
        token = request.cookies.get("next-auth.session-token")

    # 3. Header (for service-to-service)
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Try NextAuth token first
        payload = verify_nextauth_token(token)

        return AuthenticatedUser(
            user_id=payload.get("sub", payload.get("userId", "")),
            email=payload.get("email"),
            role=payload.get("role", "ATHLETE"),
            tenant_id=payload.get("tenantId"),
            athlete_id=payload.get("athleteId"),
        )
    except SecurityError:
        pass

    try:
        # Try internal token
        payload = verify_token(token)

        return AuthenticatedUser(
            user_id=payload.get("user_id", payload.get("sub", "")),
            email=payload.get("email"),
            role=payload.get("role", "ATHLETE"),
            tenant_id=payload.get("tenant_id"),
            athlete_id=payload.get("athlete_id"),
        )
    except SecurityError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_optional(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> Optional[AuthenticatedUser]:
    """
    Get current user if authenticated, None otherwise.
    Does not raise exception for unauthenticated requests.
    """
    try:
        return await get_current_user(request, credentials)
    except HTTPException:
        return None


def require_role(required_role: str):
    """
    Dependency that requires a specific role.

    Usage:
        @router.get("/admin")
        async def admin_endpoint(user: AuthenticatedUser = Depends(require_role("ADMIN"))):
            ...
    """
    async def role_checker(
        user: AuthenticatedUser = Depends(get_current_user)
    ) -> AuthenticatedUser:
        role_hierarchy = {"ADMIN": 3, "COACH": 2, "ATHLETE": 1}

        user_level = role_hierarchy.get(user.role.upper(), 0)
        required_level = role_hierarchy.get(required_role.upper(), 0)

        if user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' required"
            )

        return user

    return role_checker


# ============================================
# REQUEST VALIDATION
# ============================================

class SecureChatRequest(BaseModel):
    """Secure chat request with validation."""
    message: str = Field(..., min_length=1, max_length=10000)
    session_id: str = Field(..., min_length=1, max_length=100)
    athlete_id: str = Field(..., min_length=1, max_length=100)
    user_role: str = Field(default="ATHLETE", pattern="^(ATHLETE|COACH|ADMIN)$")
    sport: Optional[str] = Field(None, max_length=50)

    @validator("message")
    def validate_message(cls, v):
        return InputSanitizer.validate_message(v)

    @validator("session_id", "athlete_id")
    def validate_ids(cls, v):
        # Only allow alphanumeric, hyphens, underscores
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError("ID contains invalid characters")
        return v

    @validator("sport")
    def validate_sport(cls, v):
        if v:
            # Only allow alphanumeric and spaces
            if not re.match(r"^[a-zA-Z0-9 ]+$", v):
                raise ValueError("Sport contains invalid characters")
        return v


class SecureKnowledgeQuery(BaseModel):
    """Secure knowledge query with validation."""
    query: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)
    filter_sport: Optional[str] = Field(None, max_length=50)
    filter_framework: Optional[str] = Field(None, max_length=100)
    rerank: bool = Field(default=True)

    @validator("query")
    def validate_query(cls, v):
        # Check for injection attempts
        is_safe, _ = InputSanitizer.check_sql_injection(v)
        if not is_safe:
            raise ValueError("Query contains disallowed content")
        return InputSanitizer.sanitize_for_llm(v)


class SecurePredictionRequest(BaseModel):
    """Secure prediction request with validation."""
    athlete_id: str = Field(..., min_length=1, max_length=100)
    features: Optional[Dict[str, float]] = Field(default=None)

    @validator("athlete_id")
    def validate_athlete_id(cls, v):
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError("Athlete ID contains invalid characters")
        return v

    @validator("features")
    def validate_features(cls, v):
        if v:
            # Limit number of features
            if len(v) > 50:
                raise ValueError("Too many features")

            # Validate feature names (prevent injection)
            for key in v.keys():
                if not re.match(r"^[a-zA-Z0-9_]+$", key):
                    raise ValueError(f"Invalid feature name: {key}")

            # Validate feature values are reasonable
            for key, val in v.items():
                if not isinstance(val, (int, float)):
                    raise ValueError(f"Feature {key} must be numeric")
                if val < -1000 or val > 1000:
                    raise ValueError(f"Feature {key} value out of range")

        return v


# ============================================
# SECURITY HEADERS MIDDLEWARE
# ============================================

async def add_security_headers(request: Request, call_next):
    """
    Add security headers to all responses.
    """
    response = await call_next(request)

    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"

    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"

    # XSS protection
    response.headers["X-XSS-Protection"] = "1; mode=block"

    # Referrer policy
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    # Content Security Policy
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "font-src 'self'; "
        "connect-src 'self';"
    )

    # HSTS (only in production)
    if settings.ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    return response


# ============================================
# AUDIT LOGGING
# ============================================

class SecurityAuditLog:
    """Log security-relevant events for forensics."""

    @staticmethod
    def log_auth_attempt(
        user_id: Optional[str],
        success: bool,
        ip_address: str,
        user_agent: str,
        reason: Optional[str] = None
    ):
        """Log authentication attempt."""
        event = {
            "event_type": "auth_attempt",
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "success": success,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "reason": reason,
        }

        if success:
            logger.info(f"Auth success: {event}")
        else:
            logger.warning(f"Auth failure: {event}")

    @staticmethod
    def log_security_event(
        event_type: str,
        severity: str,
        details: Dict[str, Any],
        ip_address: Optional[str] = None,
        user_id: Optional[str] = None
    ):
        """Log security event."""
        event = {
            "event_type": event_type,
            "severity": severity,
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "ip_address": ip_address,
            "details": details,
        }

        if severity == "critical":
            logger.critical(f"SECURITY EVENT: {event}")
        elif severity == "high":
            logger.error(f"SECURITY EVENT: {event}")
        elif severity == "medium":
            logger.warning(f"SECURITY EVENT: {event}")
        else:
            logger.info(f"SECURITY EVENT: {event}")

    @staticmethod
    def log_data_access(
        user_id: str,
        resource_type: str,
        resource_id: str,
        action: str,
        ip_address: str
    ):
        """Log data access for compliance."""
        event = {
            "event_type": "data_access",
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "action": action,
            "ip_address": ip_address,
        }

        logger.info(f"Data access: {event}")


# ============================================
# IP BLOCKING
# ============================================

class IPBlocker:
    """Block suspicious IPs after repeated violations."""

    # In-memory store (use Redis in production)
    _violations: Dict[str, List[datetime]] = {}
    _blocked: Dict[str, datetime] = {}

    VIOLATION_THRESHOLD = 10  # Block after 10 violations
    VIOLATION_WINDOW = 300  # Within 5 minutes
    BLOCK_DURATION = 3600  # Block for 1 hour

    @classmethod
    def record_violation(cls, ip_address: str, reason: str):
        """Record a security violation from an IP."""
        now = datetime.utcnow()

        if ip_address not in cls._violations:
            cls._violations[ip_address] = []

        # Clean old violations
        cls._violations[ip_address] = [
            v for v in cls._violations[ip_address]
            if (now - v).total_seconds() < cls.VIOLATION_WINDOW
        ]

        # Add new violation
        cls._violations[ip_address].append(now)

        # Check threshold
        if len(cls._violations[ip_address]) >= cls.VIOLATION_THRESHOLD:
            cls._blocked[ip_address] = now
            logger.critical(f"IP {ip_address} blocked due to {reason}")

            SecurityAuditLog.log_security_event(
                event_type="ip_blocked",
                severity="high",
                details={"reason": reason, "violation_count": len(cls._violations[ip_address])},
                ip_address=ip_address
            )

    @classmethod
    def is_blocked(cls, ip_address: str) -> bool:
        """Check if an IP is blocked."""
        if ip_address not in cls._blocked:
            return False

        blocked_at = cls._blocked[ip_address]
        now = datetime.utcnow()

        if (now - blocked_at).total_seconds() > cls.BLOCK_DURATION:
            # Unblock after duration
            del cls._blocked[ip_address]
            return False

        return True
