"""
Cost Control Middleware - Token Tracking & Budget Enforcement

Tracks OpenAI API token usage and enforces budget limits to prevent runaway costs.

Features:
- Per-request token tracking
- Per-user rate limiting (60 req/min)
- Per-tenant daily budget limits ($500/day default)
- Circuit breakers for exceeded budgets
- Redis-backed usage counters
- Database persistence for billing
"""

from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import json
import redis
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import setup_logging
from app.db.database import SessionLocal

logger = setup_logging()


class CostControlMiddleware(BaseHTTPMiddleware):
    """
    Middleware for tracking API costs and enforcing budget limits.

    Cost Structure (OpenAI GPT-4 Turbo):
    - Input: $10 per 1M tokens
    - Output: $30 per 1M tokens
    - Average: ~$0.02 per 1K tokens (mixed input/output)

    Budget Defaults:
    - Per user: 60 requests/minute
    - Per tenant: $500/day (~25M tokens)
    - Global: $10,000/month
    """

    # Token cost estimates (USD per 1K tokens)
    COST_PER_1K_TOKENS = {
        "gpt-4-turbo-preview": 0.02,  # Average of input/output
        "gpt-4": 0.06,
        "gpt-3.5-turbo": 0.002,
        "text-embedding-3-large": 0.00013,
        "text-embedding-3-small": 0.00002,
    }

    # Budget limits
    DAILY_BUDGET_PER_TENANT = 500.0  # USD
    MONTHLY_BUDGET_GLOBAL = 10000.0  # USD

    # Rate limits
    REQUESTS_PER_MINUTE_PER_USER = 60
    REQUESTS_PER_MINUTE_PER_TENANT = 1000
    REQUESTS_PER_MINUTE_GLOBAL = 10000

    def __init__(self, app):
        """Initialize cost control middleware."""
        super().__init__(app)

        # Initialize Redis connection
        try:
            self.redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
                decode_responses=True,
                socket_connect_timeout=5
            )
            # Test connection
            self.redis_client.ping()
            logger.info("Redis connection established for cost control")
            self.redis_enabled = True
        except Exception as e:
            logger.warning(f"Redis not available, cost controls will be limited: {e}")
            self.redis_enabled = False
            self.redis_client = None

        logger.info("CostControlMiddleware initialized")

    async def dispatch(self, request: Request, call_next):
        """
        Process request with cost control checks.

        Args:
            request: FastAPI request
            call_next: Next middleware in chain

        Returns:
            Response or error if budget exceeded
        """
        # Skip cost control for health checks and docs
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        # Extract user context (from JWT or session)
        user_id = self._get_user_id(request)
        tenant_id = self._get_tenant_id(request)

        # Check rate limits BEFORE processing
        if self.redis_enabled:
            rate_limit_result = self._check_rate_limits(user_id, tenant_id)
            if not rate_limit_result["allowed"]:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "error": "Rate limit exceeded",
                        "limit": rate_limit_result["limit"],
                        "window_seconds": rate_limit_result["window"],
                        "retry_after": rate_limit_result["retry_after"]
                    },
                    headers={"Retry-After": str(rate_limit_result["retry_after"])}
                )

        # Check circuit breaker (budget exceeded?)
        if self.redis_enabled and tenant_id:
            circuit_breaker_key = f"circuit_breaker:{tenant_id}"
            if self.redis_client.get(circuit_breaker_key):
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "error": "Daily budget exceeded",
                        "message": f"Tenant {tenant_id} has exceeded daily budget of ${self.DAILY_BUDGET_PER_TENANT}",
                        "reset_at": "Midnight UTC"
                    }
                )

        # Check budget BEFORE processing
        if self.redis_enabled and tenant_id:
            budget_check = self._check_budget(tenant_id)
            if not budget_check["allowed"]:
                # Trigger circuit breaker
                self._trigger_circuit_breaker(tenant_id)

                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "error": "Budget limit approaching",
                        "current_spend": budget_check["current_spend"],
                        "daily_limit": self.DAILY_BUDGET_PER_TENANT,
                        "message": "Daily budget limit reached. Service paused until midnight UTC."
                    }
                )

        # Process the request
        start_time = datetime.utcnow()
        response = await call_next(request)
        duration = (datetime.utcnow() - start_time).total_seconds()

        # Track usage AFTER response (extract token count from response if available)
        if hasattr(request.state, "tokens_used"):
            tokens = request.state.tokens_used
            await self._track_usage(
                user_id=user_id,
                tenant_id=tenant_id,
                tokens=tokens,
                model=getattr(request.state, "model_used", settings.OPENAI_MODEL),
                endpoint=request.url.path,
                duration=duration
            )

        return response

    def _get_user_id(self, request: Request) -> Optional[str]:
        """Extract user ID from request context."""
        # Try to get from request state (set by auth middleware)
        if hasattr(request.state, "user_id"):
            return request.state.user_id

        # Try to get from headers (for testing)
        return request.headers.get("X-User-Id")

    def _get_tenant_id(self, request: Request) -> Optional[str]:
        """Extract tenant/school ID from request context."""
        if hasattr(request.state, "tenant_id"):
            return request.state.tenant_id

        return request.headers.get("X-Tenant-Id")

    def _check_rate_limits(self, user_id: Optional[str], tenant_id: Optional[str]) -> Dict[str, Any]:
        """
        Check if request is within rate limits.

        Returns:
            Dict with 'allowed' boolean and limit details
        """
        now = datetime.utcnow()
        window = 60  # 1 minute

        # Check per-user limit
        if user_id:
            user_key = f"rate_limit:user:{user_id}:{now.strftime('%Y%m%d%H%M')}"
            current_count = self.redis_client.incr(user_key)

            if current_count == 1:
                self.redis_client.expire(user_key, window)

            if current_count > self.REQUESTS_PER_MINUTE_PER_USER:
                return {
                    "allowed": False,
                    "limit": self.REQUESTS_PER_MINUTE_PER_USER,
                    "window": window,
                    "retry_after": window - (now.second if now.second < window else 0)
                }

        # Check per-tenant limit
        if tenant_id:
            tenant_key = f"rate_limit:tenant:{tenant_id}:{now.strftime('%Y%m%d%H%M')}"
            current_count = self.redis_client.incr(tenant_key)

            if current_count == 1:
                self.redis_client.expire(tenant_key, window)

            if current_count > self.REQUESTS_PER_MINUTE_PER_TENANT:
                return {
                    "allowed": False,
                    "limit": self.REQUESTS_PER_MINUTE_PER_TENANT,
                    "window": window,
                    "retry_after": window
                }

        # Check global limit
        global_key = f"rate_limit:global:{now.strftime('%Y%m%d%H%M')}"
        current_count = self.redis_client.incr(global_key)

        if current_count == 1:
            self.redis_client.expire(global_key, window)

        if current_count > self.REQUESTS_PER_MINUTE_GLOBAL:
            return {
                "allowed": False,
                "limit": self.REQUESTS_PER_MINUTE_GLOBAL,
                "window": window,
                "retry_after": window
            }

        return {"allowed": True}

    def _check_budget(self, tenant_id: str) -> Dict[str, Any]:
        """
        Check if tenant is within daily budget.

        Returns:
            Dict with 'allowed' boolean and spend details
        """
        today = datetime.utcnow().strftime("%Y%m%d")
        budget_key = f"budget:tenant:{tenant_id}:{today}"

        # Get current spend from Redis
        current_spend_str = self.redis_client.get(budget_key)
        current_spend = float(current_spend_str) if current_spend_str else 0.0

        # Check if within budget (with 10% buffer for safety)
        allowed = current_spend < (self.DAILY_BUDGET_PER_TENANT * 0.9)

        return {
            "allowed": allowed,
            "current_spend": current_spend,
            "daily_limit": self.DAILY_BUDGET_PER_TENANT,
            "remaining": max(0, self.DAILY_BUDGET_PER_TENANT - current_spend)
        }

    def _trigger_circuit_breaker(self, tenant_id: str) -> None:
        """
        Trigger circuit breaker to block all requests for tenant until midnight UTC.

        Args:
            tenant_id: Tenant/school ID
        """
        circuit_breaker_key = f"circuit_breaker:{tenant_id}"

        # Calculate seconds until midnight UTC
        now = datetime.utcnow()
        midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        seconds_until_reset = int((midnight - now).total_seconds())

        # Set circuit breaker with TTL until midnight
        self.redis_client.setex(circuit_breaker_key, seconds_until_reset, "open")

        logger.critical(
            f"Circuit breaker triggered for tenant {tenant_id}. "
            f"All requests blocked until {midnight.isoformat()}"
        )

    async def _track_usage(
        self,
        user_id: Optional[str],
        tenant_id: Optional[str],
        tokens: int,
        model: str,
        endpoint: str,
        duration: float
    ) -> None:
        """
        Track token usage in Redis and database.

        Args:
            user_id: User ID
            tenant_id: Tenant ID
            tokens: Number of tokens used
            model: Model name
            endpoint: API endpoint
            duration: Request duration in seconds
        """
        # Calculate cost
        cost_per_1k = self.COST_PER_1K_TOKENS.get(model, 0.02)
        cost_usd = (tokens / 1000.0) * cost_per_1k

        today = datetime.utcnow().strftime("%Y%m%d")

        if self.redis_enabled:
            # Increment tenant daily spend
            if tenant_id:
                budget_key = f"budget:tenant:{tenant_id}:{today}"
                self.redis_client.incrbyfloat(budget_key, cost_usd)
                self.redis_client.expire(budget_key, 86400 * 2)  # Keep for 2 days

            # Increment user usage
            if user_id:
                user_key = f"usage:user:{user_id}:{today}"
                usage_data = {
                    "tokens": tokens,
                    "cost": cost_usd,
                    "requests": 1
                }

                # Get existing data
                existing = self.redis_client.get(user_key)
                if existing:
                    existing_data = json.loads(existing)
                    usage_data["tokens"] += existing_data.get("tokens", 0)
                    usage_data["cost"] += existing_data.get("cost", 0.0)
                    usage_data["requests"] += existing_data.get("requests", 0)

                self.redis_client.setex(user_key, 86400 * 2, json.dumps(usage_data))

        # Persist to database for billing (async to not block response)
        try:
            db = SessionLocal()

            # Import here to avoid circular imports
            from app.services.usage_service import UsageService
            usage_service = UsageService(db)

            usage_service.record_usage(
                user_id=user_id,
                tenant_id=tenant_id,
                tokens=tokens,
                cost_usd=cost_usd,
                model=model,
                endpoint=endpoint,
                duration=duration
            )

            db.close()
        except Exception as e:
            logger.error(f"Error persisting usage to database: {e}")
