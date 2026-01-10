"""
ML Prediction API Routes

Endpoints for performance prediction, slump detection, and intervention recommendations.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.logging import setup_logging
from app.db.database import get_db

logger = setup_logging()
router = APIRouter()


# Request/Response Models
class MoodLogInput(BaseModel):
    """Mood log entry for prediction."""
    date: Optional[str] = None
    mood: float = Field(..., ge=1, le=10)
    confidence: float = Field(..., ge=1, le=10)
    stress: float = Field(..., ge=1, le=10)
    energy: Optional[float] = Field(None, ge=1, le=10)
    sleep: Optional[float] = Field(None, ge=1, le=10)


class BiometricInput(BaseModel):
    """Biometric data entry."""
    date: Optional[str] = None
    hrv: Optional[float] = None
    resting_hr: Optional[float] = None
    sleep_score: Optional[float] = None
    recovery_score: Optional[float] = None


class PerformanceInput(BaseModel):
    """Performance outcome entry."""
    date: Optional[str] = None
    rating: float = Field(..., ge=1, le=10)


class PredictionRequest(BaseModel):
    """Request for performance prediction."""
    mood_logs: List[MoodLogInput]
    biometrics: Optional[List[BiometricInput]] = None
    performance_data: Optional[List[PerformanceInput]] = None


class SlumpDetectionRequest(BaseModel):
    """Request for slump detection."""
    mood_logs: List[MoodLogInput]
    biometrics: Optional[List[BiometricInput]] = None
    performance_data: Optional[List[PerformanceInput]] = None


class CorrelationRequest(BaseModel):
    """Request for correlation analysis."""
    mood_logs: List[MoodLogInput]
    biometrics: Optional[List[BiometricInput]] = None
    performance_data: Optional[List[PerformanceInput]] = None
    method: str = "pearson"


class InterventionRequest(BaseModel):
    """Request for intervention recommendations."""
    risk_factors: List[Dict[str, Any]]
    context: Optional[str] = None  # PRE_GAME, POST_GAME, MORNING, etc.
    past_interventions: Optional[List[Dict[str, Any]]] = None


@router.post("/predictions/risk")
async def predict_performance_risk(request: PredictionRequest):
    """
    Predict performance risk based on mood, biometric, and performance data.

    Returns:
    - risk_score: 0-100 (higher = more at risk)
    - risk_level: low, medium, high, critical
    - factors: Top contributing factors with SHAP-like explanations
    - recommendations: Suggested interventions
    """
    try:
        from app.ml import (
            extract_athlete_features,
            predict_performance,
        )

        # Convert to dictionaries
        mood_logs = [log.model_dump() for log in request.mood_logs]
        biometrics = [bio.model_dump() for bio in request.biometrics] if request.biometrics else None
        performance_data = [perf.model_dump() for perf in request.performance_data] if request.performance_data else None

        # Extract features
        features = extract_athlete_features(
            mood_logs=mood_logs,
            biometrics=biometrics,
            performance_data=performance_data,
        )

        # Predict
        prediction = predict_performance(features, explain=True)

        return prediction

    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predictions/slump")
async def detect_slump(request: SlumpDetectionRequest):
    """
    Detect slump patterns in athlete data.

    Returns:
    - slump_detected: boolean
    - slump_probability: 0-100
    - slump_type: identified pattern
    - indicators: specific warning signs
    - trend_scores: metric trend analysis
    - recommendations: intervention suggestions
    """
    try:
        from app.ml import detect_slump_patterns

        mood_logs = [log.model_dump() for log in request.mood_logs]
        biometrics = [bio.model_dump() for bio in request.biometrics] if request.biometrics else None
        performance_data = [perf.model_dump() for perf in request.performance_data] if request.performance_data else None

        result = detect_slump_patterns(
            mood_logs=mood_logs,
            performance_data=performance_data,
            biometrics=biometrics,
        )

        return result

    except Exception as e:
        logger.error(f"Slump detection error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predictions/correlations")
async def compute_correlations(request: CorrelationRequest):
    """
    Compute correlations between metrics.

    Returns:
    - correlation_matrix: Full pairwise correlations
    - significant_correlations: Statistically significant only
    - strongest_positive/negative: Top correlations
    - insights: Human-readable interpretations
    """
    try:
        from app.ml import compute_correlations as ml_compute_correlations

        mood_logs = [log.model_dump() for log in request.mood_logs]
        biometrics = [bio.model_dump() for bio in request.biometrics] if request.biometrics else None
        performance_data = [perf.model_dump() for perf in request.performance_data] if request.performance_data else None

        result = ml_compute_correlations(
            mood_logs=mood_logs,
            biometrics=biometrics,
            performance_data=performance_data,
            method=request.method,
        )

        return result

    except Exception as e:
        logger.error(f"Correlation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predictions/interventions")
async def recommend_interventions(request: InterventionRequest):
    """
    Get intervention recommendations based on risk factors.

    Returns:
    - recommendations: Ranked list of interventions
    - primary_protocol: Detailed steps for top recommendation
    - target_areas: Identified target areas
    """
    try:
        from app.ml import recommend_interventions as ml_recommend

        result = ml_recommend(
            risk_factors=request.risk_factors,
            context=request.context,
            past_interventions=request.past_interventions,
        )

        return result

    except Exception as e:
        logger.error(f"Recommendation error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predictions/athlete/{athlete_id}")
async def get_athlete_prediction(
    athlete_id: str,
    days: int = 14,
    db: Session = Depends(get_db),
):
    """
    Get performance prediction for a specific athlete.

    Fetches data from database and returns prediction.
    """
    try:
        from app.ml import get_performance_risk, detect_slump_patterns

        # Fetch mood logs from database
        from app.db.models import MoodLog, Biometric
        from datetime import timedelta

        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Get mood logs
        mood_logs = db.query(MoodLog).filter(
            MoodLog.athlete_id == athlete_id,
            MoodLog.created_at >= cutoff_date,
        ).order_by(MoodLog.created_at).all()

        if not mood_logs:
            raise HTTPException(status_code=404, detail="No mood data found for athlete")

        # Convert to dicts
        mood_data = [
            {
                "date": log.created_at.isoformat(),
                "mood": log.mood,
                "confidence": log.confidence,
                "stress": log.stress,
                "energy": log.energy,
                "sleep": log.sleep,
            }
            for log in mood_logs
        ]

        # Get biometrics if available
        biometrics = db.query(Biometric).filter(
            Biometric.athlete_id == athlete_id,
            Biometric.created_at >= cutoff_date,
        ).order_by(Biometric.created_at).all()

        bio_data = [
            {
                "date": bio.created_at.isoformat(),
                "hrv": bio.hrv,
                "resting_hr": bio.resting_hr,
                "sleep_score": bio.sleep_score,
            }
            for bio in biometrics
        ] if biometrics else None

        # Get predictions
        risk_prediction = get_performance_risk(
            mood_logs=mood_data,
            biometrics=bio_data,
        )

        slump_detection = detect_slump_patterns(
            mood_logs=mood_data,
            biometrics=bio_data,
        )

        return {
            "athlete_id": athlete_id,
            "prediction": risk_prediction,
            "slump_analysis": slump_detection,
            "data_points": len(mood_data),
            "date_range": {
                "start": mood_data[0]["date"] if mood_data else None,
                "end": mood_data[-1]["date"] if mood_data else None,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Athlete prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predictions/status")
async def prediction_status():
    """Get ML prediction service status."""
    try:
        # Check if ML modules are available
        ml_status = {
            "available": True,
            "components": {
                "feature_extractor": True,
                "performance_predictor": True,
                "slump_detector": True,
                "correlation_engine": True,
                "intervention_recommender": True,
            },
        }

        # Check for optional dependencies
        try:
            import xgboost
            ml_status["xgboost_available"] = True
        except ImportError:
            ml_status["xgboost_available"] = False

        try:
            import shap
            ml_status["shap_available"] = True
        except ImportError:
            ml_status["shap_available"] = False

        try:
            from scipy import stats
            ml_status["scipy_available"] = True
        except ImportError:
            ml_status["scipy_available"] = False

        return {
            "status": "operational",
            "ml": ml_status,
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
        }
