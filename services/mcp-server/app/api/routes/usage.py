"""
Usage & Billing API Endpoints

Provides endpoints for querying token usage and cost data.
"""

from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.usage_service import UsageService
from app.core.logging import setup_logging

logger = setup_logging()
router = APIRouter()


# ============================================================================
# Request/Response Models
# ============================================================================

class DailyUsageResponse(BaseModel):
    """Daily usage summary response."""
    total_tokens: int
    total_cost: float
    request_count: int
    date: str


class MonthlyUsageResponse(BaseModel):
    """Monthly usage summary response."""
    tenant_id: str
    year: int
    month: int
    total_tokens: int
    total_cost: float
    request_count: int
    by_model: list
    by_endpoint: list


class TopUsersResponse(BaseModel):
    """Top users response."""
    users: list


class UsageBudgetResponse(BaseModel):
    """Budget status response."""
    tenant_id: str
    daily_limit: float
    daily_spent: float
    daily_remaining: float
    percentage_used: float
    circuit_breaker_active: bool


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/usage/daily/{tenant_id}", response_model=DailyUsageResponse)
async def get_daily_usage(
    tenant_id: str,
    date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get daily usage summary for a tenant.

    Args:
        tenant_id: Tenant/school ID
        date: Optional date (YYYY-MM-DD format, defaults to today)
        db: Database session

    Returns:
        Daily usage summary
    """
    try:
        usage_service = UsageService(db)

        if date:
            query_date = datetime.fromisoformat(date)
        else:
            query_date = None

        usage = usage_service.get_daily_usage(tenant_id, query_date)

        return DailyUsageResponse(**usage)

    except Exception as e:
        logger.error(f"Error getting daily usage: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve usage data"
        )


@router.get("/usage/monthly/{tenant_id}", response_model=MonthlyUsageResponse)
async def get_monthly_usage(
    tenant_id: str,
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get monthly usage summary for a tenant.

    Args:
        tenant_id: Tenant/school ID
        year: Year (defaults to current year)
        month: Month (defaults to current month)
        db: Database session

    Returns:
        Monthly usage summary with breakdowns by model and endpoint
    """
    try:
        usage_service = UsageService(db)
        usage = usage_service.get_tenant_monthly_usage(tenant_id, year, month)

        return MonthlyUsageResponse(**usage)

    except Exception as e:
        logger.error(f"Error getting monthly usage: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve monthly usage"
        )


@router.get("/usage/top-users/{tenant_id}", response_model=TopUsersResponse)
async def get_top_users(
    tenant_id: str,
    limit: int = 10,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get top users by token usage for a tenant.

    Args:
        tenant_id: Tenant/school ID
        limit: Number of top users to return
        days: Number of days to look back (default 30)
        db: Database session

    Returns:
        List of top users with usage stats
    """
    try:
        usage_service = UsageService(db)

        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        users = usage_service.get_top_users(
            tenant_id,
            limit=limit,
            start_date=start_date,
            end_date=end_date
        )

        return TopUsersResponse(users=users)

    except Exception as e:
        logger.error(f"Error getting top users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve top users"
        )


@router.get("/usage/budget/{tenant_id}", response_model=UsageBudgetResponse)
async def get_budget_status(
    tenant_id: str,
    db: Session = Depends(get_db)
):
    """
    Get current budget status for a tenant.

    Shows daily spending, remaining budget, and circuit breaker status.

    Args:
        tenant_id: Tenant/school ID
        db: Database session

    Returns:
        Budget status with circuit breaker info
    """
    try:
        from app.core.config import settings
        from app.middleware.cost_control import CostControlMiddleware
        import redis

        usage_service = UsageService(db)

        # Get today's usage
        usage = usage_service.get_daily_usage(tenant_id)
        daily_spent = usage["total_cost"]

        # Check circuit breaker status
        try:
            redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
                decode_responses=True
            )
            circuit_breaker_key = f"circuit_breaker:{tenant_id}"
            circuit_breaker_active = redis_client.get(circuit_breaker_key) is not None
        except Exception:
            circuit_breaker_active = False

        daily_limit = CostControlMiddleware.DAILY_BUDGET_PER_TENANT
        daily_remaining = max(0, daily_limit - daily_spent)
        percentage_used = (daily_spent / daily_limit) * 100 if daily_limit > 0 else 0

        return UsageBudgetResponse(
            tenant_id=tenant_id,
            daily_limit=daily_limit,
            daily_spent=daily_spent,
            daily_remaining=daily_remaining,
            percentage_used=percentage_used,
            circuit_breaker_active=circuit_breaker_active
        )

    except Exception as e:
        logger.error(f"Error getting budget status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve budget status"
        )


@router.get("/usage/user/{user_id}")
async def get_user_usage_history(
    user_id: str,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get usage history for a specific user.

    Args:
        user_id: User ID
        days: Number of days to look back (default 30)
        db: Database session

    Returns:
        List of usage records
    """
    try:
        usage_service = UsageService(db)

        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        records = usage_service.get_user_usage(user_id, start_date, end_date)

        return {
            "user_id": user_id,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "records": records,
            "total_records": len(records)
        }

    except Exception as e:
        logger.error(f"Error getting user usage history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user usage history"
        )
