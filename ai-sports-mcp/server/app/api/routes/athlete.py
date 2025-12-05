"""
Athlete API routes for dashboard, mood logs, goals, and sessions.
"""

from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.logging import setup_logging

logger = setup_logging()
router = APIRouter(prefix="/athlete", tags=["athlete"])


# Request/Response models
class MoodLogRequest(BaseModel):
    """Request to log mood entry."""
    mood: int = Field(..., ge=1, le=5, description="Mood rating 1-5")
    confidence: Optional[int] = Field(None, ge=1, le=5)
    stress: Optional[int] = Field(None, ge=1, le=5)
    energy: Optional[int] = Field(None, ge=1, le=5)
    sleep: Optional[int] = Field(None, ge=1, le=10, description="Hours of sleep")
    notes: Optional[str] = None


class MoodLogResponse(BaseModel):
    """Response after logging mood."""
    id: str
    athlete_id: str
    mood: int
    confidence: Optional[int]
    stress: Optional[int]
    energy: Optional[int]
    sleep: Optional[int]
    notes: Optional[str]
    logged_at: str
    streak: int


class MoodTrendResponse(BaseModel):
    """Mood trend data over time."""
    days: int
    mood_values: List[int]
    dates: List[str]
    average: float
    trend: str  # "improving", "stable", "declining"


class GoalResponse(BaseModel):
    """Individual goal."""
    id: str
    title: str
    description: Optional[str]
    category: str  # "performance", "mental", "academic", "personal"
    status: str  # "active", "completed", "paused"
    progress: int  # 0-100
    target_date: Optional[str]
    created_at: str


class GoalsProgressResponse(BaseModel):
    """Goals progress summary."""
    active_goals: int
    completed_goals: int
    overall_progress: int  # 0-100
    goals: List[GoalResponse]


class SessionSummary(BaseModel):
    """Recent chat session summary."""
    id: str
    date: str
    topic: str
    duration: str
    message_count: int


class DashboardResponse(BaseModel):
    """Complete athlete dashboard data."""
    athlete_id: str
    streak: int
    mood_trend: MoodTrendResponse
    goals_progress: GoalsProgressResponse
    recent_sessions: List[SessionSummary]


@router.post("/{athlete_id}/mood", response_model=MoodLogResponse)
async def log_mood(
    athlete_id: str,
    request: MoodLogRequest,
    db: Session = Depends(get_db)
):
    """
    Log a mood entry for the athlete.

    Args:
        athlete_id: Athlete ID
        request: Mood log data
        db: Database session

    Returns:
        Created mood log with streak information
    """
    try:
        logger.info(f"Logging mood for athlete {athlete_id}: mood={request.mood}")

        # TODO: Save to database when models are ready
        # For now, return mock response with proper structure

        # Calculate streak (mock data for now)
        streak = 7  # TODO: Calculate from database

        return MoodLogResponse(
            id=f"mood_{datetime.utcnow().timestamp()}",
            athlete_id=athlete_id,
            mood=request.mood,
            confidence=request.confidence,
            stress=request.stress,
            energy=request.energy,
            sleep=request.sleep,
            notes=request.notes,
            logged_at=datetime.utcnow().isoformat(),
            streak=streak
        )

    except Exception as e:
        logger.error(f"Error logging mood: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{athlete_id}/mood-trend", response_model=MoodTrendResponse)
