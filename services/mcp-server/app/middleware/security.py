"""
Security Middleware

Comprehensive security middleware for:
- IP blocking
- Request validation
- Security headers
- Audit logging
- Attack detection
"""

import time
import hashlib
from typing import Dict, Any, Optional
from datetime import datetime

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.security_hardening import (
    IPBlocker,
    SecurityAuditLog,
    InputSanitizer,
)

logger = setup_logging()


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Comprehensive security middleware.

    Features:
    - IP blocking for repeat offenders
    - Request fingerprinting
    - Attack detection and logging
    - Security headers
    - Request size limits
    """

    # Maximum request body size (10MB)
    MAX_BODY_SIZE = 10 * 1024 * 1024

    # Paths that don't require security checks
    EXEMPT_PATHS = {"/health", "/docs", "/redoc", "/openapi.json", "/"}

    # Sensitive paths that need extra logging
    SENSITIVE_PATHS = {
        "/api/orchestrator/chat",
        "/api/predictions/risk",
        "/api/voice/transcribe",
        "/api/knowledge/query",
    }

    def __init__(self, app):
        super().__init__(app)
        logger.info("SecurityMiddleware initialized")

    async def dispatch(self, request: Request, call_next):
        """Process request with security checks."""
        start_time = time.time()

        # Get client IP
        ip_address = self._get_client_ip(request)

        # Skip checks for exempt paths
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)

        # Check if IP is blocked
        if IPBlocker.is_blocked(ip_address):
            logger.warning(f"Blocked request from banned IP: {ip_address}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Access denied"}
            )

        # Check request size
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.MAX_BODY_SIZE:
            IPBlocker.record_violation(ip_address, "oversized_request")
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={"error": "Request too large"}
            )

        # Log sensitive path access
        if request.url.path in self.SENSITIVE_PATHS:
            user_id = self._get_user_id(request)
            SecurityAuditLog.log_data_access(
                user_id=user_id or "anonymous",
                resource_type="api_endpoint",
                resource_id=request.url.path,
                action=request.method,
                ip_address=ip_address,
            )

        try:
            # Process request
            response = await call_next(request)

            # Add security headers
            response = self._add_security_headers(response)

            # Log request timing for sensitive paths
            duration = time.time() - start_time
            if request.url.path in self.SENSITIVE_PATHS:
                logger.info(
                    f"Request completed: {request.method} {request.url.path} "
                    f"status={response.status_code} duration={duration:.3f}s ip={ip_address}"
                )

            return response

        except HTTPException as e:
            # Record security violations
            if e.status_code in [400, 401, 403]:
                IPBlocker.record_violation(ip_address, f"http_{e.status_code}")

            raise

        except Exception as e:
            # Log unexpected errors
            logger.error(f"Unexpected error in request: {e}", exc_info=True)
            SecurityAuditLog.log_security_event(
                event_type="unexpected_error",
                severity="high",
                details={"error": str(e), "path": request.url.path},
                ip_address=ip_address,
            )
            raise

    def _get_client_ip(self, request: Request) -> str:
        """Get real client IP, handling proxies."""
        # Check X-Forwarded-For first (from reverse proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take first IP (client IP)
            return forwarded_for.split(",")[0].strip()

        # Check X-Real-IP
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        # Fall back to direct connection
        if request.client:
            return request.client.host

        return "unknown"

    def _get_user_id(self, request: Request) -> Optional[str]:
        """Extract user ID from request if available."""
        if hasattr(request.state, "user_id"):
            return request.state.user_id
        return request.headers.get("X-User-Id")

    def _add_security_headers(self, response) -> Any:
        """Add security headers to response."""
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Prevent MIME sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # XSS protection
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions policy
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        )

        # HSTS in production
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Additional rate limiting for specific endpoints.

    This provides endpoint-specific limits on top of the global cost control.
    """

    # Endpoint-specific rate limits (requests per minute)
    ENDPOINT_LIMITS = {
        "/api/orchestrator/chat": 30,
        "/api/voice/synthesize": 10,
        "/api/voice/transcribe": 10,
        "/api/predictions/risk": 60,
        "/api/knowledge/query": 60,
    }

    # In-memory counter (use Redis in production for distributed)
    _request_counts: Dict[str, Dict[str, int]] = {}
    _last_reset: datetime = datetime.utcnow()

    def __init__(self, app):
        super().__init__(app)
        logger.info("RateLimitMiddleware initialized")

    async def dispatch(self, request: Request, call_next):
        """Apply endpoint-specific rate limits."""
        path = request.url.path

        # Skip if no specific limit for this endpoint
        if path not in self.ENDPOINT_LIMITS:
            return await call_next(request)

        # Get client identifier
        client_id = self._get_client_id(request)
        limit = self.ENDPOINT_LIMITS[path]

        # Reset counts every minute
        now = datetime.utcnow()
        if (now - self._last_reset).total_seconds() > 60:
            self._request_counts = {}
            self._last_reset = now

        # Initialize counter for this path
        if path not in self._request_counts:
            self._request_counts[path] = {}

        # Check and increment
        current = self._request_counts[path].get(client_id, 0)
        if current >= limit:
            logger.warning(f"Rate limit exceeded for {client_id} on {path}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "limit": limit,
                    "window": "60 seconds",
                },
                headers={"Retry-After": "60"}
            )

        self._request_counts[path][client_id] = current + 1

        return await call_next(request)

    def _get_client_id(self, request: Request) -> str:
        """Get unique client identifier."""
        # Prefer user ID if authenticated
        if hasattr(request.state, "user_id"):
            return f"user:{request.state.user_id}"

        # Fall back to IP
        ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        if not ip and request.client:
            ip = request.client.host

        return f"ip:{ip or 'unknown'}"
