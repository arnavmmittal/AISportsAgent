"""
Usage Service - Token Tracking & Billing

Handles persisting token usage to database for billing and analytics.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.logging import setup_logging

logger = setup_logging()


class UsageService:
    """Service for tracking and querying token usage."""

    def __init__(self, db: Session):
        """Initialize usage service with database session."""
        self.db = db

    def record_usage(
        self,
        user_id: Optional[str],
        tenant_id: Optional[str],
        tokens: int,
        cost_usd: float,
        model: str,
        endpoint: str,
        duration: float
    ) -> None:
        """
        Record token usage to database for billing.

        Args:
            user_id: User ID (optional)
            tenant_id: Tenant/school ID (optional)
            tokens: Number of tokens used
            cost_usd: Cost in USD
            model: Model name (e.g., gpt-4-turbo-preview)
            endpoint: API endpoint (e.g., /v1/chat/stream)
            duration: Request duration in seconds
        """
        try:
            # Import here to avoid circular imports
            from app.db.models import TokenUsage

            usage = TokenUsage(
                userId=user_id,
                tenantId=tenant_id,
                tokens=tokens,
                costUsd=cost_usd,
                model=model,
                endpoint=endpoint,
                duration=duration,
                timestamp=datetime.utcnow()
            )

            self.db.add(usage)
            self.db.commit()

            logger.info(
                f"Recorded usage: {tokens} tokens, ${cost_usd:.4f} "
                f"for user={user_id}, tenant={tenant_id}"
            )

        except Exception as e:
            logger.error(f"Error recording usage: {e}")
            self.db.rollback()
            # Don't raise - usage tracking shouldn't break the application

    def get_daily_usage(
        self,
        tenant_id: str,
        date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get daily usage summary for a tenant.

        Args:
            tenant_id: Tenant/school ID
            date: Date to query (defaults to today)

        Returns:
            Dict with total_tokens, total_cost, request_count
        """
        if date is None:
            date = datetime.utcnow()

        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)

        try:
            from app.db.models import TokenUsage

            result = self.db.query(
                func.sum(TokenUsage.tokens).label('total_tokens'),
                func.sum(TokenUsage.costUsd).label('total_cost'),
                func.count(TokenUsage.id).label('request_count')
            ).filter(
                TokenUsage.tenantId == tenant_id,
                TokenUsage.timestamp >= start_of_day,
                TokenUsage.timestamp < end_of_day
            ).first()

            return {
                "total_tokens": int(result.total_tokens or 0),
                "total_cost": float(result.total_cost or 0.0),
                "request_count": int(result.request_count or 0),
                "date": start_of_day.isoformat()
            }

        except Exception as e:
            logger.error(f"Error getting daily usage: {e}")
            return {
                "total_tokens": 0,
                "total_cost": 0.0,
                "request_count": 0,
                "date": start_of_day.isoformat()
            }

    def get_user_usage(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Get usage history for a user.

        Args:
            user_id: User ID
            start_date: Start of date range (defaults to 30 days ago)
            end_date: End of date range (defaults to now)

        Returns:
            List of usage records
        """
        if end_date is None:
            end_date = datetime.utcnow()
        if start_date is None:
            start_date = end_date - timedelta(days=30)

        try:
            from app.db.models import TokenUsage

            records = self.db.query(TokenUsage).filter(
                TokenUsage.userId == user_id,
                TokenUsage.timestamp >= start_date,
                TokenUsage.timestamp < end_date
            ).order_by(TokenUsage.timestamp.desc()).all()

            return [
                {
                    "id": r.id,
                    "tokens": r.tokens,
                    "cost_usd": r.costUsd,
                    "model": r.model,
                    "endpoint": r.endpoint,
                    "duration": r.duration,
                    "timestamp": r.timestamp.isoformat()
                }
                for r in records
            ]

        except Exception as e:
            logger.error(f"Error getting user usage: {e}")
            return []

    def get_tenant_monthly_usage(
        self,
        tenant_id: str,
        year: Optional[int] = None,
        month: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get monthly usage summary for a tenant.

        Args:
            tenant_id: Tenant/school ID
            year: Year (defaults to current year)
            month: Month (defaults to current month)

        Returns:
            Dict with monthly usage summary
        """
        now = datetime.utcnow()
        if year is None:
            year = now.year
        if month is None:
            month = now.month

        start_of_month = datetime(year, month, 1)
        if month == 12:
            end_of_month = datetime(year + 1, 1, 1)
        else:
            end_of_month = datetime(year, month + 1, 1)

        try:
            from app.db.models import TokenUsage

            # Overall summary
            overall = self.db.query(
                func.sum(TokenUsage.tokens).label('total_tokens'),
                func.sum(TokenUsage.costUsd).label('total_cost'),
                func.count(TokenUsage.id).label('request_count')
            ).filter(
                TokenUsage.tenantId == tenant_id,
                TokenUsage.timestamp >= start_of_month,
                TokenUsage.timestamp < end_of_month
            ).first()

            # By model
            by_model = self.db.query(
                TokenUsage.model,
                func.sum(TokenUsage.tokens).label('tokens'),
                func.sum(TokenUsage.costUsd).label('cost'),
                func.count(TokenUsage.id).label('requests')
            ).filter(
                TokenUsage.tenantId == tenant_id,
                TokenUsage.timestamp >= start_of_month,
                TokenUsage.timestamp < end_of_month
            ).group_by(TokenUsage.model).all()

            # By endpoint
            by_endpoint = self.db.query(
                TokenUsage.endpoint,
                func.sum(TokenUsage.tokens).label('tokens'),
                func.sum(TokenUsage.costUsd).label('cost'),
                func.count(TokenUsage.id).label('requests')
            ).filter(
                TokenUsage.tenantId == tenant_id,
                TokenUsage.timestamp >= start_of_month,
                TokenUsage.timestamp < end_of_month
            ).group_by(TokenUsage.endpoint).all()

            return {
                "tenant_id": tenant_id,
                "year": year,
                "month": month,
                "total_tokens": int(overall.total_tokens or 0),
                "total_cost": float(overall.total_cost or 0.0),
                "request_count": int(overall.request_count or 0),
                "by_model": [
                    {
                        "model": row.model,
                        "tokens": int(row.tokens),
                        "cost": float(row.cost),
                        "requests": int(row.requests)
                    }
                    for row in by_model
                ],
                "by_endpoint": [
                    {
                        "endpoint": row.endpoint,
                        "tokens": int(row.tokens),
                        "cost": float(row.cost),
                        "requests": int(row.requests)
                    }
                    for row in by_endpoint
                ]
            }

        except Exception as e:
            logger.error(f"Error getting monthly usage: {e}")
            return {
                "tenant_id": tenant_id,
                "year": year,
                "month": month,
                "total_tokens": 0,
                "total_cost": 0.0,
                "request_count": 0,
                "by_model": [],
                "by_endpoint": []
            }

    def get_top_users(
        self,
        tenant_id: str,
        limit: int = 10,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Get top users by token usage for a tenant.

        Args:
            tenant_id: Tenant/school ID
            limit: Number of top users to return
            start_date: Start of date range (defaults to 30 days ago)
            end_date: End of date range (defaults to now)

        Returns:
            List of top users with usage stats
        """
        if end_date is None:
            end_date = datetime.utcnow()
        if start_date is None:
            start_date = end_date - timedelta(days=30)

        try:
            from app.db.models import TokenUsage

            top_users = self.db.query(
                TokenUsage.userId,
                func.sum(TokenUsage.tokens).label('total_tokens'),
                func.sum(TokenUsage.costUsd).label('total_cost'),
                func.count(TokenUsage.id).label('request_count')
            ).filter(
                TokenUsage.tenantId == tenant_id,
                TokenUsage.userId.isnot(None),
                TokenUsage.timestamp >= start_date,
                TokenUsage.timestamp < end_date
            ).group_by(
                TokenUsage.userId
            ).order_by(
                func.sum(TokenUsage.tokens).desc()
            ).limit(limit).all()

            return [
                {
                    "user_id": row.userId,
                    "total_tokens": int(row.total_tokens),
                    "total_cost": float(row.total_cost),
                    "request_count": int(row.request_count)
                }
                for row in top_users
            ]

        except Exception as e:
            logger.error(f"Error getting top users: {e}")
            return []
