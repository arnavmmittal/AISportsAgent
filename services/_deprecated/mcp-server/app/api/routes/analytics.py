"""
Analytics API routes - Performance analytics endpoints.

Provides readiness scores, performance correlations, and predictive analytics.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.db.database import get_db
from app.agents.readiness_engine import ReadinessEngine
from app.core.logging import setup_logging

logger = setup_logging()

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


# ============================================
# PYDANTIC MODELS (Request/Response)
# ============================================

class ReadinessScoreResponse(BaseModel):
    """Readiness score response model."""
    score: float
    level: str
    factors: List[dict]
    gameDate: str
    calculatedAt: str
    rawValues: dict


class TeamReadinessAthleteResponse(BaseModel):
    """Individual athlete readiness in team view."""
    athleteId: str
    athleteName: str
    position: Optional[str]
    score: float
    level: str
    topFactors: List[dict]


class TeamReadinessResponse(BaseModel):
    """Team readiness response model."""
    sport: str
    gameDate: str
    totalAthletes: int
    greenCount: int
    yellowCount: int
    redCount: int
    athletes: List[TeamReadinessAthleteResponse]


# ============================================
# ENDPOINTS
# ============================================

@router.get("/readiness", response_model=ReadinessScoreResponse)
async def get_readiness_score(
    athlete_id: str = Query(..., description="Athlete user ID"),
    game_date: str = Query(..., description="Game date (ISO format: YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get pre-competition readiness score for an athlete.

    Args:
        athlete_id: Athlete user ID
        game_date: Game date in ISO format (YYYY-MM-DD)
        db: Database session

    Returns:
        Readiness score with level, factors, and raw values
    """
    logger.info(f"GET /analytics/readiness - athlete_id: {athlete_id}, game_date: {game_date}")

    try:
        # Parse game date
        try:
            game_datetime = datetime.fromisoformat(game_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid game_date format. Use YYYY-MM-DD")

        # Initialize readiness engine
        engine = ReadinessEngine(db)

        # Calculate readiness score
        result = engine.calculate_readiness_score(
            athlete_id=athlete_id,
            game_date=game_datetime,
            save_to_db=True
        )

        if "error" in result:
            raise HTTPException(status_code=400, detail=result.get("message", "Error calculating readiness"))

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_readiness_score: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/readiness/team", response_model=TeamReadinessResponse)
async def get_team_readiness(
    sport: str = Query(..., description="Sport name (basketball, football, etc.)"),
    school_id: str = Query(..., description="School ID"),
    game_date: str = Query(..., description="Game date (ISO format: YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get readiness scores for all athletes on a team.

    Args:
        sport: Sport name
        school_id: School ID
        game_date: Game date in ISO format (YYYY-MM-DD)
        db: Database session

    Returns:
        Team readiness overview with all athlete scores
    """
    logger.info(f"GET /analytics/readiness/team - sport: {sport}, school: {school_id}, game_date: {game_date}")

    try:
        # Parse game date
        try:
            game_datetime = datetime.fromisoformat(game_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid game_date format. Use YYYY-MM-DD")

        # Initialize readiness engine
        engine = ReadinessEngine(db)

        # Get team readiness
        team_readiness = engine.get_team_readiness(
            sport=sport,
            school_id=school_id,
            game_date=game_datetime
        )

        # Count athletes by level
        green_count = sum(1 for a in team_readiness if a['level'] == 'GREEN')
        yellow_count = sum(1 for a in team_readiness if a['level'] == 'YELLOW')
        red_count = sum(1 for a in team_readiness if a['level'] == 'RED')

        return {
            "sport": sport,
            "gameDate": game_date,
            "totalAthletes": len(team_readiness),
            "greenCount": green_count,
            "yellowCount": yellow_count,
            "redCount": red_count,
            "athletes": team_readiness
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_team_readiness: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/readiness/history")
async def get_readiness_history(
    athlete_id: str = Query(..., description="Athlete user ID"),
    days: int = Query(30, description="Number of days to look back"),
    db: Session = Depends(get_db)
):
    """
    Get historical readiness scores for an athlete.

    Args:
        athlete_id: Athlete user ID
        days: Number of days to look back (default: 30)
        db: Database session

    Returns:
        List of historical readiness scores
    """
    logger.info(f"GET /analytics/readiness/history - athlete_id: {athlete_id}, days: {days}")

    try:
        from app.db import models
        from datetime import timedelta

        # Check if ReadinessScore model exists
        if not hasattr(models, 'ReadinessScore'):
            raise HTTPException(status_code=501, detail="Readiness score history not yet implemented")

        cutoff_date = datetime.now() - timedelta(days=days)

        # Query historical scores
        scores = db.query(models.ReadinessScore).filter(
            models.ReadinessScore.athleteId == athlete_id,
            models.ReadinessScore.calculatedAt >= cutoff_date
        ).order_by(models.ReadinessScore.gameDate.desc()).all()

        return {
            "athleteId": athlete_id,
            "scores": [
                {
                    "gameDate": score.gameDate.isoformat(),
                    "score": score.score,
                    "level": score.level,
                    "calculatedAt": score.calculatedAt.isoformat()
                }
                for score in scores
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_readiness_history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/performance-correlation")
async def get_performance_correlation(
    team_id: Optional[str] = Query(None, description="Team ID (optional, for team-wide analysis)"),
    athlete_id: Optional[str] = Query(None, description="Athlete ID (optional, for individual analysis)"),
    sport: Optional[str] = Query(None, description="Sport name (optional)"),
    days: int = Query(90, description="Number of days to analyze (default: 90)"),
    db: Session = Depends(get_db)
):
    """
    Get mental state → performance correlation analysis.

    NOTE: This is a placeholder endpoint. Full implementation requires:
    - PerformanceMetric data populated
    - Statistical correlation calculation
    - Visualization-ready data format

    Args:
        team_id: Optional team ID for team-wide analysis
        athlete_id: Optional athlete ID for individual analysis
        sport: Optional sport name filter
        days: Number of days to analyze (default: 90)
        db: Database session

    Returns:
        Correlation analysis data
    """
    logger.info(f"GET /analytics/performance-correlation - team: {team_id}, athlete: {athlete_id}, sport: {sport}, days: {days}")

    try:
        # TODO: Implement full correlation analysis
        # This requires:
        # 1. Query PerformanceMetric table (need game stats)
        # 2. Join with MoodLog, ReadinessScore, WearableData
        # 3. Calculate correlations (scipy.stats.pearsonr)
        # 4. Return scatter plot data + regression line

        return {
            "status": "placeholder",
            "message": "Performance correlation analysis coming soon. Need game performance data to calculate correlations.",
            "requirements": [
                "Game performance stats in PerformanceMetric table",
                "At least 10 games worth of data",
                "Mental state data (mood, stress, sleep, HRV)"
            ],
            "exampleResponse": {
                "correlations": [
                    {
                        "metric": "mood_avg_7d",
                        "performanceStat": "shooting_pct",
                        "correlation": 0.68,
                        "pValue": 0.001,
                        "significance": "strong",
                        "interpretation": "Higher mood correlates with better shooting percentage"
                    }
                ],
                "scatterData": [
                    {"x": 7.5, "y": 0.45},  # mood vs shooting_pct
                    {"x": 8.2, "y": 0.52}
                ],
                "regressionLine": {
                    "slope": 0.08,
                    "intercept": -0.15
                }
            }
        }

    except Exception as e:
        logger.error(f"Error in get_performance_correlation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/slump-predictions")
async def get_slump_predictions(
    team_id: Optional[str] = Query(None, description="Team ID (optional)"),
    athlete_id: Optional[str] = Query(None, description="Athlete ID (optional)"),
    sport: Optional[str] = Query(None, description="Sport name (optional)"),
    db: Session = Depends(get_db)
):
    """
    Get performance slump predictions for athletes.

    NOTE: This is a placeholder endpoint. Full implementation requires:
    - Historical performance data
    - Trained ML model (Random Forest or similar)
    - Feature extraction pipeline

    Args:
        team_id: Optional team ID
        athlete_id: Optional athlete ID
        sport: Optional sport name filter
        db: Database session

    Returns:
        Slump prediction data
    """
    logger.info(f"GET /analytics/slump-predictions - team: {team_id}, athlete: {athlete_id}, sport: {sport}")

    try:
        # TODO: Implement slump prediction
        # This requires:
        # 1. Train ML model on historical data (slump_predictor.py)
        # 2. Extract features for current athletes
        # 3. Run inference
        # 4. Return predictions with probabilities

        return {
            "status": "placeholder",
            "message": "Slump prediction coming soon. Requires 3-6 months of pilot data to train ML models.",
            "requirements": [
                "Historical performance data (20+ games per athlete)",
                "Trained ML model (Random Forest classifier)",
                "Feature extraction pipeline",
                "Labeled slump events in training data"
            ],
            "exampleResponse": {
                "predictions": [
                    {
                        "athleteId": "clxyz123",
                        "athleteName": "John Smith",
                        "slumpProbability": 0.72,
                        "riskLevel": "HIGH",
                        "contributingFactors": [
                            {"factor": "mood_declining", "impact": 0.35},
                            {"factor": "sleep_deficit", "impact": 0.25},
                            {"factor": "engagement_drop", "impact": 0.12}
                        ],
                        "recommendedAction": "Check in with athlete today, investigate stressors"
                    }
                ]
            }
        }

    except Exception as e:
        logger.error(f"Error in get_slump_predictions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/optimal-states")
async def get_optimal_states(
    athlete_id: str = Query(..., description="Athlete user ID"),
    db: Session = Depends(get_db)
):
    """
    Get athlete's optimal mental state profile.

    NOTE: This is a placeholder endpoint. Full implementation requires:
    - Performance data to identify top 25% performances
    - Mental state data at those performance times
    - Statistical analysis to find optimal ranges

    Args:
        athlete_id: Athlete user ID
        db: Database session

    Returns:
        Optimal mental state profile
    """
    logger.info(f"GET /analytics/optimal-states - athlete_id: {athlete_id}")

    try:
        # TODO: Implement optimal state profiling
        # This requires:
        # 1. Query top 25% performance games for athlete
        # 2. Get mental state before those games
        # 3. Calculate average optimal state
        # 4. Return ranges and recommendations

        return {
            "status": "placeholder",
            "message": "Optimal state profiling coming soon. Requires performance data to identify peak states.",
            "requirements": [
                "At least 10 games with performance stats",
                "Mental state data before each game",
                "Identification of top 25% performances"
            ],
            "exampleResponse": {
                "athleteId": athlete_id,
                "optimalState": {
                    "mood": {"min": 7.5, "max": 8.5, "avg": 8.0},
                    "stress": {"min": 2.0, "max": 4.0, "avg": 3.0},
                    "sleep": {"min": 7.0, "max": 9.0, "avg": 8.0},
                    "hrv": {"min": 60, "max": 80, "avg": 70}
                },
                "currentState": {
                    "mood": 7.2,
                    "stress": 5.5,
                    "sleep": 6.5,
                    "hrv": 55
                },
                "recommendations": [
                    "Increase sleep by 1-2 hours (currently below optimal)",
                    "Work on stress management (currently above optimal range)"
                ]
            }
        }

    except Exception as e:
        logger.error(f"Error in get_optimal_states: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
