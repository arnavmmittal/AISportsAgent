"""
Coach analytics API routes.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from app.db.database import get_db
from app.agents import CoachAgent
from app.core.logging import setup_logging

logger = setup_logging()
router = APIRouter(prefix="/coach", tags=["coach"])


# Response models
class TeamAnalyticsResponse(BaseModel):
    """Team analytics response."""
    period_days: int
    team_size: int
    total_mood_logs: int
    averages: dict
    trends: dict
    at_risk_athletes: List[dict]
    engagement: dict
    sport: str


class AthleteSummaryResponse(BaseModel):
    """Individual athlete summary response."""
    athlete: dict
    period_days: int
    mood_logs_count: int
    recent_averages: Optional[dict] = None
    trend: Optional[dict] = None
    engagement: dict
    goals: dict


class RecommendationResponse(BaseModel):
    """Recommendation response."""
    priority: str
    category: str
    title: str
    description: str
    action: str


@router.get("/analytics", response_model=TeamAnalyticsResponse)
async def get_team_analytics(
    coach_id: str = Query(..., description="Coach user ID"),
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: Session = Depends(get_db)
):
    """
    Get team-wide mental performance analytics.

    Args:
        coach_id: Coach user ID
        days: Number of days to analyze (default: 30)
        db: Database session

    Returns:
        Team analytics with trends and insights
    """
    try:
        logger.info(f"Getting team analytics for coach {coach_id}")

        coach_agent = CoachAgent(db=db)
        analytics = coach_agent.get_team_analytics(coach_id=coach_id, days=days)

        if "error" in analytics:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=analytics["error"]
            )

        if "message" in analytics:
            # No data available, but not an error
            return analytics

        return analytics

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in team analytics endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/athlete/{athlete_id}", response_model=AthleteSummaryResponse)
async def get_athlete_summary(
    athlete_id: str,
    coach_id: str = Query(..., description="Coach user ID"),
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: Session = Depends(get_db)
):
    """
    Get individual athlete summary for coach.

    Args:
        athlete_id: Athlete user ID
        coach_id: Coach user ID
        days: Number of days to analyze (default: 30)
        db: Database session

    Returns:
        Athlete summary with trends and activity
    """
    try:
        logger.info(f"Getting athlete summary for coach {coach_id}, athlete {athlete_id}")

        coach_agent = CoachAgent(db=db)
        summary = coach_agent.get_athlete_summary(
            coach_id=coach_id,
            athlete_id=athlete_id,
            days=days
        )

        if "error" in summary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=summary["error"]
            )

        return summary

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in athlete summary endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/recommendations", response_model=List[RecommendationResponse])
async def get_recommendations(
    coach_id: str = Query(..., description="Coach user ID"),
    db: Session = Depends(get_db)
):
    """
    Get actionable recommendations for coach.

    Args:
        coach_id: Coach user ID
        db: Database session

    Returns:
        List of prioritized recommendations
    """
    try:
        logger.info(f"Getting recommendations for coach {coach_id}")

        coach_agent = CoachAgent(db=db)
        recommendations = coach_agent.get_recommendations(coach_id=coach_id)

        return recommendations

    except Exception as e:
        logger.error(f"Error in recommendations endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