async def get_mood_trend(
    athlete_id: str,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """
    Get mood trend data for the athlete.

    Args:
        athlete_id: Athlete ID
        days: Number of days to retrieve (default 7)
        db: Database session

    Returns:
        Mood trend data
    """
    try:
        logger.info(f"Fetching mood trend for athlete {athlete_id} ({days} days)")

        # TODO: Query database when models are ready
        # For now, return mock data with proper structure

        # Generate mock mood data (trending slightly upward)
        import random
        base = 3
        mood_values = [min(5, max(1, base + random.randint(-1, 2))) for _ in range(days)]

        # Generate date labels
        dates = [
            (datetime.utcnow() - timedelta(days=days-1-i)).strftime("%Y-%m-%d")
            for i in range(days)
        ]

        average = sum(mood_values) / len(mood_values)

        # Determine trend
        if len(mood_values) >= 3:
            recent_avg = sum(mood_values[-3:]) / 3
            older_avg = sum(mood_values[:3]) / 3
            if recent_avg > older_avg + 0.5:
                trend = "improving"
            elif recent_avg < older_avg - 0.5:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "stable"

        return MoodTrendResponse(
            days=days,
            mood_values=mood_values,
            dates=dates,
            average=round(average, 2),
            trend=trend
        )

    except Exception as e:
        logger.error(f"Error fetching mood trend: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{athlete_id}/goals", response_model=GoalsProgressResponse)
async def get_goals(
    athlete_id: str,
    db: Session = Depends(get_db)
):
    """
    Get goals and progress for the athlete.

    Args:
        athlete_id: Athlete ID
        db: Database session

    Returns:
        Goals progress summary
    """
    try:
        logger.info(f"Fetching goals for athlete {athlete_id}")

        # TODO: Query database when models are ready
        # For now, return mock data with proper structure

        mock_goals = [
            GoalResponse(
                id="goal_1",
                title="Improve pre-competition anxiety management",
                description="Practice breathing techniques before games",
                category="mental",
                status="active",
                progress=75,
                target_date=(datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d"),
                created_at=(datetime.utcnow() - timedelta(days=14)).strftime("%Y-%m-%d")
            ),
            GoalResponse(
                id="goal_2",
                title="Maintain 3.5 GPA this semester",
                description="Study 2 hours daily, attend all tutoring sessions",
                category="academic",
                status="active",
                progress=82,
                target_date=(datetime.utcnow() + timedelta(days=60)).strftime("%Y-%m-%d"),
                created_at=(datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
            ),
            GoalResponse(
                id="goal_3",
                title="Increase free throw percentage to 80%",
                description="100 free throws daily practice",
                category="performance",
                status="active",
                progress=45,
                target_date=(datetime.utcnow() + timedelta(days=45)).strftime("%Y-%m-%d"),
                created_at=(datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
            ),
        ]

        active_goals = len([g for g in mock_goals if g.status == "active"])
        completed_goals = len([g for g in mock_goals if g.status == "completed"])

        # Calculate overall progress
        if mock_goals:
            overall_progress = int(sum(g.progress for g in mock_goals) / len(mock_goals))
        else:
            overall_progress = 0

        return GoalsProgressResponse(
            active_goals=active_goals,
            completed_goals=completed_goals,
            overall_progress=overall_progress,
            goals=mock_goals
        )

    except Exception as e:
        logger.error(f"Error fetching goals: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{athlete_id}/sessions", response_model=List[SessionSummary])
async def get_sessions(
    athlete_id: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get recent chat sessions for the athlete.

    Args:
        athlete_id: Athlete ID
        limit: Maximum number of sessions to return
        db: Database session

    Returns:
        List of recent session summaries
    """
    try:
        logger.info(f"Fetching sessions for athlete {athlete_id} (limit={limit})")

        # TODO: Query database when models are ready
        # For now, return mock data with proper structure

        mock_sessions = [
            SessionSummary(
                id="session_1",
                date=(datetime.utcnow() - timedelta(days=1)).strftime("%Y-%m-%d"),
                topic="Pre-game anxiety management",
                duration="15 min",
                message_count=12
            ),
            SessionSummary(
                id="session_2",
                date=(datetime.utcnow() - timedelta(days=3)).strftime("%Y-%m-%d"),
                topic="Building confidence for competition",
                duration="12 min",
                message_count=10
            ),
            SessionSummary(
                id="session_3",
                date=(datetime.utcnow() - timedelta(days=5)).strftime("%Y-%m-%d"),
                topic="Focus and visualization techniques",
                duration="18 min",
                message_count=15
            ),
        ]

        return mock_sessions[:limit]

    except Exception as e:
        logger.error(f"Error fetching sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{athlete_id}/streak")
async def get_streak(
    athlete_id: str,
    db: Session = Depends(get_db)
):
    """
    Get mood logging streak for the athlete.

    Args:
        athlete_id: Athlete ID
        db: Database session

    Returns:
        Current streak information
    """
    try:
        logger.info(f"Fetching streak for athlete {athlete_id}")

        # TODO: Calculate from database when models are ready
        # For now, return mock data

        return {
            "athlete_id": athlete_id,
            "current_streak": 7,
            "longest_streak": 14,
            "last_log_date": datetime.utcnow().strftime("%Y-%m-%d")
        }

    except Exception as e:
        logger.error(f"Error fetching streak: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{athlete_id}/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    athlete_id: str,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """
    Get complete dashboard data for the athlete.

    This endpoint combines all dashboard data in a single call.

    Args:
        athlete_id: Athlete ID
        days: Number of days for mood trend (default 7)
        db: Database session

    Returns:
        Complete dashboard data
    """
    try:
        logger.info(f"Fetching dashboard for athlete {athlete_id}")

        # Fetch all dashboard components
        mood_trend = await get_mood_trend(athlete_id, days, db)
        goals_progress = await get_goals(athlete_id, db)
        recent_sessions = await get_sessions(athlete_id, db=db, limit=3)
        streak_data = await get_streak(athlete_id, db)

        return DashboardResponse(
            athlete_id=athlete_id,
            streak=streak_data["current_streak"],
            mood_trend=mood_trend,
            goals_progress=goals_progress,
            recent_sessions=recent_sessions
        )

    except Exception as e:
        logger.error(f"Error fetching dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
