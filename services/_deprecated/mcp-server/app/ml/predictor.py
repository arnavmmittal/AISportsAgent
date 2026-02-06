"""
Performance Predictor with XGBoost and SHAP Explainability

Predicts athlete performance risk using multi-modal features.
Provides explainable predictions with feature importance.
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import pickle
from pathlib import Path
from app.core.logging import setup_logging
from app.core.config import settings

logger = setup_logging()

# Try to import ML libraries
try:
    import xgboost as xgb
    import shap
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    logger.warning("XGBoost/SHAP not available. Using rule-based predictor.")


class PerformancePredictor:
    """
    XGBoost-based performance predictor with SHAP explainability.

    When trained model is not available, uses rule-based heuristics.
    """

    # Feature importance weights for rule-based fallback
    FEATURE_WEIGHTS = {
        "latest_mood": 0.15,
        "latest_confidence": 0.20,
        "latest_stress": -0.15,
        "latest_energy": 0.10,
        "latest_sleep": 0.10,
        "avg_mood": 0.05,
        "mood_trend": 0.08,
        "confidence_trend": 0.10,
        "overall_trend": 0.07,
        "avg_hrv": 0.05,
        "hrv_trend": 0.05,
    }

    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize predictor.

        Args:
            model_path: Path to trained XGBoost model file
        """
        self.model: Optional[Any] = None
        self.explainer: Optional[Any] = None
        self.feature_names: List[str] = []

        if model_path:
            self._load_model(model_path)
        elif XGBOOST_AVAILABLE:
            # Check for model in default location
            default_path = Path(getattr(settings, "MODEL_PATH", "./models")) / "performance_predictor.pkl"
            if default_path.exists():
                self._load_model(str(default_path))

    def _load_model(self, model_path: str) -> bool:
        """Load trained model from file."""
        try:
            with open(model_path, "rb") as f:
                data = pickle.load(f)
                self.model = data.get("model")
                self.feature_names = data.get("feature_names", [])
                logger.info(f"Loaded XGBoost model from {model_path}")
                return True
        except Exception as e:
            logger.warning(f"Could not load model from {model_path}: {e}")
            return False

    def predict(
        self,
        features: Dict[str, float],
        explain: bool = True,
    ) -> Dict[str, Any]:
        """
        Predict performance risk score.

        Args:
            features: Dictionary of feature name -> value
            explain: Whether to include SHAP explanation

        Returns:
            Dictionary with:
            - risk_score: 0-100 (higher = more at risk for poor performance)
            - confidence: Model confidence in prediction
            - risk_level: categorical (low, medium, high, critical)
            - factors: Top contributing factors
            - recommendations: Suggested actions
        """
        if self.model is not None and XGBOOST_AVAILABLE:
            return self._predict_xgboost(features, explain)
        else:
            return self._predict_rule_based(features)

    def _predict_xgboost(
        self,
        features: Dict[str, float],
        explain: bool = True,
    ) -> Dict[str, Any]:
        """Predict using XGBoost model."""
        # Prepare features in correct order
        X = np.array([[features.get(f, 0.0) for f in self.feature_names]])

        # Get prediction probability
        proba = self.model.predict_proba(X)[0]
        risk_score = float(proba[1] * 100)  # Probability of "at risk" class

        result = {
            "risk_score": round(risk_score, 1),
            "confidence": float(max(proba) * 100),
            "risk_level": self._categorize_risk(risk_score),
        }

        # SHAP explanation
        if explain:
            try:
                if self.explainer is None:
                    self.explainer = shap.TreeExplainer(self.model)

                shap_values = self.explainer.shap_values(X)

                # Get top contributing factors
                if isinstance(shap_values, list):
                    shap_vals = shap_values[1][0]  # Class 1 (at risk)
                else:
                    shap_vals = shap_values[0]

                factors = self._extract_top_factors(shap_vals, features)
                result["factors"] = factors

            except Exception as e:
                logger.warning(f"SHAP explanation failed: {e}")
                result["factors"] = self._get_rule_based_factors(features)

        result["recommendations"] = self._generate_recommendations(
            result.get("factors", []),
            result["risk_level"],
        )

        return result

    def _predict_rule_based(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Rule-based prediction when ML model is not available.

        Uses weighted sum of normalized features.
        """
        # Calculate weighted score
        score = 50.0  # Start at neutral

        for feat, weight in self.FEATURE_WEIGHTS.items():
            value = features.get(feat, 5.0)

            # Normalize to 0-10 scale
            if feat.startswith("latest_") or feat.startswith("avg_"):
                normalized = value / 10.0
            elif "_trend" in feat:
                # Trends are typically -1 to 1
                normalized = (value + 1) / 2
            else:
                normalized = value / 10.0

            # Adjust score (positive weight = lower risk when high)
            adjustment = weight * (normalized - 0.5) * 100

            # Reverse for negative indicators
            if feat == "latest_stress" or feat == "topic_anxiety_freq":
                adjustment = -adjustment

            score -= adjustment  # Subtract because high positive -> lower risk

        # Clamp to 0-100
        risk_score = max(0, min(100, score))

        factors = self._get_rule_based_factors(features)
        risk_level = self._categorize_risk(risk_score)

        return {
            "risk_score": round(risk_score, 1),
            "confidence": 70.0,  # Lower confidence for rule-based
            "risk_level": risk_level,
            "factors": factors,
            "recommendations": self._generate_recommendations(factors, risk_level),
            "method": "rule_based",
        }

    def _extract_top_factors(
        self,
        shap_values: np.ndarray,
        features: Dict[str, float],
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Extract top contributing factors from SHAP values."""
        factors = []

        # Sort by absolute SHAP value
        indices = np.argsort(np.abs(shap_values))[::-1][:top_k]

        for idx in indices:
            feat_name = self.feature_names[idx]
            shap_val = float(shap_values[idx])
            feat_val = features.get(feat_name, 0.0)

            # Determine direction
            direction = "increases" if shap_val > 0 else "decreases"

            factors.append({
                "feature": feat_name,
                "value": round(feat_val, 2),
                "impact": round(abs(shap_val), 3),
                "direction": direction,
                "description": self._describe_factor(feat_name, feat_val, shap_val),
            })

        return factors

    def _get_rule_based_factors(
        self,
        features: Dict[str, float],
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Get top factors using rule-based analysis."""
        factors = []

        # Check each feature against thresholds
        risk_indicators = [
            ("latest_mood", features.get("latest_mood", 5), lambda v: v < 4, "Low mood"),
            ("latest_confidence", features.get("latest_confidence", 5), lambda v: v < 4, "Low confidence"),
            ("latest_stress", features.get("latest_stress", 5), lambda v: v > 7, "High stress"),
            ("latest_sleep", features.get("latest_sleep", 7), lambda v: v < 6, "Poor sleep"),
            ("latest_energy", features.get("latest_energy", 5), lambda v: v < 4, "Low energy"),
            ("mood_trend", features.get("mood_trend", 0), lambda v: v < -0.2, "Declining mood"),
            ("confidence_trend", features.get("confidence_trend", 0), lambda v: v < -0.2, "Declining confidence"),
            ("overall_trend", features.get("overall_trend", 0), lambda v: v < -0.3, "Overall decline"),
            ("delta_stress", features.get("delta_stress", 0), lambda v: v > 1, "Rising stress"),
            ("hrv_trend", features.get("hrv_trend", 0), lambda v: v < -0.1, "Declining HRV"),
        ]

        for feat_name, value, is_risk, description in risk_indicators:
            if is_risk(value):
                factors.append({
                    "feature": feat_name,
                    "value": round(value, 2),
                    "impact": abs(value - 5) / 5,  # Approximate impact
                    "direction": "increases",
                    "description": description,
                })

        # Sort by impact and return top k
        factors.sort(key=lambda x: x["impact"], reverse=True)
        return factors[:top_k]

    def _describe_factor(self, feature: str, value: float, shap_val: float) -> str:
        """Generate human-readable description of factor."""
        descriptions = {
            "latest_mood": f"Current mood score ({value:.1f}/10)",
            "latest_confidence": f"Current confidence level ({value:.1f}/10)",
            "latest_stress": f"Current stress level ({value:.1f}/10)",
            "latest_sleep": f"Recent sleep quality ({value:.1f}/10)",
            "latest_energy": f"Current energy level ({value:.1f}/10)",
            "mood_trend": f"Mood trend over past weeks ({'improving' if value > 0 else 'declining'})",
            "confidence_trend": f"Confidence trend ({'improving' if value > 0 else 'declining'})",
            "overall_trend": f"Overall mental state trend ({'improving' if value > 0 else 'declining'})",
            "avg_hrv": f"Average heart rate variability ({value:.1f}ms)",
            "hrv_trend": f"HRV trend ({'improving' if value > 0 else 'declining'})",
            "log_frequency": f"Self-check engagement ({value:.2f}/day)",
        }

        return descriptions.get(feature, f"{feature}: {value:.2f}")

    def _categorize_risk(self, risk_score: float) -> str:
        """Categorize risk score into levels."""
        if risk_score < 25:
            return "low"
        elif risk_score < 50:
            return "medium"
        elif risk_score < 75:
            return "high"
        else:
            return "critical"

    def _generate_recommendations(
        self,
        factors: List[Dict[str, Any]],
        risk_level: str,
    ) -> List[str]:
        """Generate actionable recommendations based on risk factors."""
        recommendations = []

        # Factor-specific recommendations
        factor_recs = {
            "latest_stress": "Consider a stress management technique like 4-7-8 breathing or progressive muscle relaxation",
            "latest_sleep": "Focus on sleep hygiene - consistent bedtime, no screens before bed",
            "latest_mood": "Try a mood-boosting activity: exercise, social connection, or gratitude journaling",
            "latest_confidence": "Review past successes and use visualization techniques before competition",
            "latest_energy": "Check nutrition and hydration; consider a brief rest or light activity",
            "mood_trend": "Schedule a check-in with coach or support staff to discuss recent challenges",
            "confidence_trend": "Set small achievable goals to rebuild confidence gradually",
            "overall_trend": "Consider a conversation with the AI coach to explore what's been challenging",
            "hrv_trend": "Focus on recovery: rest, nutrition, and stress management",
            "delta_stress": "Identify recent stressors and develop coping strategies",
        }

        for factor in factors[:3]:  # Top 3 factors
            feat = factor["feature"]
            if feat in factor_recs:
                recommendations.append(factor_recs[feat])

        # Risk level recommendations
        if risk_level == "critical":
            recommendations.insert(0, "Consider reaching out to coaching staff or mental health support")
        elif risk_level == "high":
            recommendations.insert(0, "Prioritize recovery and stress management before next competition")

        # Deduplicate
        return list(dict.fromkeys(recommendations))[:5]


# Convenience functions
def predict_performance(
    features: Dict[str, float],
    explain: bool = True,
) -> Dict[str, Any]:
    """
    Predict performance risk for an athlete.

    Convenience wrapper around PerformancePredictor.
    """
    predictor = PerformancePredictor()
    return predictor.predict(features, explain)


def get_performance_risk(
    mood_logs: List[Dict[str, Any]],
    biometrics: Optional[List[Dict[str, Any]]] = None,
    chat_sessions: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Get performance risk from raw athlete data.

    Combines feature extraction and prediction.
    """
    from .feature_extractor import FeatureExtractor

    extractor = FeatureExtractor()
    features = extractor.extract_features(
        mood_logs=mood_logs,
        biometrics=biometrics,
        chat_sessions=chat_sessions,
    )

    predictor = PerformancePredictor()
    return predictor.predict(features)
