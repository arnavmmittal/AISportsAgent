"""
ML Prediction Engine

Advanced machine learning components for athlete performance prediction:

Components:
1. FeatureExtractor - Extract features from multi-modal athlete data
2. PerformancePredictor - XGBoost-based performance prediction with SHAP
3. SlumpDetector - Pattern-based slump/decline detection
4. CorrelationEngine - Statistical correlation analysis
5. InterventionRecommender - Evidence-based intervention recommendations

All models are designed to work with limited data (typical for sports teams)
and provide explainable predictions.
"""

from .feature_extractor import (
    FeatureExtractor,
    extract_athlete_features,
    extract_temporal_features,
)

from .predictor import (
    PerformancePredictor,
    predict_performance,
    get_performance_risk,
)

from .slump_detector import (
    SlumpDetector,
    detect_slump_patterns,
    calculate_trend_score,
)

from .correlation_engine import (
    CorrelationEngine,
    compute_correlations,
    find_significant_correlations,
)

from .intervention_recommender import (
    InterventionRecommender,
    recommend_interventions,
    get_intervention_priority,
)

__all__ = [
    # Feature extraction
    "FeatureExtractor",
    "extract_athlete_features",
    "extract_temporal_features",
    # Prediction
    "PerformancePredictor",
    "predict_performance",
    "get_performance_risk",
    # Slump detection
    "SlumpDetector",
    "detect_slump_patterns",
    "calculate_trend_score",
    # Correlation analysis
    "CorrelationEngine",
    "compute_correlations",
    "find_significant_correlations",
    # Intervention recommendations
    "InterventionRecommender",
    "recommend_interventions",
    "get_intervention_priority",
]
